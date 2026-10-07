import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type Submission = {
  id: string;
  user_id: string;
  full_name: string;
  cpf: string | null;
  city: string | null;
  birth_date: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  consent_accepted: boolean;
  place_acknowledged: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("patient_form_submissions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setSubmissions([]);
    } else {
      setSubmissions(data as Submission[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return { submissions, loading, error, reload: load };
}