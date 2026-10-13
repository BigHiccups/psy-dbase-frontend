import { useEffect, useMemo } from "react";
import { Plus, Trash2, CalendarClock, AlertCircle } from "lucide-react";
import { Button, Badge } from "../ui";
import { WEEKDAYS } from "../../lib/weekdays";
import { slotOverlapsAppointment } from "../../lib/appointment-overlap";
import type { ScheduleInput } from "../../types";

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
};

const DEFAULT_DURATION = 50;
const DEFAULT_START_TIME = "14:00";

function normalizeTime(t: string): string {
  return t.slice(0, 5);
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
}: Props) {
  function update(index: number, patch: Partial<ScheduleInput>) {
    onChange(value.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  // Prepara lista de slots ocupados (com duração para sobreposição)
  const occupiedList = useMemo(() => {
    return disabledSlots.map((s) => ({
      weekday: s.weekday,
      start_time: normalizeTime(s.startTime),
      duration_min: s.durationMin ?? DEFAULT_DURATION,
    }));
  }, [disabledSlots]);

  // Verifica se um slot externo sobrepõe
  function isExternallyOverlapping(
    weekday: number,
    startTime: string,
    durationMin: number
  ): boolean {
    const found = occupiedList.find((occ) =>
      slotOverlapsAppointment(
        { weekday, startTime, durationMin },
        occ
      )
    );
    return !!found;
  }

  // Conflito interno: outra linha do próprio editor que sobrepõe
  function hasInternalConflict(index: number): boolean {
    const self = value[index];
    return value.some(
      (s, i) =>
        i !== index &&
        slotOverlapsAppointment(
          {
            weekday: self.weekday,
            startTime: self.startTime,
            durationMin: self.durationMin,
          },
          {
            weekday: s.weekday,
            start_time: s.startTime,
            duration_min: s.durationMin,
          }
        )
    );
  }

  function isRowLocked(index: number): boolean {
    const s = value[index];
    return (
      isExternallyOverlapping(s.weekday, s.startTime, s.durationMin) ||
      hasInternalConflict(index)
    );
  }

  const hasConflict = useMemo(
    () => value.some((_, i) => isRowLocked(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, disabledSlots]
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
            weekday: s.weekday,
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
        return {
          weekday: wd,
          startTime: baseStartTime,
          durationMin: baseDuration,
        };
      }
    }

    if (isSlotFree(baseWeekday, DEFAULT_START_TIME, baseDuration)) {
      return {
        weekday: baseWeekday,
        startTime: DEFAULT_START_TIME,
        durationMin: baseDuration,
      };
    }

    for (let wd = 0; wd < 7; wd++) {
      if (isSlotFree(wd, DEFAULT_START_TIME, DEFAULT_DURATION)) {
        return {
          weekday: wd,
          startTime: DEFAULT_START_TIME,
          durationMin: DEFAULT_DURATION,
        };
      }
    }

    return {
      weekday: 1,
      startTime: DEFAULT_START_TIME,
      durationMin: DEFAULT_DURATION,
    };
  }

  function add() {
    onChange([...value, findFreeSlot()]);
  }

  const inputClasses = `
    rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900
    transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20
    disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
    dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100
    dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500
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
        {!readOnly && (
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

      {value.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
          Nenhum horário definido.
          {!readOnly && (
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
          return (
            <div
              key={index}
              className={`flex items-center gap-2 rounded-xl border p-2 transition ${
                locked
                  ? "border-amber-300 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-950/20"
                  : "border-gray-200 bg-gray-50/60 dark:border-slate-800 dark:bg-slate-800/40"
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  locked
                    ? "bg-amber-200 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                    : "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                }`}
              >
                {index + 1}
              </div>

              <select
                value={s.weekday}
                onChange={(e) =>
                  update(index, { weekday: Number(e.target.value) })
                }
                disabled={disabled || readOnly}
                className={`min-w-0 flex-1 ${inputClasses}`}
              >
                {WEEKDAYS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.long}
                  </option>
                ))}
              </select>

              <input
                type="time"
                value={s.startTime}
                onChange={(e) =>
                  update(index, { startTime: e.target.value })
                }
                disabled={disabled || readOnly}
                className={inputClasses}
              />

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={15}
                  max={240}
                  step={5}
                  value={s.durationMin}
                  onChange={(e) =>
                    update(index, { durationMin: Number(e.target.value) })
                  }
                  disabled={disabled || readOnly}
                  className={`w-16 ${inputClasses}`}
                />
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  min
                </span>
              </div>

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={value.length === 1 || disabled}
                  className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 dark:text-slate-500 dark:hover:bg-red-950/50 dark:hover:text-red-400 dark:disabled:hover:text-slate-500"
                  title={
                    value.length === 1
                      ? "Pelo menos um horário é obrigatório"
                      : "Remover esta linha"
                  }
                >
                  <Trash2 size={14} />
                </button>
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