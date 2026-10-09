import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  Clock,
  User,
  AlertCircle,
  XCircle,
  ExternalLink,
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
  const [cancelSeriesOpen, setCancelSeriesOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!appointment) return null;

  const style = TYPE_STYLES[appointment.type];
  const isCancelled = appointment.status === "cancelled";
  const isCompleted = appointment.status === "completed";

  const subjectName =
    appointment.patient?.full_name ??
    appointment.provider?.display_name ??
    "(sem nome)";

  const subjectLink = appointment.patient
    ? `/patients/${appointment.patient.id}`
    : appointment.provider
      ? `/providers/${appointment.provider.id}`
      : null;

  const subjectLabel = appointment.patient ? "Paciente" : "Prestador";

  // Só permite cancelar série se for recorrente E tiver paciente
  const canCancelSeries =
    appointment.is_recurring && !!appointment.patient_id;

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

  return (
    <>
      <Modal open onClose={onClose} title="Detalhes do agendamento" size="md">
        <div className="space-y-5">
          {/* Cabeçalho com tipo */}
          <div
            className={`flex items-start gap-3 rounded-xl border-l-4 p-4 ${style.bg} ${style.border}`}
          >
            <CalendarClock size={18} className={style.text} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className={`font-medium ${style.text}`}>{style.label}</p>
                {isCancelled && <Badge variant="danger">Cancelado</Badge>}
                {isCompleted && <Badge variant="success">Concluído</Badge>}
                {!isCancelled && !isCompleted && (
                  <Badge variant="brand">Ativo</Badge>
                )}
              </div>
              <p className={`mt-0.5 text-sm ${style.text}`}>{subjectName}</p>
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
              label="Horário"
              value={`${formatTime(appointment.start_time)} · ${appointment.duration_min} minutos`}
            />
            {appointment.type !== "due" && (
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

          {/* Link para paciente/provider */}
          {subjectLink && (
            <Link
              to={subjectLink}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
            >
              <User size={14} className="text-gray-400" />
              <span className="flex-1">
                Ver {subjectLabel.toLowerCase()}: <strong>{subjectName}</strong>
              </span>
              <ExternalLink size={14} className="text-gray-400" />
            </Link>
          )}

          {/* Notas */}
          {appointment.notes && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="mb-1 text-xs font-medium text-gray-500">
                Observações
              </p>
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {appointment.notes}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle
                size={16}
                className="mt-0.5 shrink-0 text-red-600"
              />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-5">
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
                <Button
                  variant="danger"
                  onClick={() => setCancelThisOpen(true)}
                  disabled={working}
                >
                  <XCircle size={16} />
                  Cancelar este
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Confirmar cancelar este */}
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

      {/* Cancelar série (3 modos) */}
      {cancelSeriesOpen && appointment.patient_id && (
        <CancelSeriesModal
          open
          patientId={appointment.patient_id}
          patientName={subjectName}
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
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  );
}