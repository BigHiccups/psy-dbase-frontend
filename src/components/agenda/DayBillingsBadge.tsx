import { Wallet } from "lucide-react";

type Props = {
  count: number;
  onClick: () => void;
};

export function DayBillingsBadge({ count, onClick }: Props) {
  if (count === 0) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/80"
      title={`${count} vencimento(s) para pagar hoje`}
    >
      <Wallet size={10} />
      {count} {count === 1 ? "conta" : "contas"}
    </button>
  );
}