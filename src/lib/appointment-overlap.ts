import { timeToMinutes } from "./agenda-date";

// Verifica se dois intervalos de tempo se sobrepõem
// Um intervalo é definido por (start em minutos, end em minutos)
// Sobrepõe se: aStart < bEnd && bStart < aEnd
export function intervalsOverlap(
  aStartMin: number,
  aEndMin: number,
  bStartMin: number,
  bEndMin: number
): boolean {
  return aStartMin < bEndMin && bStartMin < aEndMin;
}

// Converte "HH:MM" ou "HH:MM:SS" para minutos desde meia-noite
export function parseStartMinutes(startTime: string): number {
  return timeToMinutes(startTime);
}

// Helper para verificar se um slot pretendido sobrepõe um appointment existente
export function slotOverlapsAppointment(
  slot: { weekday: number; startTime: string; durationMin: number },
  appointment: {
    weekday: number;
    start_time: string;
    duration_min: number;
  }
): boolean {
  // Só compara se for o mesmo dia da semana
  if (slot.weekday !== appointment.weekday) return false;

  const aStart = parseStartMinutes(slot.startTime);
  const aEnd = aStart + slot.durationMin;
  const bStart = parseStartMinutes(appointment.start_time);
  const bEnd = bStart + appointment.duration_min;

  return intervalsOverlap(aStart, aEnd, bStart, bEnd);
}

// Verifica se um slot pretendido sobrepõe algum slot de uma lista
// Retorna o primeiro conflito encontrado, ou null
export function findOverlappingSlot<
  T extends { weekday: number; start_time: string; duration_min: number },
>(slot: { weekday: number; startTime: string; durationMin: number }, list: T[]): T | null {
  for (const item of list) {
    if (slotOverlapsAppointment(slot, item)) return item;
  }
  return null;
}