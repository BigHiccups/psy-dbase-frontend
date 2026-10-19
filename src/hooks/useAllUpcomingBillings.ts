import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ProviderBilling } from "../types";

// Pega todos os vencimentos ativos do usuário (para a Agenda)
export function useAllUpcomingBillings() {
  const [billings, setBillings] = useState<(ProviderBilling & { provider_name: string })[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    
    // Busca os vencimentos e já traz o nome do prestador
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
        provider: undefined, // limpa o objeto aninhado
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