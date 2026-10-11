import { RotateCcw, CalendarPlus, XCircle } from "lucide-react";
import { Button, Modal } from "./ui";

type SubjectType = "patient" | "provider";

type Props = {
  open: boolean;
  subjectType: SubjectType;
  subjectName: string;
  onClose: () => void;
  onDefineSchedules: () => void;
  onReactivateWithout: () => void;
};

const LABELS: Record<
  SubjectType,
  { title: string; noSchedules: string; defineBtn: string; withoutBtn: string }
> = {
  patient: {
    title: "Reativar paciente",
    noSchedules: "não tem horários recorrentes cadastrados",
    defineBtn: "Definir horários agora",
    withoutBtn: "Reativar sem agendamentos",
  },
  provider: {
    title: "Reativar prestador",
    noSchedules: "não tem horários recorrentes cadastrados",
    defineBtn: "Definir horários agora",
    withoutBtn: "Reativar sem agendamentos",
  },
};

export function ReactivateModal({
  open,
  subjectType,
  subjectName,
  onClose,
  onDefineSchedules,
  onReactivateWithout,
}: Props) {
  const labels = LABELS[subjectType];

  return (
    <Modal open={open} onClose={onClose} title={labels.title}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          <strong>{subjectName}</strong> {labels.noSchedules}. Como deseja
          prosseguir?
        </p>

        <div className="space-y-2">
          <OptionButton
            icon={<CalendarPlus size={18} />}
            title={labels.defineBtn}
            description="Abre o cadastro para você escolher os horários antes de reativar."
            onClick={onDefineSchedules}
          />
          <OptionButton
            icon={<RotateCcw size={18} />}
            title={labels.withoutBtn}
            description="Reativa o cadastro, mas sem criar agendamentos. Você pode definir horários depois."
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