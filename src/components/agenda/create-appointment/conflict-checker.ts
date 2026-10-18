import { parseDateString, toDateString, addDays } from "../../../lib/agenda-date";
import { slotOverlapsAppointment } from "../../../lib/appointment-overlap";
import type { OccupiedSlot } from "../../../hooks/useOccupiedSlots";
import type { RecurrenceType } from "../../../types";

/**
 * Verifica conflito em um único slot (weekday + startTime + duration).
 * Retorna string com descrição do conflito, ou null se não houver.
 */
export function findSingleConflict(
  occupiedSlots: OccupiedSlot[],
  weekday: number,
  startTimeHm: string,
  durationMin: number,
  skipLabel?: string
): string | null {
  const conflicting = occupiedSlots.find((slot) => {
    // Se estiver editando o próprio agendamento, precisa filtrar fora
    if (skipLabel && slot.subjectName === skipLabel) return false;
    
    return slotOverlapsAppointment(
      { weekday, startTime: startTimeHm, durationMin },
      {
        weekday: slot.weekday,
        start_time: slot.startTime,
        duration_min: slot.durationMin,
      }
    );
  });

  if (!conflicting) return null;

  const who =
    conflicting.subjectName ??
    (conflicting.occupiedBy === "blocked"
      ? "um bloqueio"
      : "outro agendamento");

  return `${who} (${conflicting.startTime})`;
}

/**
 * Simula ocorrências de uma série e verifica conflito em cada uma.
 * Retorna string com o primeiro conflito encontrado, ou null.
 */
export function findSeriesConflict(
  occupiedSlots: OccupiedSlot[],
  weekday: number,
  startTimeHm: string,
  durationMin: number,
  recurrence: RecurrenceType,
  recurrenceDays: number | null,
  anchorDate: string
): string | null {
  const horizon = addDays(toDateString(new Date()), 90);

  let current = anchorDate;
  let guard = 0;
  while (current <= horizon && guard < 200) {
    guard++;
    
    if (parseDateString(current).getDay() === weekday) {
      const conflict = findSingleConflict(
        occupiedSlots,
        weekday,
        startTimeHm,
        durationMin
      );
      if (conflict) {
        return `Conflito em ${current}: ${conflict}`;
      }
    }

    if (recurrence === "once") break;
    if (recurrence === "weekly") {
      current = addDays(current, 7);
    } else if (recurrence === "biweekly") {
      current = addDays(current, 14);
    } else if (recurrence === "every_30_days") {
      current = addDays(current, 30);
    } else if (recurrence === "custom_days" && recurrenceDays) {
      current = addDays(current, recurrenceDays);
    } else if (recurrence === "monthly") {
      const d = parseDateString(current);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
      current = toDateString(next);
    } else {
      break;
    }
  }

  return null;
}

/**
 * Verifica conflito em todos os dias de um intervalo (bloqueio por período).
 */
export function findPeriodConflict(
  occupiedSlots: OccupiedSlot[],
  from: string,
  to: string,
  startTimeHm: string,
  durationMin: number
): string | null {
  let current = from;
  let guard = 0;
  while (current <= to && guard < 400) {
    guard++;
    const weekday = parseDateString(current).getDay();
    const conflict = findSingleConflict(occupiedSlots, weekday, startTimeHm, durationMin);
    
    if (conflict) {
      return `Conflito em ${current}: ${conflict}`;
    }
    current = addDays(current, 1);
  }
  return null;
}