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
  | "id"
  | "user_id"
  | "provider_id"
  | "status"
  | "created_at"
  | "updated_at"
  | "starts_on"
> & { id?: string; starts_on?: string };
type Props = {
  billings: DraftBilling[];
  onChange: (billings: DraftBilling[]) => void;
  onRemove: (id: string, index: number) => void;
};

export function BillingList({ billings, onChange, onRemove }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function handleSave(data: Omit<DraftBilling, "id">) {
    if (editingIndex !== null) {
      // Editar — preserva starts_on e id existentes
      const updated = [...billings];
      updated[editingIndex] = { ...updated[editingIndex], ...data };
      onChange(updated);
    } else {
      // Criar — starts_on será preenchido no ProviderForm (hoje)
      onChange([...billings, data]);
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