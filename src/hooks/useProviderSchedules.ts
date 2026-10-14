import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { RecurrenceType, ScheduleInput } from "../types";

export function useProviderSchedules(providerId: string | undefined) {
  const [schedules, setSchedules] = useState<ScheduleInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!providerId) {
      setSchedules([]);
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
    } else {
      setSchedules(
        (data ?? []).map((row) => ({
          weekday: row.weekday,
          startTime: (row.start_time as string).slice(0, 5),
          durationMin: row.duration_min,
          recurrenceType: (row.recurrence_type as RecurrenceType | null) ?? "weekly",
          recurrenceDays: row.recurrence_days ?? null,
        }))
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  return { schedules, loading, error, reload: load };
}