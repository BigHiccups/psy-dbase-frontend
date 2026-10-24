import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { TYPE_STYLES } from "../../lib/appointment-colors";
import { formatTime, timeToMinutes } from "../../lib/agenda-date";
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
  appointment, onClick, onResize, expanded, top, height,
  leftPercent = 0, widthPercent = 100, zIndex = 0,
}: Props) {
  const style = TYPE_STYLES[appointment.type];
  const hasTime = !!appointment.start_time;
  const startMin = hasTime ? timeToMinutes(appointment.start_time) : 0;
  const startOffset = startMin - START_HOUR * 60;
  
  const computedTop = top ?? (startOffset / 60) * HOUR_HEIGHT;
  const originalHeight = height ?? (appointment.duration_min ? (appointment.duration_min / 60) * HOUR_HEIGHT : 20);

  const [previewHeight, setPreviewHeight] = useState<number | null>(null);
  const [previewEndTime, setPreviewEndTime] = useState<string | null>(null);

  const currentHeight = previewHeight ?? Math.max(originalHeight, 24);

  const isCancelled = appointment.status === "cancelled";
  const isCompleted = appointment.status === "completed";
  const isNoShowJust = appointment.status === "no_show_justified";
  const isNoShowUnjust = appointment.status === "no_show_unjustified";
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
      subtitle = appointment.starts_on === appointment.ends_on ? `${formatTime(appointment.start_time)} às ${endTimeStr}` : "Vários dias";
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

  const hasCustomColor = !!appointment.color && !isBlocked;
  
  // Borda fina e fundo sutil. O texto agora usa a cor padrão do tema para garantir leitura.
  const customColorStyle = hasCustomColor ? {
    backgroundColor: `${appointment.color!}15`, 
    borderColor: `${appointment.color!}50`, 
  } : {};

  const defaultStyleClasses = !hasCustomColor 
    ? `${style.bg} ${style.border} ${style.text}` 
    : 'text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800'; 

  // Cores do status (pílula)
  let statusBg = "bg-slate-400 dark:bg-slate-500"; // Opaca
  if (isCompleted) statusBg = "bg-green-500";
  else if (isNoShowJust) statusBg = "bg-amber-500";
  else if (isNoShowUnjust) statusBg = "bg-red-500";

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
      className="absolute group"
      style={{
        top: computedTop,
        height: currentHeight,
        left: `calc(${leftPercent}% + 4px)`,
        width: `calc(${widthPercent}% - 8px)`,
        // Z-INDEX FORÇADO PARA 10 PARA FICAR ACIMA DA GRADE
        zIndex: previewHeight ? 1000 : isDragging ? 999 : Math.max(zIndex, 10),
      }}
    >
      <button
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        type="button"
        onClick={() => onClick(appointment)}
        className={`
          absolute inset-0 w-full h-full overflow-hidden rounded-lg border py-1.5 pl-3 pr-2.5
          text-left text-xs shadow-sm transition-all hover:shadow-md hover:brightness-[0.98] focus:outline-none
          focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 dark:focus:ring-offset-slate-950
          ${defaultStyleClasses}
          ${isCancelled ? "line-through opacity-50" : ""}
          ${isCompleted || isNoShowJust || isNoShowUnjust ? "opacity-85" : ""}
          ${isDragging ? "opacity-60 shadow-xl ring-2 ring-brand-500 cursor-grabbing z-50" : "cursor-grab"}
        `}
        style={{ ...dragStyle, ...customColorStyle }}
      >
        {/* PÍLULA DE STATUS */}
        <div className={`absolute left-1.5 top-1.5 bottom-1.5 w-1 rounded-full ${statusBg} opacity-90`} />
        
        <div className="flex items-start gap-1.5 pl-2">
          {isCancelled && <X size={12} className="shrink-0 mt-0.5" strokeWidth={3} />}
          <div className="flex flex-col min-w-0">
            <p className="truncate font-semibold text-[13px] leading-tight">
              {expanded && !isBlocked && hasTime ? `${formatTime(appointment.start_time)} · ` : ""}
              {mainTitle}
            </p>
            {currentHeight >= 45 && subtitle && (
              <p className="mt-0.5 truncate text-[11px] opacity-75 font-medium">{subtitle}</p>
            )}
          </div>
        </div>
      </button>

      {previewHeight && previewEndTime && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-lg z-50 pointer-events-none">
          Término: {previewEndTime}
        </div>
      )}

      {onResize && !isBlocked && !isCancelled && !isCompleted && !isNoShowJust && !isNoShowUnjust && hasTime && (
        <ResizeHandle
          onResizeMove={handleResizeMove}
          onResizeEnd={handleResizeEnd}
        />
      )}
    </div>
  );
}