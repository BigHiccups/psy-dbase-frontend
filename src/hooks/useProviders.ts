import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Provider } from "../types";

export type ProviderFilter = "person" | "company" | "all" | "archived";

export function useProviders(filter: ProviderFilter = "all") {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("providers")
      .select("*")
      .order("display_name", { ascending: true });

    if (filter === "person") {
      query = query.eq("kind", "person").eq("status", "active");
    } else if (filter === "company") {
      query = query.eq("kind", "company").eq("status", "active");
    } else if (filter === "archived") {
      query = query.eq("status", "archived");
    } else {
      // "all" → todos os ativos (person + company)
      query = query.eq("status", "active");
    }

    const { data, error } = await query;

    if (error) {
      setError(error.message);
      setProviders([]);
    } else {
      setProviders(data as Provider[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return { providers, loading, error, reload: load };
}