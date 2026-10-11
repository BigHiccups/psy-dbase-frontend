import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui";
import type { AgendaView } from "../../hooks/useAgendaView";

type Props = {
  view: AgendaView;
  onViewChange: (view: AgendaView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  title: string;
  hideWeekOnMobile?: boolean;
};

export function AgendaToolbar({
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  title,
  hideWeekOnMobile,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onToday}>
          Hoje
        </Button>
        <div className="flex items-center">
          <button
            onClick={onPrevious}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={onNext}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Próximo"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <h2 className="ml-2 text-base font-semibold text-gray-900 dark:text-slate-100">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={() => onViewChange("day")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            view === "day"
              ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
              : "text-gray-600 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          Dia
        </button>

        {!hideWeekOnMobile && (
          <button
            onClick={() => onViewChange("week")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              view === "week"
                ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                : "text-gray-600 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            Semana
          </button>
        )}

        <button
          onClick={() => onViewChange("month")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            view === "month"
              ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
              : "text-gray-600 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          Mês
        </button>
      </div>
    </div>
  );
}