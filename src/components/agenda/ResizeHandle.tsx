import { useState } from "react";

type Props = {
  onResizeMove: (deltaY: number) => void;
  onResizeEnd: (deltaY: number) => void;
  disabled?: boolean;
};

export function ResizeHandle({ onResizeMove, onResizeEnd, disabled }: Props) {
  const [startY, setStartY] = useState<number | null>(null);

  function handlePointerDown(e: React.PointerEvent) {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setStartY(e.clientY);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (startY === null || disabled) return;
    e.stopPropagation();
    const deltaY = e.clientY - startY;
    onResizeMove(deltaY);
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (startY === null || disabled) return;
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.releasePointerCapture(e.pointerId);

    const deltaY = e.clientY - startY;
    if (deltaY !== 0) {
      onResizeEnd(deltaY);
    }
    setStartY(null);
  }

  if (disabled) return null;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="resize-handle absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize bg-black/5 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/20 transition-colors flex items-center justify-center"
      title="Arraste para alterar a duração"
    >
      <div className="w-8 h-0.5 rounded-full bg-black/20 dark:bg-white/40" />
    </div>
  );
}