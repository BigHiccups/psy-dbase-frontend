import type { AppointmentWithRelations } from "../types";

// Separa appointments em ativos e cancelados (o resto é ignorado/tratado)
export function splitByStatus(
  appointments: AppointmentWithRelations[]
): {
  active: AppointmentWithRelations[];
  cancelled: AppointmentWithRelations[];
} {
  const active: AppointmentWithRelations[] = [];
  const cancelled: AppointmentWithRelations[] = [];

  for (const appt of appointments) {
    if (appt.status === "cancelled") cancelled.push(appt);
    else active.push(appt);
  }

  return { active, cancelled };
}

// Agrupa por data (YYYY-MM-DD)
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

// Conta cancelados por data
export function countCancelledByDate(
  appointments: AppointmentWithRelations[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const appt of appointments) {
    if (appt.status !== "cancelled") continue;
    counts[appt.starts_on] = (counts[appt.starts_on] ?? 0) + 1;
  }
  return counts;
}