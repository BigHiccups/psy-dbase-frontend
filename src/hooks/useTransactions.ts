import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Transaction, TransactionInput, TransactionType } from "../types";

export type TransactionFilters = {
  month?: string;
  type?: TransactionType | "all";
  status?: "all" | "paid" | "pending";
};

export type TransactionWithMeta = Transaction & {
  display_name: string;
  time_str: string | null;
};

export function useTransactions(filters: TransactionFilters = {}) {
  const [transactions, setTransactions] = useState<TransactionWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("transactions")
      .select(`
        *,
        patient:patients (full_name),
        provider:providers (display_name),
        billing:provider_billings (description),
        appointment:appointments (start_time)
      `)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.month) {
      const [y, m] = filters.month.split("-").map(Number);
      const start = `${y}-${String(m).padStart(2, "0")}-01`;
      const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
      const end = `${next.y}-${String(next.m).padStart(2, "0")}-01`;
      query = query.gte("occurred_on", start).lt("occurred_on", end);
    }
    if (filters.type && filters.type !== "all") {
      query = query.eq("type", filters.type);
    }
    if (filters.status === "paid") {
      query = query.not("paid_on", "is", null);
    } else if (filters.status === "pending") {
      query = query.is("paid_on", null);
    }

    const { data, error } = await query;
    
    if (error) {
      setError(error.message);
      setTransactions([]);
    } else {
      const rawTransactions = data || [];
      
      // Coleta os IDs de pacientes e as datas para buscar sessões "órfãs" (sem appointment_id)
      const patientIds = [...new Set(rawTransactions.map((t: any) => t.patient_id).filter(Boolean))];
      const dates = [...new Set(rawTransactions.map((t: any) => t.occurred_on))];

      let fallbackAppointments: any[] = [];
      if (patientIds.length > 0 && dates.length > 0) {
        const { data: appts } = await supabase
          .from("appointments")
          .select("patient_id, starts_on, start_time")
          .in("patient_id", patientIds)
          .in("starts_on", dates)
          .eq("type", "session");
        fallbackAppointments = appts || [];
      }

      const formatted = rawTransactions.map((row: any) => {
        const appt = Array.isArray(row.appointment) ? row.appointment[0] : row.appointment;
        const pat = Array.isArray(row.patient) ? row.patient[0] : row.patient;
        const prov = Array.isArray(row.provider) ? row.provider[0] : row.provider;
        
        let displayName = row.description;
        let timeStr = null;

        if (appt && appt.start_time) {
          timeStr = appt.start_time.slice(0, 5);
        } else if (row.patient_id) {
          // Fallback: busca na lista de agendamentos do dia
          const fallback = fallbackAppointments.find(
            (a) => a.patient_id === row.patient_id && a.starts_on === row.occurred_on
          );
          if (fallback) timeStr = fallback.start_time.slice(0, 5);
        }

        if (pat) {
          displayName = pat.full_name;
        } else if (prov) {
          displayName = prov.display_name;
        } else if (row.billing) {
          displayName = row.billing.description;
        }

        return {
          ...row,
          display_name: displayName,
          time_str: timeStr,
        } as TransactionWithMeta;
      });

      setTransactions(formatted);
    }
    setLoading(false);
  }, [filters.month, filters.type, filters.status]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(input: TransactionInput) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sessão expirada.");

    const { error } = await supabase
      .from("transactions")
      .insert({ ...input, user_id: user.id });

    if (error) throw new Error(error.message);
    await load();
  }

  async function update(id: string, input: TransactionInput) {
    const { error } = await supabase
      .from("transactions")
      .update(input)
      .eq("id", id);
    if (error) throw new Error(error.message);
    await load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await load();
  }

  async function markAsPaid(id: string, paidOn?: string) {
    const { error } = await supabase.rpc("mark_transaction_as_paid", {
      p_transaction_id: id,
      p_paid_on: paidOn ?? null,
    });
    if (error) throw new Error(error.message);
    await load();
  }

  // NOVA FUNÇÃO: Desfazer pagamento
  async function markAsPending(id: string) {
    const { error } = await supabase
      .from("transactions")
      .update({ paid_on: null })
      .eq("id", id);
    if (error) throw new Error(error.message);
    await load();
  }

  return {
    transactions,
    loading,
    error,
    reload: load,
    create,
    update,
    remove,
    markAsPaid,
    markAsPending, // Exportando a nova função
  };
}