import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Modal, Button, Input } from "./ui";
import {
  maskCurrencyBRL,
  parseCurrencyToCents,
  centsToCurrencyBRL,
} from "../lib/masks";
import type { ProviderBilling, BillingFrequency } from "../types";

const MONTHS: { value: number; label: string }[] = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

type Props = {
  open: boolean;
  billingToEdit?: ProviderBilling | null;
  onClose: () => void;
  onSave: (data: {
    description: string;
    amount_cents: number;
    due_day: number;
    due_month: number | null;
    frequency: BillingFrequency;
  }) => void;
};

export function BillingEditorModal({ open, billingToEdit, onClose, onSave }: Props) {
  const [description, setDescription] = useState(billingToEdit?.description ?? "");
  const [amount, setAmount] = useState(
    billingToEdit ? centsToCurrencyBRL(billingToEdit.amount_cents) : ""
  );
  const [dueDay, setDueDay] = useState(billingToEdit?.due_day?.toString() ?? "10");
  const [dueMonth, setDueMonth] = useState(
    billingToEdit?.due_month?.toString() ?? "1"
  );
  const [frequency, setFrequency] = useState<BillingFrequency>(
    billingToEdit?.frequency ?? "monthly"
  );
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);

    const amountCents = parseCurrencyToCents(amount);
    const parsedDueDay = parseInt(dueDay, 10);
    const parsedDueMonth = parseInt(dueMonth, 10);

    if (!description.trim()) return setError("Informe a descrição da conta.");
    if (amountCents === null || amountCents < 0) return setError("Valor inválido.");
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      return setError("O dia do vencimento deve ser entre 1 e 31.");
    }
    if (frequency === "yearly") {
      if (isNaN(parsedDueMonth) || parsedDueMonth < 1 || parsedDueMonth > 12) {
        return setError("O mês do vencimento deve ser entre 1 e 12.");
      }
    }

    onSave({
      description: description.trim(),
      amount_cents: amountCents,
      due_day: parsedDueDay,
      due_month: frequency === "yearly" ? parsedDueMonth : null,
      frequency,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={billingToEdit ? "Editar vencimento" : "Novo vencimento"}
      size="md"
    >
      <div className="space-y-4">
        <Input
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Aluguel, Curso..."
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Valor
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-slate-400">
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(maskCurrencyBRL(e.target.value))}
                placeholder="0,00"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <Input
            label="Dia do vencimento"
            type="number"
            min={1}
            max={31}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Frequência
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as BillingFrequency)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="monthly">Mensal</option>
            <option value="bimonthly">Bimestral</option>
            <option value="semiannual">Semestral</option>
            <option value="yearly">Anual</option>
            <option value="once">Única vez</option>
          </select>
        </div>

        {frequency === "yearly" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Mês do vencimento
            </label>
            <select
              value={dueMonth}
              onChange={(e) => setDueMonth(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Ex: dia 15 de Março de cada ano.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-5 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Salvar vencimento
          </Button>
        </div>
      </div>
    </Modal>
  );
}