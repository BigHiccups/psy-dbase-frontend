import { PauseCircle } from "lucide-react";
import { MaskedDateInput } from "../../ui/MaskedDateInput";
import { isValidDateBR } from "../../../lib/masks";

type Props = {
  fromText: string;
  toText: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
};

export function BlockPeriodSelector({
  fromText,
  toText,
  onFromChange,
  onToChange,
}: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
      <div className="mb-3 flex items-center gap-2">
        <PauseCircle size={14} className="text-brand-600 dark:text-brand-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
          Suspender por período
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
            De
          </label>
          <MaskedDateInput
            value={fromText}
            onChange={onFromChange}
            invalid={fromText.length > 0 && !isValidDateBR(fromText)}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
            Até
          </label>
          <MaskedDateInput
            value={toText}
            onChange={onToChange}
            invalid={toText.length > 0 && !isValidDateBR(toText)}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
        Cria um bloqueio para cada dia do intervalo, no horário informado acima.
      </p>
    </div>
  );
}