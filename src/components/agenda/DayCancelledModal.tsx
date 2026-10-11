import { X, RotateCcw, Trash2, Ban, AlertCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button, Modal, ConfirmDialog } from "../ui";
import { TYPE_STYLES } from "../../lib/appointment-colors";
import { formatTime, formatLongDate } from "../../lib/agenda-date";
import type { AppointmentWithRelations } from "../../types";

type Props = {
  open: boolean;
  date: string;
  appointments: AppointmentWithRelations[];
  onClose: () => void;
  onChanged: () => void;
};

export function DayCancelledModal({
  open,
  date,
  appointments,
  onClose,
  onChanged,
}: Props) {
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmDeleteOne, setConfirmDeleteOne] = useState<string | null>(null);

  const sorted = [...appointments].sort((a, b) =>
    a.start_time.localeCompare(b.start_time)
  );

  async function handleReactivate(id: string) {
    setWorkingId(id);
    setError(null);

    const { error } = await supabase.rpc("reactivate_appointment", {
      p_appointment_id: id,
    });

    setWorkingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    onChanged();
    onClose();
  }

  async function handleDeleteOne(id: string) {
    setWorkingId(id);
    setError(null);

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    setWorkingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    setConfirmDeleteOne(null);
    onChanged();
    onClose();
  }

  async function handleDeleteAll() {
    setError(null);

    const { error } = await supabase.rpc("delete_cancelled_appointments", {
      p_date: date,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setConfirmDeleteAll(false);
    onChanged();
    onClose();
  }

  return (
    <>
      <Modal open={open} onClose={onClose} size="md">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400">
              <Ban size={20} />
            </div>
            <div>
              <h2 className="select-none text-base font-semibold text-gray-900 dark:text-slate-100">
                Agendamentos cancelados
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {formatLongDate(date)} · {appointments.length}{" "}
                {appointments.length === 1 ? "cancelado" : "cancelados"}
              </p>
            </div>
          </div>

          {sorted.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-slate-400">
              Nenhum cancelado neste dia.
            </p>
          ) : (
            <div className="space-y-2">
              {sorted.map((appt) => {
                const style = TYPE_STYLES[appt.type];
                const name =
                  appt.patient?.full_name ??
                  appt.provider?.display_name ??
                  "(sem nome)";
                const busy = workingId === appt.id;

                return (
                  <div
                    key={appt.id}
                    className={`rounded-lg border-l-4 p-3 ${style.bg} ${style.border}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium line-through opacity-60 ${style.text}`}
                        >
                          {name}
                        </p>
                        <p className={`text-[10px] ${style.text} opacity-60`}>
                          {formatTime(appt.start_time)} · {appt.duration_min}
                          min · {style.label}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDeleteOne(appt.id)}
                        disabled={busy}
                        className="text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                      >
                        <Trash2 size={12} />
                        Remover
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleReactivate(appt.id)}
                        disabled={busy}
                      >
                        <RotateCcw size={12} />
                        {busy ? "Reativando..." : "Reativar"}
                      </Button>
                    </div>
                  </div>
                );
              })}
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

          <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-slate-800">
            {sorted.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDeleteAll(true)}
                className="text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/50 dark:hover:text-red-400"
              >
                <Trash2 size={14} />
                Remover todos
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              <X size={16} />
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteAll}
        onClose={() => setConfirmDeleteAll(false)}
        onConfirm={handleDeleteAll}
        title="Remover todos os cancelados do dia?"
        description={
          <>
            Todos os agendamentos cancelados de{" "}
            <strong>{formatLongDate(date)}</strong> serão{" "}
            <strong>removidos permanentemente</strong>. Esta ação não pode ser
            desfeita.
          </>
        }
        confirmLabel="Remover todos"
        tone="danger"
      />

      <ConfirmDialog
        open={!!confirmDeleteOne}
        onClose={() => setConfirmDeleteOne(null)}
        onConfirm={async () => {
          if (confirmDeleteOne) {
            await handleDeleteOne(confirmDeleteOne);
          }
        }}
        title="Remover este cancelado?"
        description={
          <>
            Este agendamento cancelado será{" "}
            <strong>removido permanentemente</strong>. Esta ação não pode ser
            desfeita.
          </>
        }
        confirmLabel="Remover"
        tone="danger"
      />
    </>
  );
}