import { useState } from "react";
import {
  CalendarClock,
  Receipt,
  AlertTriangle,
  CheckCheck,
  Pencil,
  X,
  User,
} from "lucide-react";
import {
  Button,
  Card,
  Badge,
  Spinner,
  AlertDialog,
  ConfirmDialog,
} from "./ui";
import { centsToCurrencyBRL } from "../lib/masks";
import type { Suggestion } from "../hooks/usePendingSuggestions";

type AlertState = {
  title: string;
  message: string;
  tone: "info" | "error" | "success";
};

type Props = {
  suggestions: Suggestion[];
  loading: boolean;
  onApprove: (s: Suggestion) => Promise<void>;
  onApproveAll: () => Promise<number>;
  onEdit: (s: Suggestion) => void;
  onDismiss: (s: Suggestion) => Promise<void>;
};

function formatBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function getSuggestionMeta(s: Suggestion): {
  title: string;
  subtitle: string;
  isIncome: boolean;
  icon: React.ReactNode;
} {
  if (s.kind === "session") {
    return {
      title: `Sessão · ${s.appointment.patient?.full_name ?? "(sem nome)"}`,
      subtitle: formatBR(s.suggested_date),
      isIncome: true,
      icon: <CalendarClock size={14} />,
    };
  }
  if (s.kind === "personal") {
    return {
      title: `Compromisso · ${s.appointment.provider?.display_name ?? "(sem nome)"}`,
      subtitle: formatBR(s.suggested_date),
      isIncome: false,
      icon: <User size={14} />,
    };
  }
  return {
    title: s.billing.description,
    subtitle: `${s.billing.provider_name} · vence dia ${s.billing.due_day}`,
    isIncome: false,
    icon: <Receipt size={14} />,
  };
}

export function PendingSuggestionsCard({
  suggestions,
  loading,
  onApprove,
  onApproveAll,
  onEdit,
  onDismiss,
}: Props) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmApproveAll, setConfirmApproveAll] = useState(false);
  const [dismissTarget, setDismissTarget] = useState<Suggestion | null>(null);
  const [alertState, setAlertState] = useState<AlertState | null>(null);

  if (loading) {
    return (
      <Card className="flex items-center gap-2 p-6 text-sm text-gray-500 dark:text-slate-400">
        <Spinner size={16} /> Carregando sugestões...
      </Card>
    );
  }

  if (suggestions.length === 0) return null;

  const sessionCount = suggestions.filter((s) => s.kind === "session").length;
  const personalCount = suggestions.filter((s) => s.kind === "personal").length;
  const billCount = suggestions.filter((s) => s.kind === "billing").length;

  async function handleApprove(s: Suggestion) {
    if (
      (s.kind === "session" || s.kind === "personal") &&
      (s.suggested_amount_cents === null || s.suggested_amount_cents <= 0)
    ) {
      onEdit(s);
      return;
    }
    setProcessing(s.id);
    try {
      await onApprove(s);
    } catch (err) {
      setAlertState({
        title: "Erro ao aprovar",
        message: err instanceof Error ? err.message : "Erro desconhecido.",
        tone: "error",
      });
    } finally {
      setProcessing(null);
    }
  }

  async function handleApproveAll() {
    setProcessing("__all__");
    try {
      const n = await onApproveAll();
      setConfirmApproveAll(false);
      setAlertState({
        title: "Aprovadas",
        message: `${n} lançamento${n === 1 ? "" : "s"} criado${
          n === 1 ? "" : "s"
        }.`,
        tone: "success",
      });
    } catch (err) {
      setAlertState({
        title: "Erro ao aprovar",
        message: err instanceof Error ? err.message : "Erro desconhecido.",
        tone: "error",
      });
    } finally {
      setProcessing(null);
    }
  }

  async function handleDismiss() {
    if (!dismissTarget) return;
    setProcessing(dismissTarget.id);
    try {
      await onDismiss(dismissTarget);
      setDismissTarget(null);
    } catch (err) {
      setAlertState({
        title: "Erro ao descartar",
        message: err instanceof Error ? err.message : "Erro desconhecido.",
        tone: "error",
      });
    } finally {
      setProcessing(null);
    }
  }

  // Resumo textual dos tipos
  const parts: string[] = [];
  if (sessionCount > 0)
    parts.push(`${sessionCount} sessão${sessionCount === 1 ? "" : "ões"}`);
  if (personalCount > 0)
    parts.push(`${personalCount} compromisso${personalCount === 1 ? "" : "s"}`);
  if (billCount > 0)
    parts.push(`${billCount} vencimento${billCount === 1 ? "" : "s"}`);

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle
              size={16}
              className="text-amber-600 dark:text-amber-400"
            />
            <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
              Aguardando aprovação
            </h2>
            <Badge variant="warning">{suggestions.length}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {parts.join(" · ")}
            </p>
            {suggestions.length > 1 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setConfirmApproveAll(true)}
                disabled={processing !== null}
              >
                <CheckCheck size={14} />
                Aprovar todas
              </Button>
            )}
          </div>
        </div>

        <ul className="divide-y divide-gray-100 dark:divide-slate-800">
          {suggestions.map((s) => {
            const meta = getSuggestionMeta(s);
            const amount =
              s.kind === "billing"
                ? s.suggested_amount_cents
                : s.suggested_amount_cents;
            const hasAmount = amount !== null && amount > 0;
            const isProcessing = processing === s.id;

            return (
              <li
                key={`${s.kind}-${s.id}`}
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    meta.isIncome
                      ? "bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400"
                      : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                  }`}
                >
                  {meta.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 dark:text-slate-100">
                    {meta.title}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-slate-400">
                    {meta.subtitle}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {hasAmount ? (
                    <p
                      className={`font-medium ${
                        meta.isIncome
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {meta.isIncome ? "+" : "−"} R${" "}
                      {centsToCurrencyBRL(amount)}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Sem valor definido
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleApprove(s)}
                    disabled={isProcessing || processing === "__all__"}
                  >
                    {hasAmount ? "Aprovar" : "Definir valor"}
                  </Button>
                  <button
                    onClick={() => onEdit(s)}
                    disabled={isProcessing || processing === "__all__"}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-slate-800"
                    title="Editar e aprovar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDismissTarget(s)}
                    disabled={isProcessing || processing === "__all__"}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950/50"
                    title="Descartar sugestão"
                  >
                    <X size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <ConfirmDialog
        open={confirmApproveAll}
        onClose={() => setConfirmApproveAll(false)}
        onConfirm={handleApproveAll}
        title="Aprovar todas as sugestões?"
        description={`${suggestions.length} lançamento${
          suggestions.length === 1 ? "" : "s"
        } serão criados como pendentes. Você poderá editar ou excluir depois.`}
        confirmLabel="Aprovar todas"
        tone="warning"
      />

      <ConfirmDialog
        open={dismissTarget !== null}
        onClose={() => setDismissTarget(null)}
        onConfirm={handleDismiss}
        title="Descartar sugestão?"
        description={
          dismissTarget?.kind === "billing"
            ? "Esse vencimento não vai aparecer como sugestão este mês. No próximo mês, ele aparecerá novamente se ainda estiver pendente."
            : "Esse compromisso não vai mais aparecer como sugestão. Você pode lançar manualmente depois se quiser."
        }
        confirmLabel="Descartar"
        tone="warning"
      />

      <AlertDialog
        open={alertState !== null}
        onClose={() => setAlertState(null)}
        title={alertState?.title ?? ""}
        message={alertState?.message}
        tone={alertState?.tone ?? "info"}
      />
    </>
  );
}