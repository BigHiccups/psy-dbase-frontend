import { UserCircle, Briefcase, Ban } from "lucide-react";

export type AppointmentOption = "session" | "personal" | "blocked";

type Props = {
  value: AppointmentOption;
  onChange: (value: AppointmentOption) => void;
};

export function TypeSelector({ value, onChange }: Props) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
        Tipo de agendamento
      </label>
      <div className="grid grid-cols-3 gap-2">
        <TypeButton
          selected={value === "session"}
          onClick={() => onChange("session")}
          icon={<UserCircle size={18} />}
          title="Sessão"
          subtitle="Com paciente"
        />
        <TypeButton
          selected={value === "personal"}
          onClick={() => onChange("personal")}
          icon={<Briefcase size={18} />}
          title="Prestador"
          subtitle="Supervisão, terapia"
        />
        <TypeButton
          selected={value === "blocked"}
          onClick={() => onChange("blocked")}
          icon={<Ban size={18} />}
          title="Bloqueio"
          subtitle="Férias, pausa"
        />
      </div>
    </div>
  );
}

function TypeButton({
  selected,
  onClick,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border p-3 text-left transition ${
        selected
          ? "border-brand-300 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-950/30"
          : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      }`}
    >
      <span
        className={
          selected
            ? "text-brand-600 dark:text-brand-400"
            : "text-gray-400 dark:text-slate-500"
        }
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
          {title}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-slate-400">
          {subtitle}
        </p>
      </div>
    </button>
  );
}