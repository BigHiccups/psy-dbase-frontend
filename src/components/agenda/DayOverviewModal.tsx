import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { Button, Modal } from "../ui";
import { TYPE_STYLES } from "../../lib/appointment-colors";
import { formatTime, formatLongDate } from "../../lib/agenda-date";
import type { AppointmentWithRelations } from "../../types";

type Props = {
  open: boolean;
  date: string;
  appointments: AppointmentWithRelations[];
  onClose: () => void;
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
};

export function DayOverviewModal({
  open,
  date,
  appointments,
  onClose,
  onAppointmentClick,
}: Props) {
  const sorted = [...appointments].sort((a, b) => {
    if (!a.start_time) return 1;
    if (!b.start_time) return -1;
    return a.start_time.localeCompare(b.start_time);
  });

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
            <CalendarDays size={20} />
          </div>
          <div>
            <h2 className="select-none text-base font-semibold text-gray-900 dark:text-slate-100">
              {formatLongDate(date)}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {appointments.length}{" "}
              {appointments.length === 1 ? "agendamento" : "agendamentos"}
            </p>
          </div>
        </div>

        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-slate-400">
            Nenhum agendamento neste dia.
          </p>
        ) : (
          <div className="space-y-2">
            {sorted.map((appt) => {
              const style = TYPE_STYLES[appt.type];
              const name = appt.patient?.full_name ?? appt.provider?.display_name ?? "(sem nome)";
              const isCancelled = appt.status === "cancelled";

              const hasCustomColor = !!appt.color && appt.type !== "blocked";
              const customColorStyle = hasCustomColor ? {
                backgroundColor: `${appt.color!}20`, // <-- Adicionado !
                borderLeftColor: appt.color!,        // <-- Adicionado !
                color: appt.color!,                  // <-- Adicionado !
              } : {};
              const defaultClasses = !hasCustomColor ? `${style.bg} ${style.border}` : '';

              return (
                <button
                  key={appt.id}
                  onClick={() => {
                    onClose();
                    onAppointmentClick(appt);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg border-l-4 p-3 text-left transition hover:brightness-95 ${defaultClasses}`}
                  style={customColorStyle}
                >
                  <div className="w-14 shrink-0">
                    <p className={`text-sm font-semibold ${!hasCustomColor ? style.text : ''}`}>
                      {appt.start_time ? formatTime(appt.start_time) : "Dia todo"}
                    </p>
                    <p className={`text-[10px] ${!hasCustomColor ? style.text : ''} opacity-70`}>
                      {appt.duration_min ? `${appt.duration_min}min` : ""}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${isCancelled ? "line-through opacity-50" : ""} ${!hasCustomColor ? style.text : ''}`}>
                      {name}
                    </p>
                    <p className={`truncate text-[10px] opacity-80 ${!hasCustomColor ? style.text : ''}`}>
                      {appt.title ? appt.title : style.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex justify-between border-t border-gray-100 pt-4 dark:border-slate-800">
          <Link
            to={`/agenda/day/${date}`}
            className="text-sm text-brand-700 hover:underline dark:text-brand-400"
            onClick={onClose}
          >
            Abrir como Dia
          </Link>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}