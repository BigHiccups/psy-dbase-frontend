import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { AppointmentWithRelations } from "../types";

// Busca appointments entre duas datas (inclusive), com dados de paciente/provider
// Estratégia:
// - Quando patient_id existe, busca o nome via select aninhado do Supabase
// - Agrupa por data para facilitar renderização na agenda
export function useAppointments(fromDate: string, toDate: string) {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
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
      // O Supabase retorna arrays aninhados; achata para objeto único
      const normalized = (data ?? []).map((row: any) => ({
        ...row,
        patient: Array.isArray(row.patient) ? row.patient[0] ?? null : row.patient,
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

// Agrupa appointments por data (YYYY-MM-DD)
export function groupByDate(
  appointments: AppointmentWithRelations[]
): Record<string, AppointmentWithRelations[]> {
  const grouped: Record<string, AppointmentWithRelations[]> = {};
  for (const appt of appointments) {
    if (!grouped[appt.starts_on]) grouped[appt.starts_on] = [];
    grouped[appt.starts_on].push(appt);
  }
  return grouped;
}

// Filtra appointments que são do tipo "due" (vencimentos, sem horário)
export function separateDue(
  appointments: AppointmentWithRelations[]
): {
  timeBased: AppointmentWithRelations[];
  due: AppointmentWithRelations[];
} {
  const timeBased: AppointmentWithRelations[] = [];
  const due: AppointmentWithRelations[] = [];
  for (const appt of appointments) {
    if (appt.type === "due") due.push(appt);
    else timeBased.push(appt);
  }
  return { timeBased, due };
}