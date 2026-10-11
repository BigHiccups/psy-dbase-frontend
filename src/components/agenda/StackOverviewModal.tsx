import { X, Layers } from "lucide-react";
import { Button, Modal } from "../ui";
import { TYPE_STYLES } from "../../lib/appointment-colors";
import { formatTime, formatLongDate } from "../../lib/agenda-date";
import type { AppointmentWithRelations } from "../../types";

type Props = {
  open: boolean;
  date: string; // YYYY-MM-DD
  appointments: AppointmentWithRelations[];
  onClose: () => void;
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
};

export function StackOverviewModal({
  open,
  date,
  appointments,
  onClose,
  onAppointmentClick,
}: Props) {
  const sorted = [...appointments].sort((a, b) =>
    a.start_time.localeCompare(b.start_time)
  );

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Agendamentos no mesmo horário
              </h2>
              <p className="text-xs text-gray-500">
                {formatLongDate(date)} ·{" "}
                {appointments.length}{" "}
                {appointments.length === 1 ? "agendamento" : "agendamentos"}
              </p>
            </div>
          </div>
        </div>

        {/* Lista */}
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            Nenhum agendamento.
          </p>
        ) : (
          <div className="space-y-2">
            {sorted.map((appt) => {
              const style = TYPE_STYLES[appt.type];
              const name =
                appt.patient?.full_name ??
                appt.provider?.display_name ??
                "(sem nome)";
              const isCancelled = appt.status === "cancelled";
              return (
                <button
                  key={appt.id}
                  onClick={() => {
                    onClose();
                    onAppointmentClick(appt);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg border-l-4 p-3 text-left transition hover:brightness-95 ${style.bg} ${style.border}`}
                >
                  <div className="w-16 shrink-0">
                    <p className={`text-sm font-semibold ${style.text}`}>
                      {formatTime(appt.start_time)}
                    </p>
                    <p className={`text-[10px] ${style.text} opacity-70`}>
                      {appt.duration_min}min
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${style.text} ${
                        isCancelled ? "line-through opacity-50" : ""
                      }`}
                    >
                      {name}
                    </p>
                    <p className={`text-[10px] ${style.text} opacity-70`}>
                      {style.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex justify-end border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={onClose}>
            <X size={16} />
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}