// =========================================================
// Helpers de data para a agenda
// Sempre trabalham com strings no formato YYYY-MM-DD
// =========================================================

// Converte Date para "YYYY-MM-DD" no fuso local
export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Converte "YYYY-MM-DD" para Date (meia-noite local)
export function parseDateString(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// =========================================================
// Conversão entre dia JS (0=domingo) e índice ISO (0=segunda)
// =========================================================

// Converte dia JS (0=dom, 6=sáb) para índice ISO (0=seg, 6=dom)
export function isoWeekday(jsDay: number): number {
  return (jsDay + 6) % 7;
}

// Converte índice ISO (0=seg, 6=dom) para dia JS (0=dom)
export function jsWeekday(isoDay: number): number {
  return (isoDay + 1) % 7;
}

// =========================================================
// Semana e mês
// =========================================================

// Retorna a segunda-feira da semana que contém a data
export function startOfWeek(dateStr: string): string {
  const d = parseDateString(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateString(d);
}

// Retorna o domingo da semana que contém a data
export function endOfWeek(dateStr: string): string {
  const start = parseDateString(startOfWeek(dateStr));
  start.setDate(start.getDate() + 6);
  return toDateString(start);
}

export function startOfMonth(monthStr: string): string {
  return `${monthStr}-01`;
}

export function endOfMonth(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${monthStr}-${String(lastDay).padStart(2, "0")}`;
}

export function toMonthString(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

export function addWeeks(dateStr: string, weeks: number): string {
  return addDays(dateStr, weeks * 7);
}

export function addMonths(monthStr: string, months: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + months, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Retorna array com as 7 datas de uma semana (segunda a domingo)
export function weekDates(dateStr: string): string[] {
  const start = startOfWeek(dateStr);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// Retorna array com todas as datas de um mês, alinhadas para começar
// na segunda-feira (inclui dias do mês anterior/posterior)
export function monthGridDates(monthStr: string): string[] {
  const first = startOfMonth(monthStr);
  const last = endOfMonth(monthStr);
  const gridStart = startOfWeek(first);
  const gridEnd = endOfWeek(last);

  const dates: string[] = [];
  let cur = gridStart;
  while (cur <= gridEnd) {
    dates.push(cur);
    cur = addDays(cur, 1);
  }
  return dates;
}

// =========================================================
// Nomes (ordem ISO: segunda a domingo)
// =========================================================

export const WEEKDAY_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export const WEEKDAY_LONG = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

export const MONTH_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];
export const MONTH_LONG = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// =========================================================
// Formatação (usa índices ISO)
// =========================================================

// "seg, 14 out"
export function formatShortDate(dateStr: string): string {
  const d = parseDateString(dateStr);
  const iso = isoWeekday(d.getDay());
  return `${WEEKDAY_SHORT[iso].toLowerCase()}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

// "14 de outubro de 2026"
export function formatLongDate(dateStr: string): string {
  const d = parseDateString(dateStr);
  return `${d.getDate()} de ${MONTH_LONG[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

// "Outubro de 2026"
export function formatMonth(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  return `${MONTH_LONG[m - 1]} de ${y}`;
}

// "HH:MM" ou "HH:MM:SS" → "HH:MM"
export function formatTime(time: string): string {
  return time.slice(0, 5);
}

// "HH:MM:SS" → minutos desde meia-noite
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function isToday(dateStr: string): boolean {
  return dateStr === toDateString(new Date());
}

export function isInMonth(dateStr: string, monthStr: string): boolean {
  return dateStr.startsWith(monthStr);
}