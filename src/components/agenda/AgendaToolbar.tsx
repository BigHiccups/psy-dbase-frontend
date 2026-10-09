import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui";
import type { AgendaView } from "../../hooks/useAgendaView";

type Props = {
  view: AgendaView;
  onViewChange: (view: AgendaView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  // Título contextual (ex: "14 de outubro de 2026" ou "Outubro de 2026")
  title: string;
  // Em mobile, esconde "Semana" (força Dia)
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
      {/* Título + navegação */}
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onToday}>
          Hoje
        </Button>
        <div className="flex items-center">
          <button
            onClick={onPrevious}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={onNext}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Próximo"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <h2 className="ml-2 text-base font-semibold text-gray-900">
          {title}
        </h2>
      </div>

      {/* Toggle de modo */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => onViewChange("day")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            view === "day"
              ? "bg-brand-50 text-brand-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Dia
        </button>

        {!hideWeekOnMobile && (
          <button
            onClick={() => onViewChange("week")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              view === "week"
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Semana
          </button>
        )}

        <button
          onClick={() => onViewChange("month")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            view === "month"
              ? "bg-brand-50 text-brand-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Mês
        </button>
      </div>
    </div>
  );
}