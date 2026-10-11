import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type OccupiedSlot = {
  weekday: number;
  startTime: string;
  occupiedBy: "patient" | "provider" | "blocked";
  subjectName: string | null;
};

type Options = {
  excludePatientId?: string;
  excludeProviderId?: string;
};

export function useOccupiedSlots(options: Options = {}) {
  const { excludePatientId, excludeProviderId } = options;

  const [slots, setSlots] = useState<OccupiedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const todayStr = `${y}-${m}-${d}`;

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
          weekday,
          start_time,
          patient_id,
          provider_id,
          type,
          patient:patients!patient_id (full_name),
          provider:providers!provider_id (display_name)
        `
      )
      .eq("status", "active")
      .gte("starts_on", todayStr);

    if (error) {
      setError(error.message);
      setSlots([]);
      setLoading(false);
      return;
    }

    const seen = new Set<string>();
    const result: OccupiedSlot[] = [];

    for (const row of data ?? []) {
      if (excludePatientId && row.patient_id === excludePatientId) continue;
      if (excludeProviderId && row.provider_id === excludeProviderId) continue;

      const startTime = (row.start_time as string).slice(0, 5);
      const key = `${row.weekday}-${startTime}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Normaliza relações
      const patientRel = Array.isArray(row.patient)
        ? row.patient[0]
        : row.patient;
      const providerRel = Array.isArray(row.provider)
        ? row.provider[0]
        : row.provider;

      let occupiedBy: OccupiedSlot["occupiedBy"] = "blocked";
      let subjectName: string | null = null;

      if (row.patient_id && patientRel) {
        occupiedBy = "patient";
        subjectName = patientRel.full_name;
      } else if (row.provider_id && providerRel) {
        occupiedBy = "provider";
        subjectName = providerRel.display_name;
      }

      result.push({
        weekday: row.weekday,
        startTime,
        occupiedBy,
        subjectName,
      });
    }

    setSlots(result);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludePatientId, excludeProviderId]);

  return { slots, loading, error, reload: load };
}