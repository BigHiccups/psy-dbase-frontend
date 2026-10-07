// Mapeamento fixo (0=domingo, 6=sábado) — casa com o check do Postgres
export const WEEKDAYS = [
  { value: 0, short: "Dom", long: "Domingo" },
  { value: 1, short: "Seg", long: "Segunda-feira" },
  { value: 2, short: "Ter", long: "Terça-feira" },
  { value: 3, short: "Qua", long: "Quarta-feira" },
  { value: 4, short: "Qui", long: "Quinta-feira" },
  { value: 5, short: "Sex", long: "Sexta-feira" },
  { value: 6, short: "Sáb", long: "Sábado" },
];

export function weekdayShort(value: number): string {
  return WEEKDAYS.find((w) => w.value === value)?.short ?? "?";
}

export function weekdayLong(value: number): string {
  return WEEKDAYS.find((w) => w.value === value)?.long ?? "?";
}