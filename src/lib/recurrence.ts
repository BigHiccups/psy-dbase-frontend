import type { RecurrenceType } from "../types";

// =========================================================
// Constantes de recorrência
// =========================================================
export const RECURRENCE_OPTIONS: { 
  value: RecurrenceType; 
  label: string; 
  shortLabel: string; 
}[] = [
  { value: "weekly", label: "Semanal", shortLabel: "Semanal" },
  { value: "biweekly", label: "Quinzenal", shortLabel: "Quinzenal" },
  { value: "monthly", label: "Mensal", shortLabel: "Mensal" },
  { value: "bimonthly", label: "Bimestral", shortLabel: "Bimestral" },
  { value: "quarterly", label: "Trimestral", shortLabel: "Trimestral" },
  { value: "semiannual", label: "Semestral", shortLabel: "Semestral" },
  { value: "yearly", label: "Anual", shortLabel: "Anual" },
  { value: "custom_days", label: "Personalizado (dias)", shortLabel: "P. Dias" },
  { value: "every_30_days", label: "A cada 30 dias", shortLabel: "30 dias" },
  { value: "once", label: "Única vez", shortLabel: "Única" },
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
  // Atualizado com todas as frequências suportadas
  const validTypes: RecurrenceType[] = [
    "once",
    "weekly",
    "biweekly",
    "monthly",
    "bimonthly",
    "quarterly",
    "semiannual",
    "yearly",
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