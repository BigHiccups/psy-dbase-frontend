import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ScheduleInput } from "../types";

// Busca os horários recorrentes (patient_schedules) de um paciente
export function usePatientSchedules(patientId: string | undefined) {
  const [schedules, setSchedules] = useState<ScheduleInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!patientId) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("patient_schedules")
      .select("weekday, start_time, duration_min")
      .eq("patient_id", patientId)
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      setError(error.message);
      setSchedules([]);
    } else {
      setSchedules(
        (data ?? []).map((row) => ({
          weekday: row.weekday,
          startTime: (row.start_time as string).slice(0, 5), // "HH:MM"
          durationMin: row.duration_min,
        }))
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  return { schedules, loading, error, reload: load };
}