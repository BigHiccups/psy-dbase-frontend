import { useDroppable } from "@dnd-kit/core";

type Props = {
  id: string; // formato "YYYY-MM-DD|hour" (ex: "2026-10-23|14")
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

export function DroppableSlot({ id, onClick, children, style }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
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