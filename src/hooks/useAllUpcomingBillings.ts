import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ProviderBilling } from "../types";

export type BillingWithProvider = ProviderBilling & { provider_name: string };

export function useAllUpcomingBillings() {
  const [billings, setBillings] = useState<BillingWithProvider[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("provider_billings")
      .select(`
        *,
        provider:providers!provider_id (display_name)
      `)
      .eq("status", "active");

    if (!error && data) {
      const mapped = data.map((row: any) => ({
        ...row,
        provider_name: row.provider?.display_name ?? "Empresa",
        provider: undefined,
      }));
      setBillings(mapped);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return { billings, loading, reload: load };
}