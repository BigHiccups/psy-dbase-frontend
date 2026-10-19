import { useState } from "react";
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
import type { AppointmentWithRelations } from "../../types";

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

  if (!appointment) return null;

  const style = TYPE_STYLES[appointment.type];
  const isCancelled = appointment.status === "cancelled";
  const isCompleted = appointment.status === "completed";
  const isBlocked = appointment.type === "blocked";

  // Nome do sujeito
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

  // Determina se é paciente ou provider (só se não for bloqueio)
  const subjectType: "patient" | "provider" = appointment.patient_id
    ? "patient"
    : "provider";

  const subjectId = appointment.patient_id ?? appointment.provider_id;

  // Só permite cancelar série se for recorrente E tiver sujeito vinculado
  const canCancelSeries =
    appointment.is_recurring && !!subjectId && !isBlocked;

  // Cálculo de fim do bloqueio
  const startMin = Number(appointment.start_time.split(":")[0]) * 60 + Number(appointment.start_time.split(":")[1]);
  const endMin = startMin + appointment.duration_min;
  const endH = Math.floor(endMin / 60) % 24;
  const endM = endMin % 60;
  const endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

  const blockEndDisplay = isBlocked
    ? `${formatTime(appointment.start_time)} às ${endTimeStr}`
    : `${formatTime(appointment.start_time)} · ${appointment.duration_min} minutos`;

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
      // 1. Acha todos os agendamentos cancelados que contenham o ID deste bloqueio nas observações
      // Usamos ilike para achar a string "[cancelled_by_block:ID]" no texto
      const blockId = appointment!.id;
      const { data: cancelledAppts, error: fetchErr } = await supabase
        .from("appointments")
        .select("id, notes")
        .eq("user_id", appointment!.user_id)
        .eq("status", "cancelled")
        .ilike("notes", `%[cancelled_by_block:${blockId}]%`);

      if (fetchErr) throw new Error(fetchErr.message);

      // 2. Se achou, limpa o texto e reativa
      if (cancelledAppts && cancelledAppts.length > 0) {
        for (const appt of cancelledAppts) {
          const cleanNotes = (appt.notes as string).replace(`[cancelled_by_block:${blockId}]`, "").trim();

          await supabase
            .from("appointments")
            .update({
              status: "active",
              notes: cleanNotes || null
            })
            .eq("id", appt.id);
        }
      }

      // 3. Deleta o bloqueio
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

  return (
    <>
      <Modal open onClose={onClose} title="Detalhes do agendamento" size="md">
        <div className="space-y-5">
          {/* Cabeçalho com tipo */}
          <div
            className={`flex items-start gap-3 rounded-xl border-l-4 p-4 ${style.bg} ${style.border}`}
          >
            {isBlocked ? (
              <PauseCircle size={18} className={style.text} />
            ) : (
              <CalendarClock size={18} className={style.text} />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className={`font-medium ${style.text}`}>
                  {isBlocked ? "Bloqueio" : style.label}
                </p>
                {isCancelled && <Badge variant="danger">Cancelado</Badge>}
                {isCompleted && <Badge variant="success">Concluído</Badge>}
                {!isCancelled && !isCompleted && (
                  <Badge variant="brand">Ativo</Badge>
                )}
              </div>
              {!isBlocked && (
                <p className={`mt-0.5 text-sm ${style.text}`}>{subjectName}</p>
              )}
              {isBlocked && appointment.notes && (
                <p className={`mt-0.5 text-sm ${style.text}`}>
                  {appointment.notes}
                </p>
              )}
            </div>
          </div>

          {/* Detalhes */}
          <div className="space-y-3">
            <InfoRow
              icon={<CalendarClock size={14} />}
              label="Data"
              value={formatLongDate(appointment.starts_on)}
            />
            <InfoRow
              icon={<Clock size={14} />}
              label={isBlocked ? "Período" : "Horário"}
              value={blockEndDisplay}
            />
            {!isBlocked && appointment.type !== "due" && (
              <InfoRow
                icon={<CalendarClock size={14} />}
                label="Recorrência"
                value={
                  appointment.is_recurring
                    ? `Toda ${WEEKDAY_LONG[isoWeekday(appointment.weekday)].toLowerCase()}`
                    : "Sessão avulsa"
                }
              />
            )}
          </div>

          {/* Link para paciente/provider (só se não for bloqueio) */}
          {!isBlocked && subjectLink && (
            <Link
              to={subjectLink}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
            >
              <User size={14} className="text-gray-400 dark:text-slate-500" />
              <span className="flex-1">
                Ver {subjectLabel.toLowerCase()}:{" "}
                <strong>{subjectName}</strong>
              </span>
              <ExternalLink
                size={14}
                className="text-gray-400 dark:text-slate-500"
              />
            </Link>
          )}

          {/* Notas (quando não é bloqueio, porque no bloqueio já aparece em cima) */}
          {!isBlocked && appointment.notes && (
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800/60">
              <p className="mb-1 text-xs font-medium text-gray-500 dark:text-slate-400">
                Observações
              </p>
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300">
                {appointment.notes}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
              <AlertCircle
                size={16}
                className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
              />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-5 dark:border-slate-800">
            <Button variant="secondary" onClick={onClose}>
              Fechar
            </Button>
            {!isCancelled && !isCompleted && (
              <>
                {canCancelSeries && (
                  <Button
                    variant="secondary"
                    onClick={() => setCancelSeriesOpen(true)}
                    disabled={working}
                  >
                    <XCircle size={16} />
                    Cancelar série
                  </Button>
                )}
                {isBlocked ? (
                  <Button
                    variant="danger"
                    onClick={() => setDeleteBlockOpen(true)}
                    disabled={working}
                  >
                    <Trash2 size={16} />
                    Remover bloqueio
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={() => setCancelThisOpen(true)}
                    disabled={working}
                  >
                    <XCircle size={16} />
                    Cancelar este
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Confirmar cancelar este (sessão/prestador) */}
      <ConfirmDialog
        open={cancelThisOpen}
        onClose={() => setCancelThisOpen(false)}
        onConfirm={handleCancelThis}
        title="Cancelar este agendamento?"
        description={
          <>
            O agendamento de <strong>{subjectName}</strong> em{" "}
            {formatLongDate(appointment.starts_on)} será marcado como
            cancelado.
          </>
        }
        confirmLabel="Cancelar agendamento"
        cancelLabel="Voltar"
        tone="danger"
      />

      {/* Confirmar remover bloqueio */}
      <ConfirmDialog
        open={deleteBlockOpen}
        onClose={() => setDeleteBlockOpen(false)}
        onConfirm={handleDeleteBlock}
        title="Remover bloqueio?"
        description={
          <>
            O bloqueio de {formatLongDate(appointment.starts_on)} será removido
            e o horário ficará disponível novamente.
            {(appointment.notes) && (
              <span className="mt-2 block text-xs">
                Observação: <em>{appointment.notes}</em>
              </span>
            )}
          </>
        }
        confirmLabel="Remover bloqueio"
        cancelLabel="Voltar"
        tone="danger"
      />

      {/* Cancelar série (3 modos) */}
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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-gray-400 dark:text-slate-500">{icon}</span>
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
          {label}
        </p>
        <p className="text-sm text-gray-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}