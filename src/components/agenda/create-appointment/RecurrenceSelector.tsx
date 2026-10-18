import { Repeat } from "lucide-react";
import { RECURRENCE_OPTIONS } from "../../../lib/recurrence";
import type { RecurrenceType } from "../../../types";

type Props = {
  repeat: boolean;
  recurrenceType: RecurrenceType;
  recurrenceDays: number | null;
  onRepeatChange: (v: boolean) => void;
  onTypeChange: (v: RecurrenceType) => void;
  onDaysChange: (v: number | null) => void;
  dateLabel: string;
};

export function RecurrenceSelector({
  repeat,
  recurrenceType,
  recurrenceDays,
  onRepeatChange,
  onTypeChange,
  onDaysChange,
  dateLabel,
}: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={repeat}
          onChange={(e) => onRepeatChange(e.target.checked)}
          className="h-4 w-4 accent-brand-600"
        />
        <Repeat size={14} className="text-brand-600 dark:text-brand-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
          Repetir este agendamento
        </span>
      </label>

      {repeat && (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
              Frequência
            </label>
            <select
              value={recurrenceType}
              onChange={(e) => {
                const next = e.target.value as RecurrenceType;
                onTypeChange(next);
                if (next === "custom_days") {
                  onDaysChange(recurrenceDays ?? 15);
                } else {
                  onDaysChange(null);
                }
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {recurrenceType === "custom_days" && (
            <div className="sm:w-40">
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                A cada (dias)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={recurrenceDays ?? ""}
                onChange={(e) =>
                  onDaysChange(
                    Number.isFinite(Number(e.target.value))
                      ? Number(e.target.value)
                      : null
                  )
                }
                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          )}
        </div>
      )}

      {repeat && (
        <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
          A primeira ocorrência será em {dateLabel}.
        </p>
      )}
    </div>
  );
}