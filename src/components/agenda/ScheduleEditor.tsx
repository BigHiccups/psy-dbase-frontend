import { Plus, Trash2, CalendarClock } from "lucide-react";
import {
  Button,
  // Input, 
  Badge
} from "../ui";
import { WEEKDAYS } from "../../lib/weekdays";
import type { ScheduleInput } from "../../types";

type Props = {
  value: ScheduleInput[];
  onChange: (schedules: ScheduleInput[]) => void;
  // Slots ocupados (bloqueio rígido — vazio por enquanto)
  disabledSlots?: { weekday: number; startTime: string }[];
  // Desabilita tudo (ex: durante salvamento)
  disabled?: boolean;
  // Mostra só leitura (ex: revisão)
  readOnly?: boolean;
  // Mensagem de erro externa
  error?: string | null;
  // Texto de ajuda contextual
  hint?: string;
  // Rótulo do título (default: "Horários das sessões")
  title?: string;
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

  function isSlotDisabled(weekday: number, startTime: string): boolean {
    return disabledSlots.some(
      (s) => s.weekday === weekday && s.startTime === startTime
    );
  }

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
          const disabled = isSlotDisabled(s.weekday, s.startTime);
          return (
            <div
              key={index}
              className={`flex items-center gap-2 rounded-xl border p-2 ${disabled
                  ? "border-gray-200 bg-gray-100 opacity-60"
                  : "border-gray-200 bg-gray-50/60"
                }`}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700">
                {index + 1}
              </div>

              <select
                value={s.weekday}
                onChange={(e) =>
                  update(index, { weekday: Number(e.target.value) })
                }
                disabled={disabled || readOnly}
                className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-gray-50 disabled:text-gray-500"
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
                className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-gray-50 disabled:text-gray-500"
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
                  className="w-16 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-gray-50 disabled:text-gray-500"
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
                      : "Remover horário"
                  }
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {hint && !error && (
        <p className="mt-2 text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}