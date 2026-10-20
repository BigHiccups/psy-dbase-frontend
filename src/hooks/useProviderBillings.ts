import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ProviderBilling } from "../types";

export function useProviderBillings(providerId: string | undefined) {
  const [billings, setBillings] = useState<ProviderBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!providerId) {
      setBillings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("provider_billings")
      .select("*")
      .eq("provider_id", providerId)
      .eq("status", "active")
      .order("due_day", { ascending: true });

    if (error) {
      setError(error.message);
      setBillings([]);
    } else {
      setBillings(data as ProviderBilling[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  async function saveBilling(payload: {
    id?: string;
    provider_id: string;
    description: string;
    amount_cents: number;
    due_day: number;
    due_month: number | null;
    frequency: string;
    starts_on: string;
  }) {
    const { error } = await supabase.rpc("set_provider_billing", {
      p_billing_id: payload.id || null,
      p_provider_id: payload.provider_id,
      p_description: payload.description,
      p_amount_cents: payload.amount_cents,
      p_due_day: payload.due_day,
      p_frequency: payload.frequency,
      p_starts_on: payload.starts_on,
      p_due_month: payload.due_month ?? null,
    });

    if (error) throw new Error(error.message);
    await load();
  }

  async function archiveBilling(id: string) {
    const { error } = await supabase.rpc("archive_provider_billing", {
      p_billing_id: id,
    });
    if (error) throw new Error(error.message);
    await load();
  }

  async function deleteBilling(id: string) {
    const { error } = await supabase.rpc("delete_provider_billing", {
      p_billing_id: id,
    });
    if (error) throw new Error(error.message);
    await load();
  }

  return {
    billings,
    loading,
    error,
    reload: load,
    saveBilling,
    archiveBilling,
    deleteBilling,
  };
}