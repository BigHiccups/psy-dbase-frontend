import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { formatLongDate, WEEKDAY_LONG, isoWeekday } from "../../lib/agenda-date";
import { Button, Modal } from "../ui";
import { supabase } from "../../lib/supabase";
import type { AppointmentWithRelations } from "../../types";

type Props = {
  appointment: AppointmentWithRelations;
  newDate: string;
  newStartTime: string;
  onClose: () => void;
  onMoved: () => void;
};

export function MoveAppointmentModal({ appointment, newDate, newStartTime, onClose, onMoved }: Props) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newWeekday = new Date(newDate + "T12:00:00").getDay();

  async function handleMove() {
    setWorking(true);
    setError(null);

    const { error: updateErr } = await supabase
      .from("appointments")
      .update({
        starts_on: newDate,
        ends_on: newDate,
        start_time: newStartTime + ":00",
        weekday: newWeekday,
      })
      .eq("id", appointment.id);

    setWorking(false);

    if (updateErr) return setError(updateErr.message);

    onMoved();
    onClose();
  }

  return (
    <Modal open onClose={onClose} title="Mover agendamento" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-slate-300">
          Mover o agendamento de <strong>{appointment.patient?.full_name ?? appointment.provider?.display_name}</strong> para:
        </p>
        
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800/60">
          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
            {formatLongDate(newDate)} às {newStartTime}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {WEEKDAY_LONG[isoWeekday(newWeekday)]}
          </p>
        </div>

        {appointment.is_recurring && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>
              Este agendamento faz parte de uma série. Ao mover, <strong>apenas esta ocorrência</strong> será alterada. Para mudar a série inteira, edite o paciente/prestador.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleMove} disabled={working}>
            {working ? "Movendo..." : "Confirmar mudança"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}