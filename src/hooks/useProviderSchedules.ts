import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { RecurrenceType, ScheduleInput } from "../types";

export function useProviderSchedules(providerId: string | undefined) {
  const [schedules, setSchedules] = useState<ScheduleInput[]>([]);
  const [recurrenceType, setRecurrenceType] =
    useState<RecurrenceType>("weekly");
  const [recurrenceDays, setRecurrenceDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!providerId) {
      setSchedules([]);
      setRecurrenceType("weekly");
      setRecurrenceDays(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("provider_schedules")
      .select("weekday, start_time, duration_min, recurrence_type, recurrence_days")
      .eq("provider_id", providerId)
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
        }))
      );

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
  }, [providerId]);

  return {
    schedules,
    recurrenceType,
    recurrenceDays,
    loading,
    error,
    reload: load,
  };
}