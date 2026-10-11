import { Check, X } from "lucide-react";
import { TYPE_STYLES } from "../../lib/appointment-colors";
import { formatTime, timeToMinutes } from "../../lib/agenda-date";
import { HOUR_HEIGHT, START_HOUR } from "./TimeColumn";
import type { AppointmentWithRelations } from "../../types";

type Props = {
  appointment: AppointmentWithRelations;
  onClick: (appointment: AppointmentWithRelations) => void;
  expanded?: boolean;
  top?: number;
  height?: number;
  leftPercent?: number;
  widthPercent?: number;
  zIndex?: number;
};

export function AppointmentBlock({
  appointment,
  onClick,
  expanded,
  top,
  height,
  leftPercent = 0,
  widthPercent = 100,
  zIndex = 0,
}: Props) {
  const style = TYPE_STYLES[appointment.type];

  const startMin = timeToMinutes(appointment.start_time);
  const startOffset = startMin - START_HOUR * 60;
  const computedTop = top ?? (startOffset / 60) * HOUR_HEIGHT;
  const computedHeight =
    height ?? (appointment.duration_min / 60) * HOUR_HEIGHT;

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
        absolute overflow-hidden rounded-md border-l-2 px-2 py-1
        text-left text-xs transition hover:brightness-95 focus:outline-none
        focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 dark:focus:ring-offset-slate-950
        ${style.bg} ${style.border} ${style.text}
        ${isCancelled ? "line-through opacity-50" : ""}
        ${isCompleted ? "opacity-70" : ""}
      `}
      style={{
        top: computedTop,
        height: Math.max(computedHeight, 20),
        left: `calc(${leftPercent}% + 4px)`,
        width: `calc(${widthPercent}% - 8px)`,
        zIndex,
      }}
    >
      <div className="flex items-center gap-1">
        {isCompleted && <Check size={10} className="shrink-0" />}
        {isCancelled && <X size={10} className="shrink-0" />}
        <p className="truncate font-medium">
          {expanded ? `${formatTime(appointment.start_time)} · ` : ""}
          {subjectName}
        </p>
      </div>
      {computedHeight >= 40 && (
        <p className="mt-0.5 truncate text-[10px] opacity-80">
          {formatTime(appointment.start_time)} · {appointment.duration_min}min
        </p>
      )}
    </button>
  );
}