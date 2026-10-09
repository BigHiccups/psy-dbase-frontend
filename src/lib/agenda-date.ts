// =========================================================
// Helpers de data para a agenda
// Sempre trabalham com strings no formato YYYY-MM-DD
// (evita problemas de timezone com Date)
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

// Retorna a segunda-feira da semana que contém a data
export function startOfWeek(dateStr: string): string {
  const d = parseDateString(dateStr);
  const day = d.getDay(); // 0=dom, 1=seg, ..., 6=sáb
  const diff = day === 0 ? -6 : 1 - day; // recua até segunda
  d.setDate(d.getDate() + diff);
  return toDateString(d);
}

// Retorna o domingo da semana que contém a data
export function endOfWeek(dateStr: string): string {
  const start = parseDateString(startOfWeek(dateStr));
  start.setDate(start.getDate() + 6);
  return toDateString(start);
}

// Retorna o primeiro dia do mês
export function startOfMonth(monthStr: string): string {
  return `${monthStr}-01`;
}

// Retorna o último dia do mês
export function endOfMonth(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate(); // dia 0 do próximo mês = último do atual
  return `${monthStr}-${String(lastDay).padStart(2, "0")}`;
}

// Retorna "YYYY-MM" a partir de uma data
export function toMonthString(dateStr: string): string {
  return dateStr.slice(0, 7);
}

// Adiciona N dias a uma data
export function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

// Adiciona N semanas a uma data
export function addWeeks(dateStr: string, weeks: number): string {
  return addDays(dateStr, weeks * 7);
}

// Adiciona N meses a um mês
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

// Retorna array com todas as datas de um mês, alinhadas para começar na segunda
// (inclui dias do mês anterior/posterior para completar semanas inteiras)
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

// Nome curto do dia da semana (0=dom ... 6=sáb)
export const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const WEEKDAY_LONG = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

// Nome curto do mês (0=jan ... 11=dez)
export const MONTH_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];
export const MONTH_LONG = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Formata "YYYY-MM-DD" como "seg, 14 out"
export function formatShortDate(dateStr: string): string {
  const d = parseDateString(dateStr);
  return `${WEEKDAY_SHORT[d.getDay()].toLowerCase()}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

// Formata "YYYY-MM-DD" como "14 de outubro de 2026"
export function formatLongDate(dateStr: string): string {
  const d = parseDateString(dateStr);
  return `${d.getDate()} de ${MONTH_LONG[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

// Formata "YYYY-MM" como "Outubro de 2026"
export function formatMonth(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  return `${MONTH_LONG[m - 1]} de ${y}`;
}

// Formata "HH:MM" ou "HH:MM:SS" como "HH:MM"
export function formatTime(time: string): string {
  return time.slice(0, 5);
}

// Converte "HH:MM:SS" para minutos desde meia-noite
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Verifica se uma data é hoje
export function isToday(dateStr: string): boolean {
  return dateStr === toDateString(new Date());
}

// Verifica se uma data pertence ao mês informado
export function isInMonth(dateStr: string, monthStr: string): boolean {
  return dateStr.startsWith(monthStr);
}