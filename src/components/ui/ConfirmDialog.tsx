import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

type Tone = "default" | "danger" | "warning" | "success";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
};

const TONES: Record<
  Tone,
  {
    icon: typeof Info;
    iconBg: string;
    iconColor: string;
    confirmVariant: "primary" | "danger";
  }
> = {
  default: {
    icon: Info,
    iconBg: "bg-brand-50 dark:bg-brand-950/50",
    iconColor: "text-brand-600 dark:text-brand-400",
    confirmVariant: "primary",
  },
  danger: {
    icon: XCircle,
    iconBg: "bg-red-50 dark:bg-red-950/50",
    iconColor: "text-red-600 dark:text-red-400",
    confirmVariant: "danger",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50 dark:bg-amber-950/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    confirmVariant: "primary",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-green-50 dark:bg-green-950/50",
    iconColor: "text-green-600 dark:text-green-400",
    confirmVariant: "primary",
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
}: Props) {
  const [working, setWorking] = useState(false);
  const config = TONES[tone];
  const Icon = config.icon;

  useEffect(() => {
    if (!open) setWorking(false);
  }, [open]);

  async function handleConfirm() {
    setWorking(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setWorking(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${config.iconBg} ${config.iconColor}`}
        >
          <Icon size={24} />
        </div>

        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
          {title}
        </h2>

        {description && (
          <div className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            {description}
          </div>
        )}

        <div className="mt-6 flex w-full gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={working}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={handleConfirm}
            disabled={working}
            className="flex-1"
          >
            {working ? "Aguarde..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}