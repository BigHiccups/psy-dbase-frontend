import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Transaction, TransactionInput, TransactionType } from "../types";

export type TransactionFilters = {
  month?: string;                         // "YYYY-MM"
  type?: TransactionType | "all";
  status?: "all" | "paid" | "pending";
};

export function useTransactions(filters: TransactionFilters = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("transactions")
      .select("*")
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
      setTransactions((data ?? []) as Transaction[]);
    }
    setLoading(false);
  }, [filters.month, filters.type, filters.status]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(input: TransactionInput) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

  return {
    transactions,
    loading,
    error,
    reload: load,
    create,
    update,
    remove,
    markAsPaid,
  };
}