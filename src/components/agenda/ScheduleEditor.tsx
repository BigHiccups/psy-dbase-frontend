import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, CalendarClock, AlertCircle, Repeat } from "lucide-react";
import { Button, Badge } from "../ui";
import { WEEKDAYS } from "../../lib/weekdays";
import { slotOverlapsAppointment } from "../../lib/appointment-overlap";
import { RECURRENCE_OPTIONS } from "../../lib/recurrence";
import { parseDateBR, formatDateBR, isValidDateBR } from "../../lib/masks";
import { MaskedDateInput } from "../ui/MaskedDateInput";
import {
  toDateString,
  WEEKDAY_LONG,
  isoWeekday,
} from "../../lib/agenda-date";
import type { RecurrenceType, ScheduleInput } from "../../types";

type DisabledSlot = {
  weekday: number;
  startTime: string;
  durationMin?: number;
};

type Props = {
  value: ScheduleInput[];
  onChange: (schedules: ScheduleInput[]) => void;
  disabledSlots?: DisabledSlot[];
  disabled?: boolean;
  readOnly?: boolean;
  error?: string | null;
  hint?: string;
  title?: string;
  onConflictChange?: (hasConflict: boolean) => void;

  recurrenceType?: RecurrenceType;
  recurrenceDays?: number | null;
  onRecurrenceChange?: (type: RecurrenceType, days: number | null) => void;
};

const DEFAULT_DURATION = 50;
const DEFAULT_START_TIME = "14:00";
const DEFAULT_RECURRENCE_TYPE: RecurrenceType = "weekly";

function normalizeTime(t: string): string {
  return t.slice(0, 5);
}

function nextDateForWeekday(weekday: number): string {
  const today = new Date();
  const jsToday = today.getDay();
  const diff = (weekday - jsToday + 7) % 7;
  const target = new Date(today);
  target.setDate(today.getDate() + diff);
  return toDateString(target);
}

function weekdayFromDate(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

function usesDateInput(type: RecurrenceType): boolean {
  return (
    type === "once" ||
    type === "monthly" ||
    type === "biweekly" ||
    type === "every_30_days" ||
    type === "custom_days"
  );
}

export function ScheduleEditor({
  value,
  onChange,
  disabledSlots = [],
  disabled,
  readOnly,
  error,
  hint,
  title = "Horários das sessões",
  onConflictChange,
  recurrenceType,
  recurrenceDays,
  onRecurrenceChange,
}: Props) {
  const showRecurrence = !!onRecurrenceChange;
  const effectiveRecurrenceType: RecurrenceType =
    recurrenceType ?? DEFAULT_RECURRENCE_TYPE;
  const isCustomDays = effectiveRecurrenceType === "custom_days";
  const isOnce = effectiveRecurrenceType === "once";
  const useDateInput = usesDateInput(effectiveRecurrenceType);
  const canAddMore = !isOnce;

  // =========================================================
  // Estado local: texto do input de data (dd/mm/aaaa)
  // Mapeado por índice do slot. Sincroniza com value.anchorDate.
  // =========================================================
  const [dateTexts, setDateTexts] = useState<Record<number, string>>({});

  // Sincroniza dateTexts quando value muda externamente (ex: conversão
  // de frequência). Só atualiza se o texto atual do campo não bate com
  // o anchorDate do slot — pra não sobrescrever o que o usuário digita.
  useEffect(() => {
    if (!useDateInput) return;
    setDateTexts((prev) => {
      const next: Record<number, string> = {};
      value.forEach((s, i) => {
        const currentText = prev[i] ?? "";
        const expectedText = formatDateBR(s.anchorDate);
        // Se o texto atual (parseado) bate com o anchorDate, mantém.
        // Senão, sincroniza com o anchorDate.
        const parsedCurrent = parseDateBR(currentText);
        next[i] = parsedCurrent === s.anchorDate ? currentText : expectedText;
      });
      return next;
    });
  }, [value, useDateInput]);

  function handleDateTextChange(index: number, maskedValue: string) {
    setDateTexts((prev) => ({ ...prev, [index]: maskedValue }));

    const iso = parseDateBR(maskedValue);
    if (iso) {
      update(index, { anchorDate: iso });
    }
  }

  function isDateInvalid(index: number): boolean {
    if (!useDateInput) return false;
    const text = dateTexts[index] ?? "";
    if (text.length === 0) return false; // vazio é "não preenchido", não inválido
    return !isValidDateBR(text);
  }

  function handleRecurrenceTypeChange(next: RecurrenceType) {
    if (!onRecurrenceChange) return;

    const converted = value.map((s) => {
      const nextUsesDate = usesDateInput(next);
      const currentUsesDate = useDateInput;

      if (nextUsesDate && !currentUsesDate) {
        return {
          ...s,
          anchorDate: nextDateForWeekday(s.weekday),
        };
      }
      if (!nextUsesDate && currentUsesDate) {
        const weekday = s.anchorDate
          ? weekdayFromDate(s.anchorDate)
          : s.weekday;
        const { anchorDate: _drop, ...rest } = s;
        return { ...rest, weekday };
      }
      return s;
    });

    const finalSchedules =
      next === "once" && converted.length > 1 ? [converted[0]] : converted;

    // Limpa o estado local de textos pra forçar re-sync
    setDateTexts({});

    onChange(finalSchedules);

    if (next === "custom_days") {
      onRecurrenceChange(next, recurrenceDays ?? 15);
    } else {
      onRecurrenceChange(next, null);
    }
  }

  function handleRecurrenceDaysChange(raw: string) {
    if (!onRecurrenceChange) return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      onRecurrenceChange(effectiveRecurrenceType, null);
      return;
    }
    onRecurrenceChange(effectiveRecurrenceType, parsed);
  }

  function update(index: number, patch: Partial<ScheduleInput>) {
    onChange(value.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
    setDateTexts((prev) => {
      const next: Record<number, string> = {};
      Object.keys(prev).forEach((k) => {
        const i = Number(k);
        if (i < index) next[i] = prev[i];
        else if (i > index) next[i - 1] = prev[i];
      });
      return next;
    });
  }

  const occupiedList = useMemo(() => {
    return disabledSlots.map((s) => ({
      weekday: s.weekday,
      start_time: normalizeTime(s.startTime),
      duration_min: s.durationMin ?? DEFAULT_DURATION,
    }));
  }, [disabledSlots]);

  function isExternallyOverlapping(
    weekday: number,
    startTime: string,
    durationMin: number
  ): boolean {
    const found = occupiedList.find((occ) =>
      slotOverlapsAppointment({ weekday, startTime, durationMin }, occ)
    );
    return !!found;
  }

  function hasInternalConflict(index: number): boolean {
    const self = value[index];
    const selfWeekday = useDateInput
      ? self.anchorDate
        ? weekdayFromDate(self.anchorDate)
        : self.weekday
      : self.weekday;
    return value.some((s, i) => {
      if (i === index) return false;
      const otherWeekday = useDateInput
        ? s.anchorDate
          ? weekdayFromDate(s.anchorDate)
          : s.weekday
        : s.weekday;
      return slotOverlapsAppointment(
        {
          weekday: selfWeekday,
          startTime: self.startTime,
          durationMin: self.durationMin,
        },
        {
          weekday: otherWeekday,
          start_time: s.startTime,
          duration_min: s.durationMin,
        }
      );
    });
  }

  function isRowLocked(index: number): boolean {
    const s = value[index];
    const effWeekday = useDateInput
      ? s.anchorDate
        ? weekdayFromDate(s.anchorDate)
        : s.weekday
      : s.weekday;
    return (
      isExternallyOverlapping(effWeekday, s.startTime, s.durationMin) ||
      hasInternalConflict(index)
    );
  }

  const hasConflict = useMemo(
    () => value.some((_, i) => isRowLocked(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, disabledSlots, useDateInput]
  );

  useEffect(() => {
    onConflictChange?.(hasConflict);
  }, [hasConflict, onConflictChange]);

  function isSlotFree(
    weekday: number,
    startTime: string,
    durationMin: number,
    ignoreIndex: number = -1
  ): boolean {
    if (isExternallyOverlapping(weekday, startTime, durationMin)) return false;
    return !value.some(
      (s, i) =>
        i !== ignoreIndex &&
        slotOverlapsAppointment(
          { weekday, startTime, durationMin },
          {
            weekday: useDateInput
              ? s.anchorDate
                ? weekdayFromDate(s.anchorDate)
                : s.weekday
              : s.weekday,
            start_time: s.startTime,
            duration_min: s.durationMin,
          }
        )
    );
  }

  function findFreeSlot(): ScheduleInput {
    const last = value[value.length - 1];
    const baseWeekday = last ? (last.weekday + 1) % 7 : 1;
    const baseStartTime = last
      ? normalizeTime(last.startTime)
      : DEFAULT_START_TIME;
    const baseDuration = last?.durationMin ?? DEFAULT_DURATION;

    for (let i = 0; i < 7; i++) {
      const wd = (baseWeekday + i) % 7;
      if (isSlotFree(wd, baseStartTime, baseDuration)) {
        return buildSchedule(wd, baseStartTime, baseDuration);
      }
    }

    if (isSlotFree(baseWeekday, DEFAULT_START_TIME, baseDuration)) {
      return buildSchedule(baseWeekday, DEFAULT_START_TIME, baseDuration);
    }

    for (let wd = 0; wd < 7; wd++) {
      if (isSlotFree(wd, DEFAULT_START_TIME, DEFAULT_DURATION)) {
        return buildSchedule(wd, DEFAULT_START_TIME, DEFAULT_DURATION);
      }
    }

    return buildSchedule(1, DEFAULT_START_TIME, DEFAULT_DURATION);
  }

  function buildSchedule(
    weekday: number,
    startTime: string,
    durationMin: number
  ): ScheduleInput {
    const base: ScheduleInput = { weekday, startTime, durationMin };
    if (useDateInput) {
      base.anchorDate = nextDateForWeekday(weekday);
    }
    return base;
  }

  function add() {
    if (!canAddMore) return;
    onChange([...value, findFreeSlot()]);
  }

  const inputClasses = `
    rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900
    transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20
    disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
    dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100
    dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500
  `;

  const invalidClasses = `
    rounded-md border border-red-400 bg-red-50 px-2 py-1.5 text-sm text-red-900
    transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20
    dark:border-red-700 dark:bg-red-950/40 dark:text-red-200
  `;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock
            size={16}
            className="text-brand-600 dark:text-brand-400"
          />
          <label className="text-sm font-medium text-gray-900 dark:text-slate-100">
            {title}
            {!readOnly && <span className="ml-1 text-red-500">*</span>}
          </label>
          <Badge variant="brand">{value.length}</Badge>
        </div>
        {!readOnly && canAddMore && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={add}
            disabled={disabled}
          >
            <Plus size={14} />
            Adicionar
          </Button>
        )}
      </div>

      {showRecurrence && (
        <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-300">
                <Repeat size={12} />
                Frequência
              </label>
              <select
                value={effectiveRecurrenceType}
                onChange={(e) =>
                  handleRecurrenceTypeChange(e.target.value as RecurrenceType)
                }
                disabled={disabled || readOnly}
                className={`w-full ${inputClasses}`}
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {isCustomDays && (
              <div className="sm:w-40">
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-slate-300">
                  A cada (dias)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={recurrenceDays ?? ""}
                  onChange={(e) => handleRecurrenceDaysChange(e.target.value)}
                  disabled={disabled || readOnly}
                  className={`w-full ${inputClasses}`}
                />
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
            {isOnce
              ? "A frequência vale para o único horário abaixo."
              : "A frequência vale para todos os horários deste paciente/prestador."}
          </p>
        </div>
      )}

      {value.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
          Nenhum horário definido.
          {!readOnly && canAddMore && (
            <>
              {" "}
              <button
                type="button"
                onClick={add}
                className="text-brand-700 hover:underline dark:text-brand-400"
              >
                Adicionar horário
              </button>
            </>
          )}
        </div>
      )}

      <div className="space-y-2">
        {value.map((s, index) => {
          const locked = isRowLocked(index);
          const dateInvalid = isDateInvalid(index);
          const effWeekday = useDateInput
            ? s.anchorDate
              ? weekdayFromDate(s.anchorDate)
              : s.weekday
            : s.weekday;

          return (
            <div
              key={index}
              className={`rounded-xl border p-3 transition ${locked
                ? "border-amber-300 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-950/20"
                : "border-gray-200 bg-gray-50/60 dark:border-slate-800 dark:bg-slate-800/40"
                }`}
            >
              <div className="flex items-end gap-3">
                <div
                  className={`mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${locked
                    ? "bg-amber-200 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                    : "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                    }`}
                >
                  {index + 1}
                </div>

                <div className="flex flex-1 flex-wrap items-end gap-3">
                  {/* Campo de dia (weekday) ou data (máscara dd/mm/aaaa) */}
                  <div className="min-w-[180px] flex-1">
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                      {useDateInput ? "Início" : "Dia da semana"}
                    </label>
                    {useDateInput ? (
                      <MaskedDateInput
                        value={dateTexts[index] ?? ""}
                        onChange={(v) => handleDateTextChange(index, v)}
                        disabled={disabled}
                        readOnly={readOnly}
                        invalid={dateInvalid}
                      />
                    ) : (
                      <select
                        value={s.weekday}
                        onChange={(e) =>
                          update(index, { weekday: Number(e.target.value) })
                        }
                        disabled={disabled || readOnly}
                        className={`w-full ${inputClasses}`}
                      >
                        {WEEKDAYS.map((w) => (
                          <option key={w.value} value={w.value}>
                            {w.long}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Hora */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={s.startTime}
                      onChange={(e) =>
                        update(index, { startTime: e.target.value })
                      }
                      disabled={disabled || readOnly}
                      className={inputClasses}
                    />
                  </div>

                  {/* Duração */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                      Duração
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={15}
                        max={240}
                        step={5}
                        value={s.durationMin}
                        onChange={(e) =>
                          update(index, {
                            durationMin: Number(e.target.value),
                          })
                        }
                        disabled={disabled || readOnly}
                        className={`w-16 ${inputClasses}`}
                      />
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        min
                      </span>
                    </div>
                  </div>

                  {/* Lixeira */}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={value.length === 1 || disabled || isOnce}
                      className="mb-1 rounded-md p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 dark:text-slate-500 dark:hover:bg-red-950/50 dark:hover:text-red-400 dark:disabled:hover:text-slate-500"
                      title={
                        isOnce
                          ? "Único horário — não pode ser removido"
                          : value.length === 1
                            ? "Pelo menos um horário é obrigatório"
                            : "Remover esta linha"
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {useDateInput && s.anchorDate && (
                <p className="mt-1.5 pl-9 text-xs text-gray-500 dark:text-slate-400">
                  cai em:{" "}
                  <span className="font-medium text-gray-700 dark:text-slate-300">
                    {WEEKDAY_LONG[isoWeekday(effWeekday)]}
                  </span>
                </p>
              )}

              {dateInvalid && (
                <p className="mt-1.5 pl-9 text-xs text-red-600 dark:text-red-400">
                  Data inválida. Use o formato dd/mm/aaaa.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {hasConflict && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-800/60 dark:bg-amber-950/30">
          <AlertCircle
            size={14}
            className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-400"
          />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Alguns horários estão em conflito (com outros agendamentos ou entre
            si). Edite-os ou remova antes de continuar.
          </p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {hint && !error && !hasConflict && (
        <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}