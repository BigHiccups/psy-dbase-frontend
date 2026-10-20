import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  Clock,
  User,
  AlertCircle,
  XCircle,
  ExternalLink,
  Trash2,
  PauseCircle,
  Wallet,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button, Modal, Badge, ConfirmDialog } from "../ui";
import { TYPE_STYLES } from "../../lib/appointment-colors";
import {
  formatTime,
  formatLongDate,
  WEEKDAY_LONG,
  isoWeekday,
} from "../../lib/agenda-date";
import { CancelSeriesModal } from "./CancelSeriesModal";
import type { AppointmentWithRelations, AppointmentStatus } from "../../types";

type Props = {
  appointment: AppointmentWithRelations | null;
  onClose: () => void;
  onChanged: () => void;
};

export function AppointmentDetailModal({
  appointment,
  onClose,
  onChanged,
}: Props) {
  const [cancelThisOpen, setCancelThisOpen] = useState(false);
  const [deleteBlockOpen, setDeleteBlockOpen] = useState(false);
  const [cancelSeriesOpen, setCancelSeriesOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [paymentStatus, setPaymentStatus] = useState<"unknown" | "none" | "paid">("unknown");
  const [creatingIncome, setCreatingIncome] = useState(false);

  useEffect(() => {
    if (!appointment) {
      setPaymentStatus("unknown");
      return;
    }
    if (appointment.type !== "session" || appointment.status === "cancelled" || appointment.status === "active") {
      setPaymentStatus("unknown");
      return;
    }
    
    (async () => {
      const { data } = await supabase
        .from("transactions")
        .select("id")
        .or(`appointment_id.eq.${appointment.id},and(patient_id.eq.${appointment.patient_id},occurred_on.eq.${appointment.starts_on})`)
        .eq("type", "income")
        .limit(1);
      setPaymentStatus(data && data.length > 0 ? "paid" : "none");
    })();
  }, [
    appointment?.id,
    appointment?.status,
    appointment?.patient_id,
    appointment?.starts_on,
    appointment?.type,
  ]);

  if (!appointment) return null;

  const style = TYPE_STYLES[appointment.type];
  const isCancelled = appointment.status === "cancelled";
  const isCompleted = appointment.status === "completed";
  const isNoShowJust = appointment.status === "no_show_justified";
  const isNoShowUnjust = appointment.status === "no_show_unjustified";
  const isBlocked = appointment.type === "blocked";

  const subjectName =
    appointment.patient?.full_name ??
    appointment.provider?.display_name ??
    (isBlocked ? "Bloqueio" : "(sem nome)");

  const subjectLink = appointment.patient
    ? `/patients/${appointment.patient.id}`
    : appointment.provider
      ? `/providers/${appointment.provider.id}`
      : null;

  const subjectLabel = appointment.patient ? "Paciente" : "Prestador";
  const subjectType: "patient" | "provider" = appointment.patient_id ? "patient" : "provider";
  const subjectId = appointment.patient_id ?? appointment.provider_id;
  const canCancelSeries = appointment.is_recurring && !!subjectId && !isBlocked;

  const startMin = Number(appointment.start_time.split(":")[0]) * 60 + Number(appointment.start_time.split(":")[1]);
  const endMin = startMin + appointment.duration_min;
  const endH = Math.floor(endMin / 60) % 24;
  const endM = endMin % 60;
  const endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

  const blockEndDisplay = isBlocked
    ? `${formatTime(appointment.start_time)} às ${endTimeStr}`
    : `${formatTime(appointment.start_time)} · ${appointment.duration_min} minutos`;

  async function handleUpdateStatus(newStatus: AppointmentStatus) {
    setWorking(true);
    setError(null);

    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointment!.id);

    setWorking(false);
    if (error) {
      setError(error.message);
      return;
    }
    onChanged();
    onClose();
  }

  async function handleCancelThis() {
    setWorking(true);
    setError(null);
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointment!.id);

    setWorking(false);
    if (error) {
      setError(error.message);
      return;
    }
    setCancelThisOpen(false);
    onChanged();
    onClose();
  }

  async function handleDeleteBlock() {
    setWorking(true);
    setError(null);
    try {
      const blockId = appointment!.id;
      const { data: cancelledAppts, error: fetchErr } = await supabase
        .from("appointments")
        .select("id, notes")
        .eq("user_id", appointment!.user_id)
        .eq("status", "cancelled")
        .ilike("notes", `%[cancelled_by_block:${blockId}]%`);

      if (fetchErr) throw new Error(fetchErr.message);

      if (cancelledAppts && cancelledAppts.length > 0) {
        for (const appt of cancelledAppts) {
          const cleanNotes = (appt.notes as string).replace(`[cancelled_by_block:${blockId}]`, "").trim();
          await supabase
            .from("appointments")
            .update({ status: "active", notes: cleanNotes || null })
            .eq("id", appt.id);
        }
      }

      const { error: deleteErr } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointment!.id);

      if (deleteErr) throw new Error(`Erro ao remover bloqueio: ${deleteErr.message}`);

      setDeleteBlockOpen(false);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setWorking(false);
    }
  }

  async function handleCreateIncome() {
    if (!appointment) return;
    setCreatingIncome(true);
    setError(null);

    const { error } = await supabase.rpc("create_income_from_appointment", {
      p_appointment_id: appointment.id,
      p_amount_cents: null,
      p_paid_on: null,
      p_payment_method: null,
    });

    setCreatingIncome(false);
    if (error) {
      setError(error.message);
      return;
    }

    setPaymentStatus("paid");
    onChanged();
  }

  return (
    <>
      <Modal open onClose={onClose} title="Detalhes do agendamento" size="md">
        <div className="space-y-5">
          <div className={`flex items-start gap-3 rounded-xl border-l-4 p-4 ${style.bg} ${style.border}`}>
            {isBlocked ? (
              <PauseCircle size={18} className={style.text} />
            ) : (
              <CalendarClock size={18} className={style.text} />
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={`font-medium ${style.text}`}>
                  {isBlocked ? "Bloqueio" : style.label}
                </p>
                {isCancelled && <Badge variant="danger">Cancelado</Badge>}
                {isCompleted && <Badge variant="success">Realizada</Badge>}
                {isNoShowJust && <Badge variant="warning">Falta Justificada</Badge>}
                {isNoShowUnjust && <Badge variant="danger">Falta Injustificada</Badge>}
                {!isCancelled && !isCompleted && !isNoShowJust && !isNoShowUnjust && (
                  <Badge variant="brand">Ativo</Badge>
                )}
                {(isCompleted || isNoShowJust || isNoShowUnjust) && paymentStatus === "paid" && (
                  <Badge variant="success">Pago</Badge>
                )}
              </div>
              {!isBlocked && (
                <p className={`mt-0.5 text-sm ${style.text}`}>{subjectName}</p>
              )}
              {isBlocked && appointment.notes && (
                <p className={`mt-0.5 text-sm ${style.text}`}>{appointment.notes}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <InfoRow icon={<CalendarClock size={14} />} label="Data" value={formatLongDate(appointment.starts_on)} />
            <InfoRow icon={<Clock size={14} />} label={isBlocked ? "Período" : "Horário"} value={blockEndDisplay} />
            {!isBlocked && appointment.type !== "due" && (
              <InfoRow
                icon={<CalendarClock size={14} />}
                label="Recorrência"
                value={appointment.is_recurring ? `Toda ${WEEKDAY_LONG[isoWeekday(appointment.weekday)].toLowerCase()}` : "Sessão avulsa"}
              />
            )}
          </div>

          {!isBlocked && subjectLink && (
            <Link
              to={subjectLink}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
            >
              <User size={14} className="text-gray-400 dark:text-slate-500" />
              <span className="flex-1">
                Ver {subjectLabel.toLowerCase()}: <strong>{subjectName}</strong>
              </span>
              <ExternalLink size={14} className="text-gray-400 dark:text-slate-500" />
            </Link>
          )}

          {!isBlocked && appointment.notes && (
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800/60">
              <p className="mb-1 text-xs font-medium text-gray-500 dark:text-slate-400">Observações</p>
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300">{appointment.notes}</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 dark:border-slate-800">
            
            {/* Botões de Status */}
            {!isBlocked && !isCancelled && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleUpdateStatus("completed")}
                  disabled={working || isCompleted}
                >
                  <CheckCircle2 size={16} className={isCompleted ? "" : "text-green-600"} />
                  {isCompleted ? "Realizada" : "Marcar Realizada"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleUpdateStatus("no_show_justified")}
                  disabled={working || isNoShowJust}
                >
                  <HelpCircle size={16} className={isNoShowJust ? "" : "text-amber-600"} />
                  {isNoShowJust ? "Justificada" : "Falta Justificada"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleUpdateStatus("no_show_unjustified")}
                  disabled={working || isNoShowUnjust}
                >
                  <AlertTriangle size={16} className={isNoShowUnjust ? "" : "text-red-600"} />
                  {isNoShowUnjust ? "Injustificada" : "Falta Injustificada"}
                </Button>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>
                Fechar
              </Button>

              {/* Botão de Gerar Receita */}
              {paymentStatus === "none" && (
                <Button
                  variant="primary"
                  onClick={handleCreateIncome}
                  disabled={working || creatingIncome}
                  className="bg-brand-600 hover:bg-brand-700 text-white"
                >
                  <Wallet size={16} />
                  {creatingIncome ? "Registrando..." : "Gerar Receita"}
                </Button>
              )}

              {/* Cancelamento e Bloqueio */}
              {!isCancelled && !isCompleted && !isNoShowJust && !isNoShowUnjust && (
                <>
                  {canCancelSeries && (
                    <Button variant="secondary" onClick={() => setCancelSeriesOpen(true)} disabled={working}>
                      <XCircle size={16} />
                      Cancelar série
                    </Button>
                  )}
                  {isBlocked ? (
                    <Button variant="danger" onClick={() => setDeleteBlockOpen(true)} disabled={working}>
                      <Trash2 size={16} />
                      Remover bloqueio
                    </Button>
                  ) : (
                    <Button variant="danger" onClick={() => setCancelThisOpen(true)} disabled={working}>
                      <XCircle size={16} />
                      Cancelar esta
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={cancelThisOpen}
        onClose={() => setCancelThisOpen(false)}
        onConfirm={handleCancelThis}
        title="Cancelar este agendamento?"
        description={<>O agendamento de <strong>{subjectName}</strong> em {formatLongDate(appointment.starts_on)} será marcado como cancelado.</>}
        confirmLabel="Cancelar agendamento"
        cancelLabel="Voltar"
        tone="danger"
      />

      <ConfirmDialog
        open={deleteBlockOpen}
        onClose={() => setDeleteBlockOpen(false)}
        onConfirm={handleDeleteBlock}
        title="Remover bloqueio?"
        description={<>O bloqueio de {formatLongDate(appointment.starts_on)} será removido e o horário ficará disponível novamente.</>}
        confirmLabel="Remover bloqueio"
        cancelLabel="Voltar"
        tone="danger"
      />

      {cancelSeriesOpen && subjectId && (
        <CancelSeriesModal
          open
          subjectId={subjectId}
          subjectType={subjectType}
          subjectName={subjectName}
          onClose={() => setCancelSeriesOpen(false)}
          onDone={() => {
            onChanged();
            onClose();
          }}
        />
      )}
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-gray-400 dark:text-slate-500">{icon}</span>
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</p>
        <p className="text-sm text-gray-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}