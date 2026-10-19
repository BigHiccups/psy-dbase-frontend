import { Wallet } from "lucide-react";
import { Modal, Button } from "../ui";
import { centsToCurrencyBRL } from "../../lib/masks";
import { formatLongDate } from "../../lib/agenda-date";
import type { BillingWithProvider } from "../../hooks/useAllUpcomingBillings";

type Props = {
  open: boolean;
  date: string;
  billings: BillingWithProvider[];
  onClose: () => void;
};

export function DayBillingsModal({ open, date, billings, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Vencimentos do dia" size="md">
      <div className="space-y-4">
        <div className="rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            {formatLongDate(date)}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {billings.length} {billings.length === 1 ? "conta a pagar" : "contas a pagar"}
          </p>
        </div>

        <ul className="space-y-2">
          {billings.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                  <Wallet size={14} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">
                    {b.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {b.provider_name}
                  </p>
                </div>
              </div>
              <p className="font-medium text-gray-900 dark:text-slate-100">
                {centsToCurrencyBRL(b.amount_cents)}
              </p>
            </li>
          ))}
        </ul>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </Modal>
  );
}