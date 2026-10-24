import { isToday, isInMonth, parseDateString } from "../../lib/agenda-date";
import { TYPE_STYLES } from "../../lib/appointment-colors";
import type { AppointmentWithRelations } from "../../types";
import type { BillingWithProvider } from "../../hooks/useAllUpcomingBillings";

type Props = {
  date: string;
  monthStr: string;
  appointments: AppointmentWithRelations[];
  billings?: BillingWithProvider[];
  onClick: () => void;
};

export function MonthDayCell({
  date,
  monthStr,
  appointments,
  billings = [],
  onClick,
}: Props) {
  const d = parseDateString(date);
  const inMonth = isInMonth(date, monthStr);
  const today = isToday(date);

  // AQUI: Mostra todos, exceto os cancelados
  const active = appointments.filter(
    (a) => a.starts_on === date && a.status !== "cancelled"
  );

  const visibleAppointments = active.slice(0, 2);
  const hiddenCount = active.length - visibleAppointments.length + billings.length;

  // Função que define a cor da bolinha
  const getStatusDot = (status: string) => {
    if (status === "completed") return "bg-green-500";
    if (status === "no_show_justified") return "bg-amber-500";
    if (status === "no_show_unjustified") return "bg-red-500";
    return null;
  };

  return (
    <div
      onClick={onClick}
      className={`flex h-full min-h-[90px] sm:min-h-[120px] w-full cursor-pointer flex-col overflow-hidden p-1.5 transition-colors hover:bg-gray-50/80 dark:hover:bg-slate-800/40 ${
        !inMonth ? "bg-gray-50/30 opacity-50 dark:bg-slate-900/30" : ""
      }`}
    >
      <div className="mb-1.5 flex w-full items-start justify-between">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
            today
              ? "bg-brand-600 text-white shadow-sm"
              : "text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          {d.getDate()}
        </span>

        {billings.length > 0 && (
          <div className="mt-1.5 flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" title="Vencimento hoje" />
        )}
      </div>

      <div className="flex flex-col gap-1 w-full max-w-full overflow-hidden">
        {visibleAppointments.map((a) => {
          const style = TYPE_STYLES[a.type];
          const name = a.patient?.full_name ?? a.provider?.display_name ?? (a.type === "blocked" ? "Bloqueio" : "Sessão");
          const displayName = a.title ? `${name.split(' ')[0]} · ${a.title}` : name;
          const hasCustomColor = !!a.color && a.type !== "blocked";
          const dotColor = getStatusDot(a.status);
          const isCompleted = a.status === "completed";

          const customStyle = hasCustomColor
            ? {
                backgroundColor: `${a.color!}15`,
                color: a.color!,
                borderLeftColor: a.color!,
              }
            : {};

          return (
            <div
              key={a.id}
              className={`group relative flex w-full max-w-full items-center gap-1.5 overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-[10px] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                !hasCustomColor ? `${style.bg} ${style.border} ${style.text}` : "bg-white dark:bg-slate-800 border-transparent"
              } ${isCompleted ? "opacity-75" : ""}`}
              style={customStyle}
              title={`${name} - ${a.title || style.label} (${a.status})`}
            >
              {a.start_time && (
                <span className="shrink-0 font-semibold opacity-80">
                  {a.start_time.slice(0, 5)}
                </span>
              )}
              <span className="truncate font-medium">{displayName}</span>
              
              {/* Bolinha de status */}
              {dotColor && (
                <span className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${dotColor}`} />
              )}
            </div>
          );
        })}

        {hiddenCount > 0 && (
          <div className="w-full pl-1 text-[10px] font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200">
            + {hiddenCount} mais
          </div>
        )}
      </div>
    </div>
  );
}