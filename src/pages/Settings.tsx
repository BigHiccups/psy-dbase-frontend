import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  Check,
  AlertCircle,
  Link2,
  Link2Off,
  Download,
  User,
  Settings as SettingsIcon,
  Clock,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { Button, Card, ConfirmDialog, Spinner } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";

type CalendarStatus = {
  connected: boolean;
  scope: string | null;
  connectedAt: string | null;
};

type ImportSummary = {
  importedEvents: number;
  importedAppointments: number;
  importedPatients: number;
  skipped: number;
};

type Feedback =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

export function Settings() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Lê o parâmetro ?google= vindo do callback OAuth do backend
  useEffect(() => {
    const google = searchParams.get("google");
    if (!google) return;

    if (google === "connected") {
      setFeedback({
        type: "success",
        message: "Google Calendar conectado com sucesso.",
      });
    } else if (google === "denied") {
      setFeedback({
        type: "error",
        message: "Você cancelou a autorização do Google.",
      });
    } else if (google === "invalid") {
      setFeedback({
        type: "error",
        message: "Resposta inválida do Google.",
      });
    } else if (google === "error") {
      setFeedback({
        type: "error",
        message:
          "Não foi possível conectar. Verifique o terminal do backend para mais detalhes.",
      });
    }

    // Limpa o parâmetro da URL após exibir o feedback
    const next = new URLSearchParams(searchParams);
    next.delete("google");
    setSearchParams(next, { replace: true });

    // Recarrega o status para refletir a mudança
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStatus() {
    setLoadingStatus(true);
    try {
      const data = await apiFetch<CalendarStatus>("/calendar/status");
      setStatus(data);
    } catch {
      setStatus({ connected: false, scope: null, connectedAt: null });
    } finally {
      setLoadingStatus(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setFeedback(null);
    try {
      const { url } = await apiFetch<{ url: string }>("/calendar/connect");
      window.open(url, "_blank", "noopener,noreferrer");
      setFeedback({
        type: "success",
        message:
          "Autorização aberta em nova aba. Conclua o processo lá e volte para cá.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Erro ao iniciar conexão.",
      });
    } finally {
      setConnecting(false);
    }
  }

  async function handleImport() {
    setImporting(true);
    setFeedback(null);
    try {
      const summary = await apiFetch<ImportSummary>("/calendar/import", {
        method: "POST",
        body: JSON.stringify({ daysAhead: 90 }),
      });

      setFeedback({
        type: "success",
        message:
          `Importação concluída: ${summary.importedAppointments} agendamentos e ` +
          `${summary.importedPatients} pacientes criados. ` +
          `${summary.skipped} já existiam e foram ignorados.`,
      });
      loadStatus();
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Erro ao importar agenda.",
      });
    } finally {
      setImporting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await apiFetch("/calendar/disconnect", { method: "DELETE" });
      setConfirmDisconnect(false);
      setFeedback({
        type: "success",
        message: "Google Calendar desconectado.",
      });
      loadStatus();
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Erro ao desconectar.",
      });
    } finally {
      setDisconnecting(false);
    }
  }

  const connectedAtFormatted = status?.connectedAt
    ? new Date(status.connectedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Conecte serviços e ajuste preferências do consultório.
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-start gap-2 rounded-lg border p-3 ${
            feedback.type === "success"
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          {feedback.type === "success" ? (
            <Check size={16} className="mt-0.5 shrink-0 text-green-600" />
          ) : (
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
          )}
          <p
            className={`text-sm ${
              feedback.type === "success" ? "text-green-800" : "text-red-700"
            }`}
          >
            {feedback.message}
          </p>
        </div>
      )}

      {/* Google Calendar */}
      <Card className="p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Calendar size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-medium text-gray-900">
              Google Calendar
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Sincronize sua agenda e impeça conflitos de horário.
            </p>
          </div>
        </div>

        {loadingStatus ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Spinner size={16} />
            Verificando conexão...
          </div>
        ) : status?.connected ? (
          <div className="space-y-4">
            {/* Status conectado */}
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
              <Check size={16} className="text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  Conectado
                </p>
                {connectedAtFormatted && (
                  <p className="text-xs text-green-700">
                    Desde {connectedAtFormatted}
                  </p>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleImport}
                disabled={importing || disconnecting}
              >
                <Download size={16} />
                {importing ? "Importando..." : "Importar agenda"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmDisconnect(true)}
                disabled={disconnecting}
              >
                <Link2Off size={16} />
                Desconectar
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              A importação cria pacientes provisórios a partir dos eventos
              recorrentes dos próximos 90 dias. Eventos já importados são
              ignorados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <AlertCircle size={16} className="text-gray-500" />
              <p className="text-sm text-gray-700">Não conectado</p>
            </div>
            <Button onClick={handleConnect} disabled={connecting}>
              <Link2 size={16} />
              {connecting ? "Abrindo..." : "Conectar Google Calendar"}
            </Button>
            <p className="text-xs text-gray-500">
              Você será redirecionado para autorizar o acesso à sua agenda.
              Recomendamos usar uma conta dedicada ao consultório.
            </p>
          </div>
        )}
      </Card>

      {/* Perfil */}
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
            <User size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-medium text-gray-900">Perfil</h2>
            <p className="mt-0.5 text-xs text-gray-500">{user?.email}</p>
            <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
              <Clock size={12} />
              Edição disponível em breve
            </div>
          </div>
        </div>
      </Card>

      {/* Preferências do consultório */}
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
            <SettingsIcon size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-medium text-gray-900">
              Preferências do consultório
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Duração padrão da sessão, política de remarcação e multa por
              falta.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
              <Clock size={12} />
              Edição disponível em breve
            </div>
          </div>
        </div>
      </Card>

      {/* Modal de confirmação de desconexão */}
      <ConfirmDialog
        open={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        onConfirm={handleDisconnect}
        title="Desconectar Google Calendar?"
        description={
          <>
            Você deixará de sincronizar com o Google. Os agendamentos já
            importados <strong>permanecem</strong> no psy-dbase.
          </>
        }
        confirmLabel="Desconectar"
        tone="danger"
      />
    </div>
  );
}