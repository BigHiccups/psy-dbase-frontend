import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { billingHappensOnDate } from "../lib/billings-date";
import type { AppointmentWithRelations, ProviderBilling } from "../types";

// ============================================================
// Tipos de sugestão
// ============================================================
export type SuggestionSession = {
  kind: "session";
  id: string;
  appointment: AppointmentWithRelations;
  suggested_amount_cents: number | null;
  suggested_date: string;
};

export type SuggestionBilling = {
  kind: "billing";
  id: string;
  billing: ProviderBilling & { provider_name: string };
  suggested_amount_cents: number;
  suggested_date: string;
};

export type SuggestionPersonal = {
  kind: "personal";
  id: string;
  appointment: AppointmentWithRelations;
  suggested_amount_cents: number | null;
  suggested_date: string;
};

export type Suggestion =
  | SuggestionSession
  | SuggestionBilling
  | SuggestionPersonal;

// ============================================================
// Helpers
// ============================================================
function getBillingOccurrenceThisMonth(bill: ProviderBilling): string | null {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const lastDay = new Date(y, m, 0).getDate();
  const effectiveDay = Math.min(bill.due_day, lastDay);
  const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(effectiveDay).padStart(2, "0")}`;

  if (
    billingHappensOnDate(
      bill.starts_on,
      bill.due_day,
      bill.frequency,
      dateStr,
      bill.due_month
    )
  ) {
    return dateStr;
  }
  return null;
}

function currentMonthFirstDay(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ============================================================
// Hook
// ============================================================
export function usePendingSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const now = new Date();

      // Janela: últimos 30 dias até hoje (sessões passadas)
      const today = toISODate(now);
      const thirtyDaysAgo = toISODate(
        new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      );

      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const monthEnd = toISODate(nextMonth);

      // ==========================================
      // A) Sessões (income / paciente)
      // ==========================================
      const { data: sessionRaw, error: sessionErr } = await supabase
        .from("appointments")
        .select(
          `
          *,
          patient:patients!patient_id (id, full_name, session_price_cents)
        `
        )
        .eq("type", "session")
        .in("status", ["active", "completed"])
        .not("patient_id", "is", null)
        .gte("starts_on", thirtyDaysAgo)
        .lt("starts_on", today)
        .order("starts_on", { ascending: false })
        .limit(300);

      if (sessionErr) throw new Error(sessionErr.message);

      type SessionRaw = {
        id: string;
        patient_id: string;
        starts_on: string;
        [key: string]: unknown;
        patient:
          | { id: string; full_name: string; session_price_cents: number | null }
          | null;
      };

      const sessions = (sessionRaw ?? []) as unknown as SessionRaw[];
      const sessionPatientIds = [
        ...new Set(sessions.map((s) => s.patient_id).filter(Boolean)),
      ];

      let incomeRows: { patient_id: string; occurred_on: string }[] = [];
      if (sessionPatientIds.length > 0) {
        const { data } = await supabase
          .from("transactions")
          .select("patient_id, occurred_on")
          .eq("type", "income")
          .in("patient_id", sessionPatientIds);
        incomeRows = data ?? [];
      }
      const incomeSet = new Set(
        incomeRows.map((t) => `${t.patient_id}|${t.occurred_on}`)
      );

      const { data: dismissedAppts } = await supabase
        .from("dismissed_suggestions")
        .select("target_id, reference_date")
        .eq("target_type", "appointment");
      const dismissedApptSet = new Set(
        (dismissedAppts ?? []).map((d) => `${d.target_id}|${d.reference_date}`)
      );

      const sessionSuggestions: SuggestionSession[] = sessions
        .filter((s) => !incomeSet.has(`${s.patient_id}|${s.starts_on}`))
        .filter((s) => !dismissedApptSet.has(`${s.id}|${s.starts_on}`))
        .map((s) => ({
          kind: "session" as const,
          id: s.id,
          appointment: {
            ...s,
            patient: s.patient
              ? { id: s.patient.id, full_name: s.patient.full_name }
              : null,
          } as unknown as AppointmentWithRelations,
          suggested_amount_cents: s.patient?.session_price_cents ?? null,
          suggested_date: s.starts_on,
        }));

      // ==========================================
      // B) Personal (expense / provider person)
      // ==========================================
      const { data: personalRaw, error: personalErr } = await supabase
        .from("appointments")
        .select(
          `
          *,
          provider:providers!provider_id (id, display_name, kind, session_price_cents)
        `
        )
        .eq("type", "personal")
        .in("status", ["active", "completed"])
        .not("provider_id", "is", null)
        .gte("starts_on", thirtyDaysAgo)
        .lt("starts_on", today)
        .order("starts_on", { ascending: false })
        .limit(300);

      if (personalErr) throw new Error(personalErr.message);

      type PersonalRaw = {
        id: string;
        provider_id: string;
        starts_on: string;
        [key: string]: unknown;
        provider:
          | {
              id: string;
              display_name: string;
              kind: "person" | "company";
              session_price_cents: number | null;
            }
          | null;
      };

      const personals = (personalRaw ?? []) as unknown as PersonalRaw[];
      const personalProviderIds = [
        ...new Set(personals.map((p) => p.provider_id).filter(Boolean)),
      ];

      let expenseRows: { provider_id: string; occurred_on: string }[] = [];
      if (personalProviderIds.length > 0) {
        const { data } = await supabase
          .from("transactions")
          .select("provider_id, occurred_on")
          .eq("type", "expense")
          .in("provider_id", personalProviderIds);
        expenseRows = data ?? [];
      }
      const expenseSet = new Set(
        expenseRows.map((t) => `${t.provider_id}|${t.occurred_on}`)
      );

      const personalSuggestions: SuggestionPersonal[] = personals
        .filter((p) => !expenseSet.has(`${p.provider_id}|${p.starts_on}`))
        .filter((p) => !dismissedApptSet.has(`${p.id}|${p.starts_on}`))
        .map((p) => ({
          kind: "personal" as const,
          id: p.id,
          appointment: {
            ...p,
            provider: p.provider
              ? { id: p.provider.id, display_name: p.provider.display_name }
              : null,
          } as unknown as AppointmentWithRelations,
          suggested_amount_cents: p.provider?.session_price_cents ?? null,
          suggested_date: p.starts_on,
        }));

      // ==========================================
      // C) Billings (expense / company)
      // ==========================================
      const { data: billsRaw, error: billErr } = await supabase
        .from("provider_billings")
        .select(
          `
          *,
          provider:providers!provider_id (display_name)
        `
        )
        .eq("status", "active");

      if (billErr) throw new Error(billErr.message);

      type BillRaw = ProviderBilling & {
        provider: { display_name: string } | null;
      };
      const bills = (billsRaw ?? []) as unknown as BillRaw[];
      const billIds = bills.map((b) => b.id);

      let billingPaidRows: { billing_id: string | null; occurred_on: string }[] =
        [];
      if (billIds.length > 0) {
        const { data } = await supabase
          .from("transactions")
          .select("billing_id, occurred_on")
          .eq("type", "expense")
          .in("billing_id", billIds)
          .gte("occurred_on", monthStart)
          .lt("occurred_on", monthEnd);
        billingPaidRows = data ?? [];
      }
      const billingPaidThisMonth = new Set(
        billingPaidRows.map((t) => t.billing_id).filter(Boolean) as string[]
      );

      const monthFirst = currentMonthFirstDay();
      const { data: dismissedBills } = await supabase
        .from("dismissed_suggestions")
        .select("target_id, reference_date")
        .eq("target_type", "billing")
        .eq("reference_date", monthFirst);
      const dismissedBillSet = new Set(
        (dismissedBills ?? []).map((d) => d.target_id)
      );

      const billingSuggestions: SuggestionBilling[] = bills
        .map((b) => {
          const occurrence = getBillingOccurrenceThisMonth(b);
          if (!occurrence) return null;
          if (billingPaidThisMonth.has(b.id)) return null;
          if (dismissedBillSet.has(b.id)) return null;

          const { provider, ...rest } = b as BillRaw;
          return {
            kind: "billing" as const,
            id: b.id,
            billing: {
              ...rest,
              provider_name: provider?.display_name ?? "Empresa",
            } as ProviderBilling & { provider_name: string },
            suggested_amount_cents: b.amount_cents,
            suggested_date: occurrence,
          };
        })
        .filter((x): x is SuggestionBilling => x !== null);

      setSuggestions([
        ...sessionSuggestions,
        ...personalSuggestions,
        ...billingSuggestions,
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar sugestões."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ==========================================
  // Ações
  // ==========================================
  async function approveSingle(s: Suggestion): Promise<void> {
    const payload = {
      p_appointment_ids: s.kind === "session" ? [s.id] : [],
      p_billing_ids: s.kind === "billing" ? [s.id] : [],
      p_personal_ids: s.kind === "personal" ? [s.id] : [],
    };

    const { error } = await supabase.rpc("bulk_approve_suggestions", payload);
    if (error) throw new Error(error.message);
    await load();
  }

  async function approveAll(): Promise<number> {
    const apptIds = suggestions
      .filter((s): s is SuggestionSession => s.kind === "session")
      .map((s) => s.id);
    const billIds = suggestions
      .filter((s): s is SuggestionBilling => s.kind === "billing")
      .map((s) => s.id);
    const persIds = suggestions
      .filter((s): s is SuggestionPersonal => s.kind === "personal")
      .map((s) => s.id);

    const { data, error } = await supabase.rpc("bulk_approve_suggestions", {
      p_appointment_ids: apptIds,
      p_billing_ids: billIds,
      p_personal_ids: persIds,
    });

    if (error) throw new Error(error.message);
    await load();
    return (data as number) ?? 0;
  }

  async function dismiss(s: Suggestion): Promise<void> {
    const referenceDate =
      s.kind === "billing"
        ? currentMonthFirstDay()
        : s.kind === "session" || s.kind === "personal"
          ? s.suggested_date
          : currentMonthFirstDay();

    const { error } = await supabase.rpc("dismiss_suggestion", {
      p_target_type: s.kind === "billing" ? "billing" : "appointment",
      p_target_id: s.id,
      p_reference_date: referenceDate,
    });

    if (error) throw new Error(error.message);
    await load();
  }

  return {
    suggestions,
    loading,
    error,
    reload: load,
    approveSingle,
    approveAll,
    dismiss,
  };
}