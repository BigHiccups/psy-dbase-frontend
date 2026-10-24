import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
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
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
            <CalendarDays size={24} />
          </div>
          <div>
            <h2 className="select-none text-lg font-semibold text-gray-900 dark:text-slate-100">
              {formatLongDate(date)}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {appointments.length} {appointments.length === 1 ? "agendamento" : "agendamentos"}
            </p>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Nenhum agendamento para este dia.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {sorted.map((appt) => {
              const style = TYPE_STYLES[appt.type];
              const name = appt.patient?.full_name ?? appt.provider?.display_name ?? "(sem nome)";
              const isCancelled = appt.status === "cancelled";
              const isCompleted = appt.status === "completed";
              const isNoShowJust = appt.status === "no_show_justified";
              const isNoShowUnjust = appt.status === "no_show_unjustified";
              
              const hasCustomColor = !!appt.color && appt.type !== "blocked";
              const customColorStyle = hasCustomColor ? {
                backgroundColor: `${appt.color!}10`,
                borderLeftColor: appt.color!,
                color: appt.color!,
              } : {};
              const defaultClasses = !hasCustomColor ? `${style.bg} ${style.border}` : "border-transparent bg-white dark:bg-slate-800";

              return (
                <button
                  key={appt.id}
                  onClick={() => {
                    onClose();
                    onAppointmentClick(appt);
                  }}
                  className={`group flex w-full items-center gap-4 rounded-xl border-l-[4px] p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${defaultClasses} ${isCompleted || isNoShowJust || isNoShowUnjust ? "opacity-85" : ""}`}
                  style={customColorStyle}
                >
                  <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-black/5 py-1 dark:bg-white/5">
                    <span className={`text-sm font-bold ${!hasCustomColor ? style.text : ''}`}>
                      {appt.start_time ? formatTime(appt.start_time) : "Todo dia"}
                    </span>
                    <span className={`text-[10px] font-medium opacity-70 ${!hasCustomColor ? style.text : ''}`}>
                      {appt.duration_min ? `${appt.duration_min}min` : ""}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-sm font-semibold ${isCancelled ? "line-through opacity-50" : ""} ${!hasCustomColor ? style.text : ''}`}>
                        {name}
                      </p>
                      
                      {/* ICONES COM TITLE ENVOLVIDOS EM SPAN */}
                      {isCompleted && (
                        <span title="Realizada">
                          <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                        </span>
                      )}
                      {isNoShowJust && (
                        <span title="Falta Justificada">
                          <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                        </span>
                      )}
                      {isNoShowUnjust && (
                        <span title="Falta Injustificada">
                          <XCircle size={14} className="text-red-500 shrink-0" />
                        </span>
                      )}
                      {isCancelled && (
                        <span title="Cancelada">
                          <XCircle size={14} className="text-gray-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className={`truncate text-xs mt-0.5 font-medium opacity-80 ${!hasCustomColor ? style.text : ''}`}>
                      {appt.title ? appt.title : style.label}
                    </p>
                  </div>

                  {appt.notes && (
                    <div className="hidden sm:block text-xs text-gray-500 max-w-[120px] truncate italic">
                      "{appt.notes}"
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-slate-800">
          <Link
            to={`/agenda/day/${date}`}
            className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
            onClick={onClose}
          >
            Abrir visão do Dia
          </Link>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}