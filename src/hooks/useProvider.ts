import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Provider } from "../types";

// Busca um provider específico pelo id
export function useProvider(id: string | undefined) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) {
      setProvider(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      setError(error.message);
      setProvider(null);
    } else if (!data) {
      setError("Prestador não encontrado.");
      setProvider(null);
    } else {
      setProvider(data as Provider);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return { provider, loading, error, reload: load };
}