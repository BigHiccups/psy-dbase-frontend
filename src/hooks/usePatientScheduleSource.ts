import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ScheduleInput } from "../types";

export type ScheduleSource = "manual" | "invite" | "google" | "none";

type Result = {
  schedules: ScheduleInput[];
  source: ScheduleSource;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

// Busca os horários de um paciente em 3 camadas, na ordem de prioridade:
// 1) patient_schedules      → source = "manual"
// 2) patient_invite_schedules (via submission aprovada) → source = "invite"
// 3) appointments derivados  → source = "google"
//
// Retorna o primeiro que encontrar. Se nenhum, retorna array vazio + source = "none".
export function usePatientScheduleSource(
  patientId: string | undefined
): Result {
  const [schedules, setSchedules] = useState<ScheduleInput[]>([]);
  const [source, setSource] = useState<ScheduleSource>("none");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!patientId) {
      setSchedules([]);
      setSource("none");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ============================================================
      // 1) patient_schedules (manual)
      // ============================================================
      const { data: manualData, error: manualErr } = await supabase
        .from("patient_schedules")
        .select("weekday, start_time, duration_min")
        .eq("patient_id", patientId)
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
      // 2) patient_invite_schedules (via submission aprovada)
      // ============================================================
      const { data: patientData } = await supabase
        .from("patients")
        .select("full_name")
        .eq("id", patientId)
        .maybeSingle();

      const patientName = patientData?.full_name;

      if (patientName) {
        const { data: submission } = await supabase
          .from("patient_form_submissions")
          .select("invite_id")
          .eq("status", "approved")
          .ilike("full_name", patientName)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (submission?.invite_id) {
          const { data: inviteSchedules } = await supabase
            .from("patient_invite_schedules")
            .select("weekday, start_time, duration_min")
            .eq("invite_id", submission.invite_id)
            .order("weekday")
            .order("start_time");

          if (inviteSchedules && inviteSchedules.length > 0) {
            setSchedules(
              inviteSchedules.map((row) => ({
                weekday: row.weekday,
                startTime: (row.start_time as string).slice(0, 5),
                durationMin: row.duration_min,
              }))
            );
            setSource("invite");
            setLoading(false);
            return;
          }
        }
      }

      // ============================================================
      // 3) appointments (derivado — paciente importado do Google)
      // ============================================================
      const { data: apptData } = await supabase
        .from("appointments")
        .select("weekday, start_time, duration_min")
        .eq("patient_id", patientId)
        .eq("status", "active")
        .eq("type", "session")
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

      // Nenhuma camada encontrou nada
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
  }, [patientId]);

  return { schedules, source, loading, error, reload: load };
}