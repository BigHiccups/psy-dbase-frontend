import { useRef } from "react";
import { useDroppable } from "@dnd-kit/core";

type Props = {
  id: string;
  onClick?: () => void;
  onDrawStart?: (date: string, hour: number, clientY: number) => void;
  onDrawMove?: (clientY: number) => void;
  onDrawEnd?: (clientY: number) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

export function DroppableSlot({
  id,
  onClick,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  children,
  style,
}: Props) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const isDrawingRef = useRef(false);

  const [date, hourStr] = id.split("|");
  const hour = parseInt(hourStr, 10);

  function handlePointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    onDrawStart?.(date, hour, e.clientY);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDrawingRef.current) return;
    onDrawMove?.(e.clientY);
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!isDrawingRef.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    isDrawingRef.current = false;
    onDrawEnd?.(e.clientY);
  }

  function handleClick(e: React.MouseEvent) {
    if (e.detail !== 0) return;
    onClick?.();
  }

  return (
    <div
      ref={setNodeRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      // Remove o border-r daqui, deixa só o border-b (horizontal)
      className={`relative cursor-pointer border-b border-gray-100 transition dark:border-slate-800 ${
        isOver
          ? "bg-brand-50 ring-2 ring-inset ring-brand-400 dark:bg-brand-900/20"
          : "hover:bg-gray-50/60 dark:hover:bg-slate-800/40"
      }`}
      style={{ ...style, touchAction: "none" }}
    >
      {children}
    </div>
  );
}