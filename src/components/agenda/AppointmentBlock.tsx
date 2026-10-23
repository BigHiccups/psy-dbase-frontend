import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Check, X } from "lucide-react";
import { TYPE_STYLES } from "../../lib/appointment-colors";
import { formatTime, timeToMinutes, parseDateString } from "../../lib/agenda-date";
import { HOUR_HEIGHT, START_HOUR } from "./TimeColumn";
import { ResizeHandle } from "./ResizeHandle";
import type { AppointmentWithRelations } from "../../types";

type Props = {
  appointment: AppointmentWithRelations;
  onClick: (appointment: AppointmentWithRelations) => void;
  onResize?: (appointment: AppointmentWithRelations, deltaY: number) => void;
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
  onResize,
  expanded,
  top,
  height,
  leftPercent = 0,
  widthPercent = 100,
  zIndex = 0,
}: Props) {
  const style = TYPE_STYLES[appointment.type];

  const hasTime = !!appointment.start_time;
  const startMin = hasTime ? timeToMinutes(appointment.start_time) : 0;
  const startOffset = startMin - START_HOUR * 60;
  
  const computedTop = top ?? (startOffset / 60) * HOUR_HEIGHT;
  const originalHeight = height ?? (appointment.duration_min ? (appointment.duration_min / 60) * HOUR_HEIGHT : 20);

  const [previewHeight, setPreviewHeight] = useState<number | null>(null);
  const [previewEndTime, setPreviewEndTime] = useState<string | null>(null);

  const currentHeight = previewHeight ?? Math.max(originalHeight, 20);

  const isCancelled = appointment.status === "cancelled";
  const isCompleted = appointment.status === "completed";
  const isBlocked = appointment.type === "blocked";

  let mainTitle = appointment.patient?.full_name ?? appointment.provider?.display_name;
  let subtitle = "";

  if (isBlocked) {
    mainTitle = appointment.notes || "Bloqueio";
    if (hasTime) {
      const endTotalMins = startMin + (appointment.duration_min || 0);
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
    } else {
      subtitle = "Dia inteiro";
    }
  } else {
    if (!mainTitle) mainTitle = "(sem nome)";
    if (appointment.title) {
      subtitle = appointment.title;
    } else if (hasTime) {
      subtitle = `${formatTime(appointment.start_time)} · ${appointment.duration_min}min`;
    }
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id,
    data: { appointment },
    disabled: appointment.status !== "active" || isBlocked || !hasTime,
  });

  const dragStyle = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  // Lógica de cor customizada
  const hasCustomColor = !!appointment.color && !isBlocked;
  const customColorStyle = hasCustomColor ? {
    backgroundColor: `${appointment.color!}20`, // <-- Adicionado !
    borderColor: appointment.color!,            // <-- Adicionado !
    color: appointment.color!,                  // <-- Adicionado !
  } : {};

  const defaultStyleClasses = !hasCustomColor ? `${style.bg} ${style.border} ${style.text}` : '';

  const blockBgStyle = isBlocked
    ? { backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.05) 4px, rgba(0,0,0,0.05) 8px)" }
    : {};

  function handleResizeMove(deltaY: number) {
    if (!onResize || !hasTime) return;
    const newHeight = Math.max(originalHeight + deltaY, 20);
    setPreviewHeight(newHeight);
    const newDurationMin = Math.round((newHeight / HOUR_HEIGHT) * 60);
    const endTotalMins = startMin + newDurationMin;
    const endH = Math.floor(endTotalMins / 60) % 24;
    const endM = endTotalMins % 60;
    setPreviewEndTime(`${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`);
  }

  function handleResizeEnd(deltaY: number) {
    setPreviewHeight(null);
    setPreviewEndTime(null);
    if (onResize) onResize(appointment, deltaY);
  }

  return (
    <div
      className="absolute"
      style={{
        top: computedTop,
        height: currentHeight,
        left: `calc(${leftPercent}% + 4px)`,
        width: `calc(${widthPercent}% - 8px)`,
        zIndex: previewHeight ? 1000 : isDragging ? 999 : zIndex,
      }}
    >
      <button
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        type="button"
        onClick={() => onClick(appointment)}
        className={`
          absolute inset-0 w-full h-full overflow-hidden rounded-md border-l-2 px-2 py-1
          text-left text-xs transition hover:brightness-95 focus:outline-none
          focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 dark:focus:ring-offset-slate-950
          ${defaultStyleClasses}
          ${isCancelled ? "line-through opacity-50" : ""}
          ${isCompleted ? "opacity-70" : ""}
          ${isDragging ? "opacity-40 shadow-2xl ring-2 ring-brand-500 cursor-grabbing" : "cursor-grab"}
        `}
        style={{ ...blockBgStyle, ...dragStyle, ...customColorStyle }}
      >
        <div className="flex items-center gap-1">
          {isCompleted && <Check size={10} className="shrink-0" />}
          {isCancelled && <X size={10} className="shrink-0" />}
          <p className="truncate font-medium">
            {expanded && !isBlocked && hasTime ? `${formatTime(appointment.start_time)} · ` : ""}
            {mainTitle}
          </p>
        </div>
        {currentHeight >= 40 && subtitle && (
          <p className="mt-0.5 truncate text-[10px] opacity-80">{subtitle}</p>
        )}
      </button>

      {previewHeight && previewEndTime && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg z-50 pointer-events-none">
          Término: {previewEndTime}
        </div>
      )}

      {onResize && !isBlocked && !isCancelled && !isCompleted && hasTime && (
        <ResizeHandle
          onResizeMove={handleResizeMove}
          onResizeEnd={handleResizeEnd}
        />
      )}
    </div>
  );
}