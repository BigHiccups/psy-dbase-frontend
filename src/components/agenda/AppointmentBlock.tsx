import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Check, X } from "lucide-react";
import { TYPE_STYLES } from "../../lib/appointment-colors";
import { formatTime, timeToMinutes, parseDateString } from "../../lib/agenda-date";
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

  const isCancelled = appointment.status === "cancelled";
  const isCompleted = appointment.status === "completed";
  const isBlocked = appointment.type === "blocked";

  // Título e Subtítulo
  let title = appointment.patient?.full_name ?? appointment.provider?.display_name;
  let subtitle = `${formatTime(appointment.start_time)} · ${appointment.duration_min}min`;

  if (isBlocked) {
    title = appointment.notes || "Bloqueio";
    const endTotalMins = startMin + appointment.duration_min;
    const endH = Math.floor(endTotalMins / 60) % 24;
    const endM = endTotalMins % 60;
    const endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    
    const startDateObj = parseDateString(appointment.starts_on);
    const isMultiDay = appointment.starts_on !== appointment.ends_on;

    if (!isMultiDay) {
      subtitle = `${formatTime(appointment.start_time)} às ${endTimeStr}`;
    } else {
      const startD = String(startDateObj.getDate()).padStart(2, "0");
      const startM = String(startDateObj.getMonth() + 1).padStart(2, "0");
      const endDateObj = parseDateString(appointment.ends_on);
      const endD = String(endDateObj.getDate()).padStart(2, "0");
      const endM = String(endDateObj.getMonth() + 1).padStart(2, "0");
      subtitle = `início ${formatTime(appointment.start_time)} do dia ${startD}/${startM}, fim ${endTimeStr} do dia ${endD}/${endM}`;
    }
  } else if (!title) {
    title = "(sem nome)";
  }

  // Configura o Drag and Drop
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id,
    data: { appointment },
    disabled: appointment.status !== "active" || isBlocked, // Não arrasta bloqueado/cancelado
  });

  const dragStyle = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const blockBgStyle = isBlocked
    ? {
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.05) 4px, rgba(0,0,0,0.05) 8px)",
      }
    : {};

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      onClick={() => onClick(appointment)}
      className={`
        absolute overflow-hidden rounded-md border-l-2 px-2 py-1
        text-left text-xs transition hover:brightness-95 focus:outline-none
        focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 dark:focus:ring-offset-slate-950
        ${style.bg} ${style.border} ${style.text}
        ${isCancelled ? "line-through opacity-50" : ""}
        ${isCompleted ? "opacity-70" : ""}
        ${isDragging ? "opacity-40 z-50 shadow-2xl ring-2 ring-brand-500 cursor-grabbing" : "cursor-grab"}
      `}
      style={{
        ...blockBgStyle,
        top: computedTop,
        height: Math.max(computedHeight, 20),
        left: `calc(${leftPercent}% + 4px)`,
        width: `calc(${widthPercent}% - 8px)`,
        zIndex: isDragging ? 999 : zIndex,
        ...dragStyle,
      }}
    >
      <div className="flex items-center gap-1">
        {isCompleted && <Check size={10} className="shrink-0" />}
        {isCancelled && <X size={10} className="shrink-0" />}
        <p className="truncate font-medium">
          {expanded && !isBlocked ? `${formatTime(appointment.start_time)} · ` : ""}
          {title}
        </p>
      </div>
      {computedHeight >= 40 && (
        <p className="mt-0.5 truncate text-[10px] opacity-80">
          {subtitle}
        </p>
      )}
    </button>
  );
}