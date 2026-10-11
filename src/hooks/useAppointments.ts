import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { AppointmentWithRelations } from "../types";

export function useAppointments(fromDate: string, toDate: string) {
  const [appointments, setAppointments] = useState<
    AppointmentWithRelations[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
          *,
          patient:patients!patient_id (id, full_name),
          provider:providers!provider_id (id, display_name)
        `
      )
      .gte("starts_on", fromDate)
      .lte("starts_on", toDate)
      .order("starts_on", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      setError(error.message);
      setAppointments([]);
    } else {
      const normalized = (data ?? []).map((row: any) => ({
        ...row,
        patient: Array.isArray(row.patient)
          ? row.patient[0] ?? null
          : row.patient,
        provider: Array.isArray(row.provider)
          ? row.provider[0] ?? null
          : row.provider,
      }));
      setAppointments(normalized as AppointmentWithRelations[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  return { appointments, loading, error, reload: load };
}