import { useEffect, useMemo } from "react";
import { Plus, Trash2, CalendarClock, AlertCircle } from "lucide-react";
import { Button, Badge } from "../ui";
import { WEEKDAYS } from "../../lib/weekdays";
import type { ScheduleInput } from "../../types";

type Props = {
  value: ScheduleInput[];
  onChange: (schedules: ScheduleInput[]) => void;
  disabledSlots?: { weekday: number; startTime: string }[];
  disabled?: boolean;
  readOnly?: boolean;
  error?: string | null;
  hint?: string;
  title?: string;
  // Callback chamado sempre que o estado de conflito mudar
  onConflictChange?: (hasConflict: boolean) => void;
};

const INITIAL_SCHEDULE: ScheduleInput = {
  weekday: 1,
  startTime: "14:00",
  durationMin: 50,
};

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

  function add() {
    const last = value[value.length - 1];
    const nextWeekday = last ? (last.weekday + 1) % 7 : 1;
    onChange([...value, { ...INITIAL_SCHEDULE, weekday: nextWeekday }]);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  // Normaliza "HH:MM:SS" para "HH:MM"
  function normalize(t: string): string {
    return t.slice(0, 5);
  }

  function isSlotDisabled(weekday: number, startTime: string): boolean {
    const normalized = normalize(startTime);
    return disabledSlots.some(
      (s) => s.weekday === weekday && normalize(s.startTime) === normalized
    );
  }

  // Conflito interno: duas linhas do próprio editor no mesmo slot
  function hasInternalConflict(index: number): boolean {
    const self = value[index];
    return value.some(
      (s, i) =>
        i !== index &&
        s.weekday === self.weekday &&
        normalize(s.startTime) === normalize(self.startTime)
    );
  }

  function isRowLocked(index: number): boolean {
    const s = value[index];
    return isSlotDisabled(s.weekday, s.startTime) || hasInternalConflict(index);
  }

  // Memoiza o cálculo de conflito
  const hasConflict = useMemo(
    () => value.some((_, i) => isRowLocked(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, disabledSlots]
  );

  // Notifica o parent sempre que o conflito mudar
  useEffect(() => {
    onConflictChange?.(hasConflict);
  }, [hasConflict, onConflictChange]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock size={16} className="text-brand-600" />
          <label className="text-sm font-medium text-gray-900">
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
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
          Nenhum horário definido.
          {!readOnly && (
            <>
              {" "}
              <button
                type="button"
                onClick={add}
                className="text-brand-700 hover:underline"
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
                  ? "border-amber-300 bg-amber-50/60"
                  : "border-gray-200 bg-gray-50/60"
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  locked
                    ? "bg-amber-200 text-amber-800"
                    : "bg-brand-100 text-brand-700"
                }`}
              >
                {index + 1}
              </div>

              <select
                value={s.weekday}
                onChange={(e) =>
                  update(index, { weekday: Number(e.target.value) })
                }
                disabled={disabled || readOnly || locked}
                className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
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
                onChange={(e) => update(index, { startTime: e.target.value })}
                disabled={disabled || readOnly || locked}
                className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
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
                  disabled={disabled || readOnly || locked}
                  className="w-16 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                />
                <span className="text-xs text-gray-500">min</span>
              </div>

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={value.length === 1 || disabled}
                  className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
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
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-700" />
          <p className="text-xs text-amber-800">
            Alguns horários estão em conflito (com outros agendamentos ou entre
            si). Remova-os ou troque antes de continuar.
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {hint && !error && !hasConflict && (
        <p className="mt-2 text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}