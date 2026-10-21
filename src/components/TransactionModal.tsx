import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Modal, Button, Input, Spinner } from "./ui";
import { supabase } from "../lib/supabase";
import {
  maskCurrencyBRL,
  parseCurrencyToCents,
  centsToCurrencyBRL,
} from "../lib/masks";
import { toDateString } from "../lib/agenda-date";
import type {
  PaymentMethod,
  Transaction,
  TransactionInput,
  TransactionType,
  PaymentFormat,
} from "../types";

const INCOME_CATEGORIES = [
  { value: "session", label: "Sessão" },
  { value: "package", label: "Pacote" },
  { value: "workshop", label: "Workshop" },
  { value: "gift", label: "Doação" },
  { value: "other", label: "Outro" },
];

const EXPENSE_CATEGORIES = [
  { value: "supervision", label: "Supervisão" },
  { value: "course", label: "Curso" },
  { value: "rent", label: "Aluguel" },
  { value: "tax", label: "Imposto" },
  { value: "billing", label: "Vencimento" },
  { value: "other", label: "Outro" },
];

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card: "Cartão",
  transfer: "Transferência",
  other: "Outro",
};

const FORMAT_LABELS = [
  { value: "avulso", label: "Avulso" },
  { value: "vencimento", label: "Vencimento" },
  { value: "antecipado", label: "Antecipado" },
];

type Props = {
  open: boolean;
  transactionToEdit?: Transaction | null;
  onClose: () => void;
  onSave: (input: TransactionInput) => Promise<void>;
};

export function TransactionModal({
  open,
  transactionToEdit,
  onClose,
  onSave,
}: Props) {
  const [type, setType] = useState<TransactionType>(
    transactionToEdit?.type ?? "income"
  );
  const [amount, setAmount] = useState(
    transactionToEdit ? centsToCurrencyBRL(transactionToEdit.amount_cents) : ""
  );
  const [description, setDescription] = useState(
    transactionToEdit?.description ?? ""
  );
  const [category, setCategory] = useState(
    transactionToEdit?.category ?? "session"
  );
  const [occurredOn, setOccurredOn] = useState(
    transactionToEdit?.occurred_on ?? toDateString(new Date())
  );
  const [paidOn, setPaidOn] = useState(transactionToEdit?.paid_on ?? "");

  const [paymentFormat, setPaymentFormat] = useState<PaymentFormat>(
    transactionToEdit?.payment_format ?? "avulso"
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">(
    transactionToEdit?.payment_method ?? ""
  );

  const [notes, setNotes] = useState(transactionToEdit?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Carrega opções de vínculo (pacientes / prestadores / vencimentos)
  const [patients, setPatients] = useState<{ id: string; full_name: string }[]>([]);
  const [providers, setProviders] = useState<
    { id: string; display_name: string }[]
  >([]);
  const [billings, setBillings] = useState<
    { id: string; description: string }[]
  >([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  const [linkTarget, setLinkTarget] = useState<"none" | "patient" | "provider" | "billing">(
    transactionToEdit?.patient_id
      ? "patient"
      : transactionToEdit?.provider_id
        ? "provider"
        : transactionToEdit?.billing_id
          ? "billing"
          : "none"
  );
  const [linkedId, setLinkedId] = useState<string>(
    transactionToEdit?.patient_id ??
    transactionToEdit?.provider_id ??
    transactionToEdit?.billing_id ??
    ""
  );

  useEffect(() => {
    if (!open) return;
    setLoadingLinks(true);
    (async () => {
      const [pRes, prRes, bRes] = await Promise.all([
        supabase
          .from("patients")
          .select("id, full_name")
          .eq("status", "active")
          .order("full_name"),
        supabase
          .from("providers")
          .select("id, display_name")
          .eq("status", "active")
          .order("display_name"),
        supabase
          .from("provider_billings")
          .select("id, description")
          .eq("status", "active")
          .order("description"),
      ]);
      if (pRes.data) setPatients(pRes.data);
      if (prRes.data) setProviders(prRes.data);
      if (bRes.data) setBillings(bRes.data);
      setLoadingLinks(false);
    })();
  }, [open]);

  // Ao trocar tipo, reseta categoria e vínculo
  function handleTypeChange(next: TransactionType) {
    setType(next);
    setCategory(next === "income" ? "session" : "supervision");
    setLinkTarget("none");
    setLinkedId("");
  }

  async function handleSave() {
    setError(null);

    const amountCents = parseCurrencyToCents(amount);
    if (!description.trim()) return setError("Informe a descrição.");
    if (amountCents === null || amountCents <= 0) return setError("Valor inválido.");
    if (!occurredOn) return setError("Data de ocorrência é obrigatória.");

    const payload: TransactionInput = {
      type,
      amount_cents: amountCents,
      description: description.trim(),
      category,
      occurred_on: occurredOn,
      paid_on: paidOn || null,
      payment_method: paidOn && paymentMethod ? paymentMethod : null,
      payment_format: paymentFormat,
      patient_id: linkTarget === "patient" ? linkedId || null : null,
      provider_id: linkTarget === "provider" ? linkedId || null : null,
      billing_id: linkTarget === "billing" ? linkedId || null : null,
      notes: notes.trim() || null,
    };

    setSaving(true);
    try {
      await onSave(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const categoryOptions = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={transactionToEdit ? "Editar lançamento" : "Novo lançamento"}
      size="md"
    >
      <div className="space-y-4">
        {/* Tipo */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange("income")}
            className={`rounded-xl border p-3 text-left transition ${type === "income"
              ? "border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-950/30"
              : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              }`}
          >
            <p className="text-sm font-medium">Entrada</p>
            <p className="text-xs text-gray-500">Recebi de paciente</p>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("expense")}
            className={`rounded-xl border p-3 text-left transition ${type === "expense"
              ? "border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-950/30"
              : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              }`}
          >
            <p className="text-sm font-medium">Saída</p>
            <p className="text-xs text-gray-500">Paguei a prestador</p>
          </button>
        </div>

        <Input
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={type === "income" ? "Ex: Sessão 15/10" : "Ex: Aluguel outubro"}
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data de ocorrência"
            type="date"
            value={occurredOn}
            onChange={(e) => setOccurredOn(e.target.value)}
          />
          <Input
            label="Pago em"
            type="date"
            value={paidOn}
            onChange={(e) => setPaidOn(e.target.value)}
            hint="Deixe em branco se ainda está pendente"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Forma de Pagamento
            </label>
            <select
              value={paymentFormat}
              onChange={(e) => setPaymentFormat(e.target.value as PaymentFormat)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {FORMAT_LABELS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {paidOn && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Meio de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod | "")
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">—</option>
                {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((pm) => (
                  <option key={pm} value={pm}>
                    {PAYMENT_LABELS[pm]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Vínculo opcional */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Vincular a <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          {loadingLinks ? (
            <div className="flex justify-center py-2">
              <Spinner size={16} />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { v: "none", label: "Nenhum" },
                    { v: "patient", label: "Paciente" },
                    { v: "provider", label: "Prestador" },
                    { v: "billing", label: "Vencimento" },
                  ] as const
                )
                  .filter((opt) => {
                    if (type === "income" && (opt.v === "provider" || opt.v === "billing"))
                      return false;
                    if (type === "expense" && opt.v === "patient") return false;
                    return true;
                  })
                  .map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => {
                        setLinkTarget(opt.v);
                        setLinkedId("");
                      }}
                      className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${linkTarget === opt.v
                        ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-950/40 dark:text-brand-200"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-slate-700 dark:text-slate-400"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
              </div>

              {linkTarget === "patient" && (
                <select
                  value={linkedId}
                  onChange={(e) => setLinkedId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">—</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ))}
                </select>
              )}
              {linkTarget === "provider" && (
                <select
                  value={linkedId}
                  onChange={(e) => setLinkedId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">—</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name}
                    </option>
                  ))}
                </select>
              )}
              {linkTarget === "billing" && (
                <select
                  value={linkedId}
                  onChange={(e) => setLinkedId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">—</option>
                  {billings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.description}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Notas
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
            />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-5 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}