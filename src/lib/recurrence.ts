import type { RecurrenceType } from "../types";

// =========================================================
// Constantes de recorrência
// =========================================================
// Cada opção tem:
// - value:       valor gravado no banco (coluna recurrence_type)
// - label:       texto completo (select do ScheduleEditor)
// - shortLabel:  texto curto (badge em PatientDetail / ProviderDetail)
// =========================================================
export const RECURRENCE_OPTIONS: {
  value: RecurrenceType;
  label: string;
  shortLabel: string;
}[] = [
  { value: "once",          label: "Única vez",                       shortLabel: "Única" },
  { value: "weekly",        label: "Semanal (a cada 7 dias)",         shortLabel: "Semanal" },
  { value: "biweekly",      label: "Quinzenal (a cada 14 dias)",      shortLabel: "Quinzenal" },
  { value: "every_30_days", label: "A cada 30 dias",                  shortLabel: "30 dias" },
  { value: "monthly",       label: "Mensal (mesmo dia do mês)",       shortLabel: "Mensal" },
  { value: "custom_days",   label: "Personalizado (a cada N dias)",   shortLabel: "Personalizado" },
];

// Default quando o ScheduleInput não traz recurrenceType
export const DEFAULT_RECURRENCE_TYPE: RecurrenceType = "weekly";

// =========================================================
// Helpers
// =========================================================

export function getRecurrenceLabel(type: RecurrenceType): string {
  const found = RECURRENCE_OPTIONS.find((o) => o.value === type);
  return found?.label ?? type;
}

export function getRecurrenceShortLabel(type: RecurrenceType): string {
  const found = RECURRENCE_OPTIONS.find((o) => o.value === type);
  return found?.shortLabel ?? type;
}

// Retorna mensagem de erro ou null se válido
export function validateRecurrence(
  type: RecurrenceType,
  days: number | null | undefined
): string | null {
  const validTypes: RecurrenceType[] = [
    "once",
    "weekly",
    "biweekly",
    "monthly",
    "every_30_days",
    "custom_days",
  ];

  if (!validTypes.includes(type)) {
    return "Tipo de recorrência inválido.";
  }

  if (type === "custom_days") {
    if (days === null || days === undefined) {
      return "Informe a quantidade de dias para a recorrência personalizada.";
    }
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return "A quantidade de dias deve estar entre 1 e 365.";
    }
  } else {
    if (days !== null && days !== undefined) {
      return "recurrence_days só é permitido para recorrência personalizada.";
    }
  }

  return null;
}