import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { RecurrenceType, ScheduleInput } from "../types";

export type ScheduleSource = "manual" | "google" | "none";

type Result = {
  schedules: ScheduleInput[];
  source: ScheduleSource;
  recurrenceType: RecurrenceType;
  recurrenceDays: number | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useProviderScheduleSource(
  providerId: string | undefined
): Result {
  const [schedules, setSchedules] = useState<ScheduleInput[]>([]);
  const [source, setSource] = useState<ScheduleSource>("none");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("weekly");
  const [recurrenceDays, setRecurrenceDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!providerId) {
      setSchedules([]);
      setSource("none");
      setRecurrenceType("weekly");
      setRecurrenceDays(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1) provider_schedules (manual)
      const { data: manualData, error: manualErr } = await supabase
        .from("provider_schedules")
        // ADICIONAMOS title, color, session_price_cents e payment_format
        .select(
          "weekday, start_time, duration_min, recurrence_type, recurrence_days, anchor_date, title, color, session_price_cents, payment_format"
        )
        .eq("provider_id", providerId)
        .order("weekday")
        .order("start_time");

      if (manualErr) throw new Error(manualErr.message);

      if (manualData && manualData.length > 0) {
        setSchedules(
          manualData.map((row) => ({
            weekday: row.weekday,
            startTime: (row.start_time as string)?.slice(0, 5) || "14:00",
            durationMin: row.duration_min ?? 50,
            recurrenceType: (row.recurrence_type as RecurrenceType | null) ?? "weekly",
            recurrenceDays: row.recurrence_days ?? null,
            anchorDate: row.anchor_date ?? undefined,
            // MAPEAMENTO DOS NOVOS CAMPOS
            title: row.title,
            color: row.color,
            sessionPrice: row.session_price_cents,
            paymentFormat: row.payment_format,
          }))
        );
        setRecurrenceType((manualData[0].recurrence_type as RecurrenceType | null) ?? "weekly");
        setRecurrenceDays(manualData[0].recurrence_days ?? null);
        setSource("manual");
        setLoading(false);
        return;
      }

      // 2) appointments tipo 'personal' (derivado)
      const { data: apptData } = await supabase
        .from("appointments")
        .select("weekday, start_time, duration_min, title, color")
        .eq("provider_id", providerId)
        .eq("status", "active")
        .eq("type", "personal")
        .order("weekday")
        .order("start_time");

      if (apptData && apptData.length > 0) {
        const seen = new Set<string>();
        const result: ScheduleInput[] = [];

        for (const row of apptData) {
          const startTime = (row.start_time as string)?.slice(0, 5) || "14:00";
          const key = `${row.weekday}-${startTime}`;
          if (seen.has(key)) continue;
          seen.add(key);

          result.push({
            weekday: row.weekday,
            startTime,
            durationMin: row.duration_min ?? 50,
            recurrenceType: "weekly",
            recurrenceDays: null,
            title: row.title,
            color: row.color,
          });
        }

        setSchedules(result);
        setRecurrenceType("weekly");
        setRecurrenceDays(null);
        setSource("google");
        setLoading(false);
        return;
      }

      setSchedules([]);
      setSource("none");
      setRecurrenceType("weekly");
      setRecurrenceDays(null);
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

  return {
    schedules,
    source,
    recurrenceType,
    recurrenceDays,
    loading,
    error,
    reload: load,
  };
}