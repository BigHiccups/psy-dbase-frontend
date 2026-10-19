import { useState } from "react";
import { formatLongDate } from "../../lib/agenda-date";
import { AlertCircle } from "lucide-react";
import { Button, Modal } from "../ui";
import { supabase } from "../../lib/supabase";
import { HOUR_HEIGHT } from "./TimeColumn";
import type { AppointmentWithRelations } from "../../types";

type Props = {
  appointment: AppointmentWithRelations;
  deltaY: number;
  onClose: () => void;
  onResized: () => void;
};

export function ResizeAppointmentModal({ appointment, deltaY, onClose, onResized }: Props) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Conversão: Pixels para Minutos.
  // deltaY de 64px = 60 minutos.
  const minutesDelta = Math.round((deltaY / HOUR_HEIGHT) * 60);
  
  // Arredonda para múltiplos de 5 (ex: 12 min vira 10)
  const roundedDelta = Math.round(minutesDelta / 5) * 5;

  // Calcula a nova duração
  let newDuration = appointment.duration_min + roundedDelta;
  
  // Travas de segurança
  if (newDuration < 15) newDuration = 15;
  if (newDuration > 240) newDuration = 240;

  // Se a trava alterou o valor ou se ficou igual, não faz sentido
  const isInvalid = newDuration === appointment.duration_min || roundedDelta === 0;

  async function handleResize() {
    setWorking(true);
    setError(null);

    const { error: updateErr } = await supabase
      .from("appointments")
      .update({ duration_min: newDuration })
      .eq("id", appointment.id);

    setWorking(false);

    if (updateErr) return setError(updateErr.message);

    onResized();
    onClose();
  }

  const subjectName = appointment.patient?.full_name ?? appointment.provider?.display_name ?? "Agendamento";

  return (
    <Modal open onClose={onClose} title="Redimensionar agendamento" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-slate-300">
          Alterar a duração do agendamento de <strong>{subjectName}</strong> em {formatLongDate(appointment.starts_on)}.
        </p>
        
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-800/60">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Duração atual</p>
            <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{appointment.duration_min} min</p>
          </div>
          <div className="text-2xl text-gray-300 dark:text-slate-600">→</div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Nova duração</p>
            <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{newDuration} min</p>
          </div>
        </div>

        {isInvalid && (
          <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <AlertCircle size={16} />
            A alteração é muito pequena (menos de 5min) ou inválida.
          </p>
        )}

        {appointment.is_recurring && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            Este agendamento faz parte de uma série. Ao alterar, <strong>apenas esta ocorrência</strong> será modificada.
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleResize} disabled={working || isInvalid}>
            {working ? "Salvando..." : "Confirmar nova duração"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}