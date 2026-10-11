import { RotateCcw, CalendarPlus, XCircle } from "lucide-react";
import { Button, Modal } from "./ui";

type Props = {
  open: boolean;
  patientName: string;
  onClose: () => void;
  onDefineSchedules: () => void; // navega para /patients/:id/edit
  onReactivateWithout: () => void; // só muda status
};

export function ReactivateModal({
  open,
  patientName,
  onClose,
  onDefineSchedules,
  onReactivateWithout,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Reativar paciente">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          <strong>{patientName}</strong> não tem horários recorrentes
          cadastrados. Como deseja prosseguir?
        </p>

        <div className="space-y-2">
          <OptionButton
            icon={<CalendarPlus size={18} />}
            title="Definir horários agora"
            description="Abre o cadastro para você escolher os horários antes de reativar."
            onClick={onDefineSchedules}
          />
          <OptionButton
            icon={<RotateCcw size={18} />}
            title="Reativar sem agendamentos"
            description="Reativa o paciente, mas sem criar agendamentos. Você pode definir horários depois."
            onClick={onReactivateWithout}
          />
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={onClose}>
            <XCircle size={16} />
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function OptionButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
    >
      <span className="mt-0.5 text-brand-600">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
    </button>
  );
}