import { useState } from "react";
import { Pencil, Receipt } from "lucide-react";
import { Button } from "./ui";
import { BillingEditorModal } from "./BillingEditorModal";
import { centsToCurrencyBRL } from "../lib/masks";
import type { ProviderBilling } from "../types";

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
};

export function BillingList({ billings, providerData, onChange, onProviderDataChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  // Pega o primeiro (e único) faturamento
  const billing = billings[0];

  function handleSave(data: any) {
    onProviderDataChange({
      payment_format: data.provider_payment_format,
      default_payment_method: data.provider_default_payment_method || "",
      session_number_start: data.provider_session_number_start || 0,
    });

    const { provider_payment_format, provider_default_payment_method, provider_session_number_start, ...billingData } = data;

    if (billing) {
      onChange([{ ...billing, ...billingData }]);
    } else {
      onChange([billingData]);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">Faturamento do Serviço</h2>

      {!billing ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
            Nenhum faturamento configurado para este serviço.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setModalOpen(true);
            }}
          >
            <Receipt size={14} /> Configurar Faturamento
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="font-medium text-gray-900 dark:text-slate-100">{billing.description}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Todo dia {billing.due_day} · {centsToCurrencyBRL(billing.amount_cents)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
            title="Editar faturamento"
          >
            <Pencil size={16} />
          </button>
        </div>
      )}

      {modalOpen && (
        <BillingEditorModal
          open
          providerData={providerData}
          billingToEdit={billing ? ({ ...billing, id: billing.id || "" } as ProviderBilling) : null}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}