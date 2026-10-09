import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Patient } from "../types";

export type PatientFilter = "active" | "inactive" | "all";

export function usePatients(filter: PatientFilter = "active") {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("patients")
      .select("*")
      .order("full_name", { ascending: true });

    if (filter === "active") {
      query = query.eq("status", "active");
    } else if (filter === "inactive") {
      // Inativos = arquivados + alta (mas não prospect)
      query = query.neq("status", "active").neq("status", "prospect");
    } else {
      // "all" → exclui prospect (eles ficam no bloco de revisão)
      query = query.neq("status", "prospect");
    }

    const { data, error } = await query;

    if (error) {
      setError(error.message);
      setPatients([]);
    } else {
      setPatients(data as Patient[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return { patients, loading, error, reload: load };
} 