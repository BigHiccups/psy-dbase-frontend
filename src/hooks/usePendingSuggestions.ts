import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { billingHappensOnDate } from "../lib/billings-date";
import type { AppointmentWithRelations, ProviderBilling } from "../types";

export type SuggestionSession = { kind: "session"; id: string; appointment: AppointmentWithRelations; suggested_amount_cents: number | null; suggested_date: string; };
export type SuggestionBilling = { kind: "billing"; id: string; billing: ProviderBilling & { provider_name: string }; suggested_amount_cents: number; suggested_date: string; };
export type SuggestionPersonal = { kind: "personal"; id: string; appointment: AppointmentWithRelations; suggested_amount_cents: number | null; suggested_date: string; };
export type Suggestion = SuggestionSession | SuggestionBilling | SuggestionPersonal;

function getBillingOccurrenceThisMonth(bill: ProviderBilling, targetMonth: string): string | null {
  const [y, m] = targetMonth.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const effectiveDay = Math.min(bill.due_day, lastDay);
  const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(effectiveDay).padStart(2, "0")}`;
  if (billingHappensOnDate(bill.starts_on, bill.due_day, bill.frequency, dateStr, bill.due_month)) return dateStr;
  return null;
}

function toISODate(d: Date) { return d.toISOString().slice(0, 10); }

export function usePendingSuggestions(targetMonth: string) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [year, month] = targetMonth.split("-").map(Number);
      const nextMonthDate = new Date(year, month, 1);
      const monthEnd = toISODate(nextMonthDate);
      const sixMonthsAgoDate = new Date(year, month - 6, 1);
      const searchStartDate = toISODate(sixMonthsAgoDate);

      // A) Sessões (Apenas ACTIVE - as realizadas e no-show não entram mais aqui)
      const { data: sessionRaw, error: sessionErr } = await supabase
        .from("appointments")
        .select(`*, patient:patients!patient_id (id, full_name, session_price_cents)`)
        .eq("type", "session")
        .eq("status", "active") // <-- MUDANÇA AQUI
        .not("patient_id", "is", null)
        .gte("starts_on", searchStartDate)
        .lt("starts_on", monthEnd)
        .order("starts_on", { ascending: false })
        .limit(300);

      if (sessionErr) throw new Error(sessionErr.message);

      const sessions = (sessionRaw ?? []) as any[];
      const sessionPatientIds = [...new Set(sessions.map((s) => s.patient_id).filter(Boolean))];

      let incomeRows: { patient_id: string; occurred_on: string }[] = [];
      if (sessionPatientIds.length > 0) {
        const { data } = await supabase
          .from("transactions")
          .select("patient_id, occurred_on")
          .eq("type", "income")
          .in("patient_id", sessionPatientIds)
          .gte("occurred_on", searchStartDate)
          .lt("occurred_on", monthEnd);
        incomeRows = data ?? [];
      }
      const incomeSet = new Set(incomeRows.map((t) => `${t.patient_id}|${t.occurred_on}`));

      const { data: dismissedAppts } = await supabase
        .from("dismissed_suggestions")
        .select("target_id, reference_date")
        .eq("target_type", "appointment")
        .gte("reference_date", searchStartDate)
        .lt("reference_date", monthEnd);
      
      const dismissedApptSet = new Set((dismissedAppts ?? []).map((d) => `${d.target_id}|${d.reference_date}`));

      const sessionSuggestions: SuggestionSession[] = sessions
        .filter((s) => !incomeSet.has(`${s.patient_id}|${s.starts_on}`))
        .filter((s) => !dismissedApptSet.has(`${s.id}|${s.starts_on}`))
        .map((s) => ({
          kind: "session" as const, id: s.id,
          appointment: { ...s, patient: s.patient ? { id: s.patient.id, full_name: s.patient.full_name } : null } as any,
          suggested_amount_cents: s.patient?.session_price_cents ?? null,
          suggested_date: s.starts_on,
        }));

      // B) Compromissos (Personal)
      const { data: personalRaw, error: personalErr } = await supabase
        .from("appointments")
        .select(`*, provider:providers!provider_id (id, display_name, kind, session_price_cents)`)
        .eq("type", "personal")
        .eq("status", "active") // <-- MUDANÇA AQUI
        .not("provider_id", "is", null)
        .gte("starts_on", searchStartDate)
        .lt("starts_on", monthEnd)
        .order("starts_on", { ascending: false })
        .limit(300);

      if (personalErr) throw new Error(personalErr.message);

      const personals = (personalRaw ?? []) as any[];
      const personalProviderIds = [...new Set(personals.map((p) => p.provider_id).filter(Boolean))];

      let expenseRows: { provider_id: string; occurred_on: string }[] = [];
      if (personalProviderIds.length > 0) {
        const { data } = await supabase
          .from("transactions")
          .select("provider_id, occurred_on")
          .eq("type", "expense")
          .in("provider_id", personalProviderIds)
          .gte("occurred_on", searchStartDate)
          .lt("occurred_on", monthEnd);
        expenseRows = data ?? [];
      }
      const expenseSet = new Set(expenseRows.map((t) => `${t.provider_id}|${t.occurred_on}`));

      const personalSuggestions: SuggestionPersonal[] = personals
        .filter((p) => !expenseSet.has(`${p.provider_id}|${p.starts_on}`))
        .filter((p) => !dismissedApptSet.has(`${p.id}|${p.starts_on}`))
        .map((p) => ({
          kind: "personal" as const, id: p.id,
          appointment: { ...p, provider: p.provider ? { id: p.provider.id, display_name: p.provider.display_name } : null } as any,
          suggested_amount_cents: p.provider?.session_price_cents ?? null,
          suggested_date: p.starts_on,
        }));

      // C) Vencimentos
      const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
      const { data: billsRaw, error: billErr } = await supabase
        .from("provider_billings")
        .select(`*, provider:providers!provider_id (display_name)`)
        .eq("status", "active");

      if (billErr) throw new Error(billErr.message);

      const bills = (billsRaw ?? []) as any[];
      const billIds = bills.map((b) => b.id);

      let billingPaidRows: { billing_id: string | null; occurred_on: string }[] = [];
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
      const billingPaidThisMonth = new Set(billingPaidRows.map((t) => t.billing_id).filter(Boolean) as string[]);

      const { data: dismissedBills } = await supabase
        .from("dismissed_suggestions")
        .select("target_id, reference_date")
        .eq("target_type", "billing")
        .eq("reference_date", monthStart);
      const dismissedBillSet = new Set((dismissedBills ?? []).map((d) => d.target_id));

      const billingSuggestions: SuggestionBilling[] = bills
        .map((b) => {
          const occurrence = getBillingOccurrenceThisMonth(b, targetMonth);
          if (!occurrence) return null;
          if (billingPaidThisMonth.has(b.id)) return null;
          if (dismissedBillSet.has(b.id)) return null;

          const { provider, ...rest } = b as any;
          return {
            kind: "billing" as const, id: b.id,
            billing: { ...rest, provider_name: provider?.display_name ?? "Empresa" } as any,
            suggested_amount_cents: b.amount_cents,
            suggested_date: occurrence,
          };
        })
        .filter((x): x is SuggestionBilling => x !== null);

      setSuggestions([...sessionSuggestions, ...personalSuggestions, ...billingSuggestions].sort(
        (a, b) => new Date(a.suggested_date).getTime() - new Date(b.suggested_date).getTime()
      ));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar sugestões.");
    } finally {
      setLoading(false);
    }
  }, [targetMonth]);

  useEffect(() => { load(); }, [load]);

  async function approveSingle(s: Suggestion): Promise<void> {
    const payload = { 
      p_appointment_ids: s.kind === "session" ? [s.id] : [], 
      p_billing_ids: s.kind === "billing" ? [s.id] : [], 
      p_personal_ids: s.kind === "personal" ? [s.id] : [] 
    };
    const { error } = await supabase.rpc("bulk_approve_suggestions", payload);
    if (error) throw new Error(error.message);
    await load();
  }

  async function approveAll(): Promise<number> {
    const apptIds = suggestions.filter((s): s is SuggestionSession => s.kind === "session").map((s) => s.id);
    const billIds = suggestions.filter((s): s is SuggestionBilling => s.kind === "billing").map((s) => s.id);
    const persIds = suggestions.filter((s): s is SuggestionPersonal => s.kind === "personal").map((s) => s.id);
    
    const { data, error } = await supabase.rpc("bulk_approve_suggestions", { 
      p_appointment_ids: apptIds, 
      p_billing_ids: billIds, 
      p_personal_ids: persIds 
    });
    
    if (error) throw new Error(error.message);
    await load();
    return (data as number) ?? 0;
  }

  async function dismiss(s: Suggestion): Promise<void> {
    const [year, month] = targetMonth.split("-").map(Number);
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const referenceDate = s.kind === "billing" ? monthStart : s.suggested_date;
    const { error } = await supabase.rpc("dismiss_suggestion", { 
      p_target_type: s.kind === "billing" ? "billing" : "appointment", 
      p_target_id: s.id, 
      p_reference_date: referenceDate 
    });
    if (error) throw new Error(error.message);
    await load();
  }

  return { suggestions, loading, error, reload: load, approveSingle, approveAll, dismiss };
}