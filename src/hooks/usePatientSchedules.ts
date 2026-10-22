import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { RecurrenceType, ScheduleInput } from "../types";

// Busca os horários recorrentes (patient_schedules) de um paciente
export function usePatientSchedules(patientId: string | undefined) {
  const [schedules, setSchedules] = useState<ScheduleInput[]>([]);
  const [recurrenceType, setRecurrenceType] =
    useState<RecurrenceType>("weekly");
  const [recurrenceDays, setRecurrenceDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!patientId) {
      setSchedules([]);
      setRecurrenceType("weekly");
      setRecurrenceDays(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("patient_schedules")
      // ADICIONAMOS O anchor_date AQUI NA QUERY
      .select("weekday, start_time, duration_min, recurrence_type, recurrence_days, anchor_date")
      .eq("patient_id", patientId)
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      setError(error.message);
      setSchedules([]);
      setRecurrenceType("weekly");
      setRecurrenceDays(null);
    } else {
      const rows = data ?? [];
      setSchedules(
        rows.map((row) => ({
          weekday: row.weekday,
          startTime: (row.start_time as string).slice(0, 5),
          durationMin: row.duration_min,
          recurrenceType:
            (row.recurrence_type as RecurrenceType | null) ?? "weekly",
          recurrenceDays: row.recurrence_days ?? null,
          // ADICIONAMOS O ANCHOR DATE AQUI NO MAPEAMENTO
          anchorDate: row.anchor_date ?? undefined,
        }))
      );

      // Recorrência: vem da primeira linha (todas têm o mesmo valor)
      if (rows.length > 0) {
        setRecurrenceType(
          (rows[0].recurrence_type as RecurrenceType | null) ?? "weekly"
        );
        setRecurrenceDays(rows[0].recurrence_days ?? null);
      } else {
        setRecurrenceType("weekly");
        setRecurrenceDays(null);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  return {
    schedules,
    recurrenceType,
    recurrenceDays,
    loading,
    error,
    reload: load,
  };
}