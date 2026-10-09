import { Check, X } from "lucide-react";
import { TYPE_STYLES } from "../../lib/appointment-colors";
import { formatTime, timeToMinutes } from "../../lib/agenda-date";
import { HOUR_HEIGHT, START_HOUR } from "./TimeColumn";
import type { AppointmentWithRelations } from "../../types";

type Props = {
  appointment: AppointmentWithRelations;
  onClick: (appointment: AppointmentWithRelations) => void;
  // Se true, mostra mais detalhes (usado no DayView)
  expanded?: boolean;
};

export function AppointmentBlock({ appointment, onClick, expanded }: Props) {
  const style = TYPE_STYLES[appointment.type];
  const startMin = timeToMinutes(appointment.start_time);
  const startOffset = startMin - START_HOUR * 60;
  const top = (startOffset / 60) * HOUR_HEIGHT;
  const height = (appointment.duration_min / 60) * HOUR_HEIGHT;

  // Nome do paciente ou provider
  const subjectName =
    appointment.patient?.full_name ??
    appointment.provider?.display_name ??
    "(sem nome)";

  const isCancelled = appointment.status === "cancelled";
  const isCompleted = appointment.status === "completed";

  return (
    <button
      type="button"
      onClick={() => onClick(appointment)}
      className={`
        absolute left-1 right-1 overflow-hidden rounded-md border-l-2 px-2 py-1
        text-left text-xs transition hover:brightness-95 focus:outline-none
        focus:ring-2 focus:ring-brand-500 focus:ring-offset-1
        ${style.bg} ${style.border} ${style.text}
        ${isCancelled ? "line-through opacity-50" : ""}
        ${isCompleted ? "opacity-70" : ""}
      `}
      style={{ top, height: Math.max(height, 20) }}
    >
      <div className="flex items-center gap-1">
        {isCompleted && <Check size={10} className="shrink-0" />}
        {isCancelled && <X size={10} className="shrink-0" />}
        <p className="truncate font-medium">
          {expanded ? `${formatTime(appointment.start_time)} · ` : ""}
          {subjectName}
        </p>
      </div>
      {height >= 40 && (
        <p className="mt-0.5 truncate text-[10px] opacity-80">
          {formatTime(appointment.start_time)} · {appointment.duration_min}min
        </p>
      )}
    </button>
  );
}