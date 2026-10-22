import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui";
import { BillingEditorModal } from "./BillingEditorModal";
import { centsToCurrencyBRL } from "../lib/masks";
import type { ProviderBilling } from "../types";

const MONTH_LABEL = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export type DraftBilling = Omit<
  ProviderBilling,
  "user_id" | "provider_id" | "status" | "created_at" | "updated_at" | "starts_on"
> & { id?: string; starts_on?: string };

type ProviderConfig = {
  payment_format: string;
  default_payment_method: string;
  session_number_start: number;
};

type Props = {
  billings: DraftBilling[];
  providerData: ProviderConfig;
  onChange: (billings: DraftBilling[]) => void;
  onProviderDataChange: (data: ProviderConfig) => void;
  onRemove: (id: string, index: number) => void;
};

export function BillingList({
  billings,
  providerData,
  onChange,
  onProviderDataChange,
  onRemove,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function handleSave(data: any) {
    // 1. Atualiza as configurações gerais do prestador no Formulário Pai
    onProviderDataChange({
      payment_format: data.provider_payment_format,
      default_payment_method: data.provider_default_payment_method || "",
      session_number_start: data.provider_session_number_start || 0,
    });

    // 2. Separa os dados que pertencem ao vencimento
    const {
      provider_payment_format,
      provider_default_payment_method,
      provider_session_number_start,
      ...billingData
    } = data;

    // 3. Salva o vencimento na lista
    if (editingIndex !== null) {
      const updated = [...billings];
      updated[editingIndex] = { ...updated[editingIndex], ...billingData };
      onChange(updated);
    } else {
      onChange([...billings, billingData]);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
          Vencimentos
        </h2>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditingIndex(null);
            setModalOpen(true);
          }}
        >
          <Plus size={14} />
          Adicionar
        </Button>
      </div>

      {billings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Nenhum vencimento cadastrado ainda.
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            Clique em adicionar para configurar os valores e formas de pagamento.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {billings.map((b, i) => {
            const isYearly = b.frequency === "yearly" && b.due_month;
            const dueLabel = isYearly
              ? `Todo dia ${b.due_day} de ${MONTH_LABEL[(b.due_month ?? 1) - 1]}`
              : `Todo dia ${b.due_day}`;
            return (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">
                    {b.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {dueLabel} · {centsToCurrencyBRL(b.amount_cents)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndex(i);
                      setModalOpen(true);
                    }}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(b.id || "", i)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modalOpen && (
        <BillingEditorModal
          open
          providerData={providerData} // <-- Passando os dados do prestador
          billingToEdit={
            editingIndex !== null
              ? ({
                  ...billings[editingIndex],
                  id: billings[editingIndex].id || "",
                  due_month: billings[editingIndex].due_month ?? null,
                } as ProviderBilling)
              : null
          }
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}