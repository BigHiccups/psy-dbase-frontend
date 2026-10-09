import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Patient } from "../types";

// Lista apenas os pacientes em status 'prospect'
export function useProspects() {
  const [prospects, setProspects] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("status", "prospect")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setProspects([]);
    } else {
      setProspects(data as Patient[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return { prospects, loading, error, reload: load };
}