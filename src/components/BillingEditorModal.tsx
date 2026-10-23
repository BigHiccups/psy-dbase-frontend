import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Modal, Button, Input } from "./ui";
import { maskCurrencyBRL, parseCurrencyToCents, centsToCurrencyBRL } from "../lib/masks";
import type { ProviderBilling } from "../types";

type Props = {
  open: boolean;
  billingToEdit?: ProviderBilling | null;
  providerData?: {
    payment_format: string;
    default_payment_method: string;
    session_number_start: number;
  };
  onClose: () => void;
  onSave: (data: any) => void;
};

export function BillingEditorModal({ open, billingToEdit, providerData, onClose, onSave }: Props) {
  const [description, setDescription] = useState(billingToEdit?.description ?? "");
  const [amount, setAmount] = useState(billingToEdit ? centsToCurrencyBRL(billingToEdit.amount_cents) : "");
  const [dueDay, setDueDay] = useState(billingToEdit?.due_day?.toString() ?? "10");
  
  const [paymentFormat, setPaymentFormat] = useState(providerData?.payment_format ?? "avulso");
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(providerData?.default_payment_method ?? "");
  const [sessionNumberStart, setSessionNumberStart] = useState(providerData?.session_number_start?.toString() ?? "0");

  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    const amountCents = parseCurrencyToCents(amount);
    const parsedDueDay = parseInt(dueDay, 10);

    if (!description.trim()) return setError("Informe a descrição.");
    if (amountCents === null || amountCents < 0) return setError("Valor inválido.");
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) return setError("O dia deve ser entre 1 e 31.");

    onSave({
      description: description.trim(),
      amount_cents: amountCents,
      due_day: parsedDueDay,
      provider_payment_format: paymentFormat,
      provider_default_payment_method: defaultPaymentMethod || null,
      provider_session_number_start: parseInt(sessionNumberStart, 10) || 0,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={billingToEdit ? "Editar faturamento" : "Faturamento"} size="md">
      <div className="space-y-4">
        <Input label="Descrição do Serviço" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Análise Pessoal, Supervisão..." />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Valor</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
              <input type="text" value={amount} onChange={(e) => setAmount(maskCurrencyBRL(e.target.value))} placeholder="0,00" className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
            </div>
          </div>
          <Input label="Dia do vencimento" type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
        </div>

        <div className="border-t border-gray-100 pt-4 dark:border-slate-800">
          <h3 className="mb-3 text-xs font-medium uppercase text-gray-500">Configurações do Prestador</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Forma de Pagamento</label>
              <select value={paymentFormat} onChange={(e) => setPaymentFormat(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                <option value="avulso">Avulso</option>
                <option value="vencimento">Vencimento</option>
                <option value="antecipado">Antecipado</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Meio Padrão</label>
              <select value={defaultPaymentMethod} onChange={(e) => setDefaultPaymentMethod(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                <option value="">—</option>
                <option value="pix">PIX</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Input label="Iniciar contagem de sessões em" type="number" min={0} value={sessionNumberStart} onChange={(e) => setSessionNumberStart(e.target.value)} />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-5 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleSave}>Salvar</Button>
        </div>
      </div>
    </Modal>
  );
}