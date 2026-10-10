// src/hooks/useOccupiedSlots.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type OccupiedSlot = {
    weekday: number;
    startTime: string;
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

        const { data, error } = await supabase
            .from("appointments")
            .select("weekday, start_time, patient_id, provider_id")
            .eq("status", "active")
            .gte("starts_on", new Date().toISOString().slice(0, 10));

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

            result.push({ weekday: row.weekday, startTime });
        }

        console.log("[useOccupiedSlots] result:", result);


        setSlots(result);
        setLoading(false);
    }
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [excludePatientId, excludeProviderId]);

    return { slots, loading, error, reload: load };
}