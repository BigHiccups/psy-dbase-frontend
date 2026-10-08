import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Patient } from "../types";

// Busca um paciente específico pelo id
export function usePatient(id: string | undefined) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) {
      setPatient(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      setError(error.message);
      setPatient(null);
    } else if (!data) {
      setError("Paciente não encontrado.");
      setPatient(null);
    } else {
      setPatient(data as Patient);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return { patient, loading, error, reload: load };
}