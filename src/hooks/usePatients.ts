import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Patient } from "../types";

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

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
  }, []);

  return { patients, loading, error, reload: load };
}