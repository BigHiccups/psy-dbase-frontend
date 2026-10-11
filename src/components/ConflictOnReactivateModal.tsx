import { AlertTriangle, XCircle } from "lucide-react";
import { Button, Modal, Badge } from "./ui";
import { WEEKDAY_LONG, isoWeekday } from "../lib/agenda-date";
import type { ScheduleInput } from "../types";

type ConflictItem = {
  schedule: ScheduleInput;
  occupiedBy: string;
};

type SubjectType = "patient" | "provider";

type Props = {
  open: boolean;
  subjectType: SubjectType;
  conflicts: ConflictItem[];
  onClose: () => void;
  onEditSchedules: () => void;
  onReactivateValidOnes: () => void;
};

const LABELS: Record<SubjectType, string> = {
  patient: "Alguns horários deste paciente estão ocupados",
  provider: "Alguns horários deste prestador estão ocupados",
};

export function ConflictOnReactivateModal({
  open,
  subjectType,
  conflicts,
  onClose,
  onEditSchedules,
  onReactivateValidOnes,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Conflito de horários"
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              {LABELS[subjectType]}
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Outros agendamentos já usam esses slots. Escolha como proceder.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {conflicts.map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {WEEKDAY_LONG[isoWeekday(c.schedule.weekday)]} às{" "}
                  {c.schedule.startTime}
                </p>
                <p className="text-xs text-gray-500">
                  Ocupado por <strong>{c.occupiedBy}</strong>
                </p>
              </div>
              <Badge variant="warning">{c.schedule.durationMin} min</Badge>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Button onClick={onEditSchedules} className="w-full">
            Escolher novos horários
          </Button>
          <Button
            variant="secondary"
            onClick={onReactivateValidOnes}
            className="w-full"
          >
            Reativar apenas os horários livres
          </Button>
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-4">
          <Button variant="ghost" onClick={onClose}>
            <XCircle size={16} />
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}