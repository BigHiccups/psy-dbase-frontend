import { useRef } from "react";
import { useDroppable } from "@dnd-kit/core";

type Props = {
  id: string; // formato "YYYY-MM-DD|hour"
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
  style 
}: Props) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const isDrawingRef = useRef(false);

  // Pega a data e hora do ID ("2026-10-16|14")
  const [date, hourStr] = id.split("|");
  const hour = parseInt(hourStr, 10);

  function handlePointerDown(e: React.PointerEvent) {
    // Só inicia o desenho com o botão esquerdo do mouse
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

  // Se o usuário só clicou (sem arrastar muito), trata como clique normal
  function handleClick(e: React.MouseEvent) {
    // O onClick nativo dispara depois do pointerUp. 
    // O Agenda.tsx vai saber diferenciar clique de arrasto.
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
      className={`relative cursor-pointer border-b border-gray-100 transition dark:border-slate-800 ${
        isOver
          ? "bg-brand-50 dark:bg-brand-900/20 ring-2 ring-inset ring-brand-400"
          : "hover:bg-gray-50/60 dark:hover:bg-slate-800/40"
      }`}
      style={style}
    >
      {children}
    </div>
  );
}