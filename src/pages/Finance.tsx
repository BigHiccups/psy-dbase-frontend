import { useMemo, useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Check,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  RotateCcw,
  Paperclip,
} from "lucide-react";
import {
  Button,
  Card,
  Badge,
  EmptyState,
  Spinner,
  AlertDialog,
  ConfirmDialog,
} from "../components/ui";
import { TransactionModal } from "../components/TransactionModal";
import { PendingSuggestionsCard } from "../components/PendingSuggestionsCard";
import { PaymentReceiptModal } from "../components/PaymentReceiptModal";
import { useTransactions } from "../hooks/useTransactions";
import { usePendingSuggestions } from "../hooks/usePendingSuggestions";
import { centsToCurrencyBRL } from "../lib/masks";
import type { Transaction, TransactionInput, TransactionType } from "../types";
import { ReceiptViewerModal } from "../components/ReceiptViewerModal";


const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];


const CATEGORY_LABELS: Record<string, string> = {
  session: "Sessão", package: "Pacote", workshop: "Workshop", gift: "Doação",
  supervision: "Supervisão", course: "Curso", rent: "Aluguel", tax: "Imposto",
  billing: "Vencimento", other: "Outro",
};

type AlertState = {
  title: string;
  message: string;
  tone: "info" | "error" | "success";
};

function suggestionToFakeTransaction(s: any): Transaction {
  const now = new Date().toISOString();
  if (s.kind === "session") {
    const [y, m, d] = s.suggested_date.split("-");
    return {
      id: "", user_id: "", type: "income", amount_cents: s.suggested_amount_cents ?? 0,
      description: `Sessão ${d}/${m}/${y}`, category: "session", occurred_on: s.suggested_date,
      paid_on: null, patient_id: s.appointment.patient_id, provider_id: null, billing_id: null,
      appointment_id: s.appointment.id, payment_method: null, 
      payment_format: "avulso", // <-- Adicionado aqui
      notes: null, receipt_url: null,
      created_at: now, updated_at: now
    };
  }
  if (s.kind === "personal") {
    const [y, m, d] = s.suggested_date.split("-");
    return {
      id: "", user_id: "", type: "expense", amount_cents: s.suggested_amount_cents ?? 0,
      description: `${s.appointment.provider?.display_name ?? "Prestador"} · ${d}/${m}/${y}`,
      category: "supervision", occurred_on: s.suggested_date, paid_on: null, patient_id: null,
      provider_id: s.appointment.provider_id, billing_id: null, appointment_id: s.appointment.id,
      payment_method: null, 
      payment_format: "avulso", // <-- Adicionado aqui
      notes: null, receipt_url: null, created_at: now, updated_at: now
    };
  }
  const [y, m] = s.suggested_date.split("-");
  return {
    id: "", user_id: "", type: "expense", amount_cents: s.suggested_amount_cents,
    description: `${s.billing.description} · ${m}/${y}`, category: "billing",
    occurred_on: s.suggested_date, paid_on: null, patient_id: null, provider_id: null,
    billing_id: s.billing.id, appointment_id: null, payment_method: null, 
    payment_format: "vencimento", // <-- Adicionado aqui (billing geralmente é vencimento)
    notes: null, receipt_url: null, created_at: now, updated_at: now
  };
}

export function Finance() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");

  const { transactions, loading, error, create, update, remove, markAsPaid, markAsPending } = useTransactions({ month, type: typeFilter, status: statusFilter });
  const suggestions = usePendingSuggestions(month);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [alertState, setAlertState] = useState<AlertState | null>(null);

  // Estados para o fluxo de pagamento com comprovante
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [payingTarget, setPayingTarget] = useState<Transaction | null>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPath, setViewerPath] = useState<string | null>(null);
  const [viewerTransaction, setViewerTransaction] = useState<Transaction | null>(null);

  const [year, m] = month.split("-").map(Number);
  const monthLabel = `${MONTHS[m - 1]} ${year}`;

  function shiftMonth(delta: number) {
    const d = new Date(year, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  // REGRA DE CAIXA: Só soma se estiver pago
  const totals = useMemo(() => {
    let paidIncome = 0, paidExpense = 0, pendingIncome = 0, pendingExpense = 0, pendingCount = 0;
    for (const t of transactions) {
      if (t.paid_on) {
        if (t.type === "income") paidIncome += t.amount_cents;
        else paidExpense += t.amount_cents;
      } else {
        pendingCount += 1;
        if (t.type === "income") pendingIncome += t.amount_cents;
        else pendingExpense += t.amount_cents;
      }
    }
    return {
      paidIncome,
      paidExpense,
      balance: paidIncome - paidExpense,
      pendingCount,
      pendingTotal: pendingIncome - pendingExpense,
    };
  }, [transactions]);

  async function handleSave(input: TransactionInput) {
    if (editing && editing.id) await update(editing.id, input);
    else await create(input);
    setEditing(null);
    setModalOpen(false);
    suggestions.reload();
  }

  // Abre o modal de anexo em vez de pagar direto
  function handleMarkPaid(t: Transaction) {
    setPayingTarget(t);
    setReceiptModalOpen(true);
  }

  // Chamado pelo PaymentReceiptModal após subir o arquivo (ou não)
  async function handleConfirmPayment(fileUrl: string | null) {
    if (!payingTarget) return;
    try {
      await markAsPaid(payingTarget.id, fileUrl);
      setReceiptModalOpen(false);
      setPayingTarget(null);
    } catch (err) {
      setAlertState({
        title: "Erro ao marcar como pago",
        message: err instanceof Error ? err.message : "Erro desconhecido.",
        tone: "error",
      });
    }
  }

  async function handleUndoPaid(t: Transaction) {
    try {
      await markAsPending(t.id);
    } catch (err) {
      setAlertState({
        title: "Erro ao desfazer pagamento",
        message: err instanceof Error ? err.message : "Erro desconhecido.",
        tone: "error",
      });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setAlertState({ title: "Erro ao excluir", message: err instanceof Error ? err.message : "Erro desconhecido.", tone: "error" });
    }
  }

  function handleEditSuggestion(s: any) {
    setEditing(suggestionToFakeTransaction(s));
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Financeiro</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Entradas, saídas e pagamentos pendentes.</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus size={16} /> Novo lançamento
        </Button>
      </div>

      <PendingSuggestionsCard
        suggestions={suggestions.suggestions}
        loading={suggestions.loading}
        onApprove={suggestions.approveSingle}
        onApproveAll={suggestions.approveAll}
        onEdit={handleEditSuggestion}
        onDismiss={suggestions.dismiss}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Entradas (Pagas)"
          value={centsToCurrencyBRL(totals.paidIncome)}
          icon={<TrendingUp size={16} />}
          tone="green"
        />
        <SummaryCard
          label="Saídas (Pagas)"
          value={centsToCurrencyBRL(totals.paidExpense)}
          icon={<TrendingDown size={16} />}
          tone="red"
        />
        <SummaryCard
          label="Saldo do mês"
          value={centsToCurrencyBRL(totals.balance)}
          icon={<Wallet size={16} />}
          tone={totals.balance >= 0 ? "green" : "red"}
        />
        <SummaryCard
          label="Pendentes"
          value={totals.pendingCount.toString()}
          hint={totals.pendingCount > 0 ? `Saldo: R$ ${centsToCurrencyBRL(totals.pendingTotal)}` : undefined}
          icon={<Clock size={16} />}
          tone="amber"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <button onClick={() => shiftMonth(-1)} className="rounded-l-lg px-2 py-1.5 text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800"><ChevronLeft size={16} /></button>
          <span className="min-w-[140px] px-3 text-center text-sm font-medium capitalize text-gray-900 dark:text-slate-100">{monthLabel}</span>
          <button onClick={() => shiftMonth(1)} className="rounded-r-lg px-2 py-1.5 text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800"><ChevronRight size={16} /></button>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {[{ v: "all", label: "Todas" }, { v: "income", label: "Entradas" }, { v: "expense", label: "Saídas" }].map((f) => (
            <button key={f.v} onClick={() => setTypeFilter(f.v as any)} className={`rounded-md px-3 py-1 text-sm font-medium transition ${typeFilter === f.v ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200" : "text-gray-600 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800"}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {[{ v: "all", label: "Todos" }, { v: "paid", label: "Pagos" }, { v: "pending", label: "Pendentes" }].map((f) => (
            <button key={f.v} onClick={() => setStatusFilter(f.v as any)} className={`rounded-md px-3 py-1 text-sm font-medium transition ${statusFilter === f.v ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200" : "text-gray-600 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">Erro: {error}</p>}

      {loading && <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400"><Spinner size={16} /> Carregando lançamentos...</div>}

      {!loading && !error && transactions.length === 0 && (
        <EmptyState icon={<Wallet size={20} />} title="Nenhum lançamento neste mês" description="Registre entradas de sessões, saídas do consultório ou pagamentos de vencimentos." />
      )}

      {!loading && transactions.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <ul className="divide-y divide-gray-100 dark:divide-slate-800">
            {transactions.map((t) => {
              const isIncome = t.type === "income";
              const paid = !!t.paid_on;
              const isSession = t.patient_id !== null;
              const isBilling = t.billing_id !== null;

              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isIncome ? "bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"}`}>
                    {isIncome ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900 dark:text-slate-100">{t.display_name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                      <span>{formatBR(t.occurred_on)}{t.time_str ? ` às ${t.time_str}` : ""}</span>
                      <span>·</span>
                      <Badge variant="neutral">{isSession ? "Sessão" : isBilling ? "Vencimento" : (CATEGORY_LABELS[t.category] ?? t.category)}</Badge>
                      {paid ? <Badge variant="success">Pago {t.paid_on ? formatBR(t.paid_on) : ""}</Badge> : <Badge variant="warning">Pendente</Badge>}
                    </div>
                  </div>

                  <span className={`shrink-0 font-medium ${isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {isIncome ? "+" : "−"} R$ {centsToCurrencyBRL(t.amount_cents)}
                  </span>

                  <div className="flex shrink-0 items-center gap-1">
                    {/* Ícone de Anexo */}
                    {t.receipt_url ? (
                      <button
                        onClick={() => {
                          setViewerTransaction(t);
                          setViewerPath(t.receipt_url);
                          setViewerOpen(true);
                        }}
                        title="Ver comprovante"
                        className="rounded p-1.5 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/50"
                      >
                        <Paperclip size={14} />
                      </button>
                    ) : (
                      <div className="p-1.5 text-gray-300 dark:text-slate-600" title="Sem comprovante">
                        <Paperclip size={14} />
                      </div>
                    )}

                    {!paid ? (
                      <button onClick={() => handleMarkPaid(t)} title="Marcar como pago" className="rounded p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/50 dark:hover:text-green-400">
                        <Check size={14} />
                      </button>
                    ) : (
                      <button onClick={() => handleUndoPaid(t)} title="Desfazer pagamento" className="rounded p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/50 dark:hover:text-amber-400">
                        <RotateCcw size={14} />
                      </button>
                    )}
                    <button onClick={() => { setEditing(t); setModalOpen(true); }} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(t)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Modais */}
      {modalOpen && (
        <TransactionModal open transactionToEdit={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} />
      )}

      <ReceiptViewerModal
        open={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewerPath(null);
          setViewerTransaction(null); // <--- Adicione isso
        }}
        filePath={viewerPath}
        title={`Comprovante - ${viewerTransaction?.description || ""}`} // <--- Mude aqui
      />

      <PaymentReceiptModal
        open={receiptModalOpen}
        transaction={payingTarget}
        onClose={() => {
          setReceiptModalOpen(false);
          setPayingTarget(null);
        }}
        onConfirm={handleConfirmPayment}
      />

      <ConfirmDialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Excluir lançamento?" description={deleteTarget ? `"${deleteTarget.description}" (R$ ${centsToCurrencyBRL(deleteTarget.amount_cents)}) será removido permanentemente.` : ""} confirmLabel="Excluir" tone="danger" />

      <AlertDialog open={alertState !== null} onClose={() => setAlertState(null)} title={alertState?.title ?? ""} message={alertState?.message} tone={alertState?.tone ?? "info"} />
    </div>
  );
}

function SummaryCard({ label, value, hint, icon, tone }: { label: string; value: string; hint?: string; icon: React.ReactNode; tone: "green" | "red" | "amber" }) {
  const toneClasses: Record<typeof tone, string> = {
    green: "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  };
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</p>
        <p className="text-base font-semibold text-gray-900 dark:text-slate-100">{value}</p>
        {hint && <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{hint}</p>}
      </div>
    </Card>
  );
}

function formatBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}