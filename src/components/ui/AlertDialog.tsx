import { Info, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import type { ReactNode } from "react";

type Tone = "info" | "error" | "success";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  message?: ReactNode;
  tone?: Tone;
  buttonLabel?: string;
};

const TONES: Record<
  Tone,
  {
    icon: typeof Info;
    iconBg: string;
    iconColor: string;
  }
> = {
  info: {
    icon: Info,
    iconBg: "bg-brand-50 dark:bg-brand-950/50",
    iconColor: "text-brand-600 dark:text-brand-400",
  },
  error: {
    icon: AlertCircle,
    iconBg: "bg-red-50 dark:bg-red-950/50",
    iconColor: "text-red-600 dark:text-red-400",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-green-50 dark:bg-green-950/50",
    iconColor: "text-green-600 dark:text-green-400",
  },
};

export function AlertDialog({
  open,
  onClose,
  title,
  message,
  tone = "info",
  buttonLabel = "Entendi",
}: Props) {
  const config = TONES[tone];
  const Icon = config.icon;

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

        {message && (
          <div className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            {message}
          </div>
        )}

        <div className="mt-6 flex w-full">
          <Button onClick={onClose} className="flex-1">
            {buttonLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}