import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { toDateString, addDays, timeToMinutes } from "../lib/agenda-date";
import type { AppointmentWithRelations } from "../types";

type Result = {
  today: AppointmentWithRelations[];
  upcoming: AppointmentWithRelations[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

// Busca os appointments ativos dos próximos N dias (padrão: 7)
// Separa em "hoje" (filtrando horários já passados) e "próximos dias"
// Recarrega automaticamente a cada 5 minutos e ao ganhar foco
export function useUpcomingAppointments(daysAhead = 7): Result {
  const [today, setToday] = useState<AppointmentWithRelations[]>([]);
  const [upcoming, setUpcoming] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const todayStr = toDateString(new Date());
    const endStr = addDays(todayStr, daysAhead);

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
          *,
          patient:patients!patient_id (id, full_name),
          provider:providers!provider_id (id, display_name)
        `
      )
      .eq("status", "active")
      .gte("starts_on", todayStr)
      .lte("starts_on", endStr)
      .order("starts_on", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      setError(error.message);
      setToday([]);
      setUpcoming([]);
      setLoading(false);
      return;
    }

    const normalized = (data ?? []).map((row: any) => ({
      ...row,
      patient: Array.isArray(row.patient)
        ? row.patient[0] ?? null
        : row.patient,
      provider: Array.isArray(row.provider)
        ? row.provider[0] ?? null
        : row.provider,
    })) as AppointmentWithRelations[];

    // Hora atual em minutos desde meia-noite
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const todayList: AppointmentWithRelations[] = [];
    const upcomingList: AppointmentWithRelations[] = [];

    for (const appt of normalized) {
      if (appt.type === "due") continue;

      if (appt.starts_on === todayStr) {
        // Só inclui se o horário ainda não começou
        const startMin = timeToMinutes(appt.start_time);
        if (startMin > nowMinutes) {
          todayList.push(appt);
        }
      } else {
        upcomingList.push(appt);
      }
    }

    setToday(todayList);
    setUpcoming(upcomingList);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysAhead]);

  // Recarrega a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(
      () => {
        load();
      },
      5 * 60 * 1000
    );
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recarrega quando a janela ganha foco
  useEffect(() => {
    const onFocus = () => {
      load();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { today, upcoming, loading, error, reload: load };
}