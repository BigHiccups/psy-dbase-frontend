import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ScheduleInput } from "../types";

export type ScheduleSource = "manual" | "google" | "none";

type Result = {
  schedules: ScheduleInput[];
  source: ScheduleSource;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useProviderScheduleSource(
  providerId: string | undefined
): Result {
  const [schedules, setSchedules] = useState<ScheduleInput[]>([]);
  const [source, setSource] = useState<ScheduleSource>("none");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!providerId) {
      setSchedules([]);
      setSource("none");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ============================================================
      // 1) provider_schedules (manual)
      // ============================================================
      const { data: manualData, error: manualErr } = await supabase
        .from("provider_schedules")
        .select("weekday, start_time, duration_min")
        .eq("provider_id", providerId)
        .order("weekday")
        .order("start_time");

      if (manualErr) throw new Error(manualErr.message);

      if (manualData && manualData.length > 0) {
        setSchedules(
          manualData.map((row) => ({
            weekday: row.weekday,
            startTime: (row.start_time as string).slice(0, 5),
            durationMin: row.duration_min,
          }))
        );
        setSource("manual");
        setLoading(false);
        return;
      }

      // ============================================================
      // 2) appointments tipo 'personal' (derivado)
      // ============================================================
      const { data: apptData } = await supabase
        .from("appointments")
        .select("weekday, start_time, duration_min")
        .eq("provider_id", providerId)
        .eq("status", "active")
        .eq("type", "personal")
        .order("weekday")
        .order("start_time");

      if (apptData && apptData.length > 0) {
        const seen = new Set<string>();
        const result: ScheduleInput[] = [];

        for (const row of apptData) {
          const startTime = (row.start_time as string).slice(0, 5);
          const key = `${row.weekday}-${startTime}`;
          if (seen.has(key)) continue;
          seen.add(key);

          result.push({
            weekday: row.weekday,
            startTime,
            durationMin: row.duration_min,
          });
        }

        setSchedules(result);
        setSource("google");
        setLoading(false);
        return;
      }

      setSchedules([]);
      setSource("none");
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao buscar horários."
      );
      setSchedules([]);
      setSource("none");
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  return { schedules, source, loading, error, reload: load };
}