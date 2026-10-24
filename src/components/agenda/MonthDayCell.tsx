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
  date, monthStr, appointments, billings = [], onClick,
}: Props) {
  const d = parseDateString(date);
  const inMonth = isInMonth(date, monthStr);
  const today = isToday(date);

  const active = appointments.filter(
    (a) => a.starts_on === date && a.status !== "cancelled"
  );

  const visibleAppointments = active.slice(0, 2);
  const hiddenCount = active.length - visibleAppointments.length + billings.length;

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
            today ? "bg-brand-600 text-white shadow-sm" : "text-gray-700 dark:text-slate-300"
          }`}
        >
          {d.getDate()}
        </span>

        {billings.length > 0 && (
          <div className="mt-1.5 flex h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" title="Vencimento hoje" />
        )}
      </div>

      <div className="flex flex-col gap-1 w-full max-w-full overflow-hidden">
        {visibleAppointments.map((a) => {
          const style = TYPE_STYLES[a.type];
          const name = a.patient?.full_name ?? a.provider?.display_name ?? (a.type === "blocked" ? "Bloqueio" : "Sessão");
          const displayName = a.title ? `${name.split(' ')[0]} · ${a.title}` : name;
          const hasCustomColor = !!a.color && a.type !== "blocked";
          const isCompleted = a.status === "completed";
          
          // Cor do status (pílula no mês)
          let statusBg = "bg-slate-400 dark:bg-slate-500";
          if (a.status === "completed") statusBg = "bg-green-500";
          else if (a.status === "no_show_justified") statusBg = "bg-amber-500";
          else if (a.status === "no_show_unjustified") statusBg = "bg-red-500";

          // Mesma lógica de cor do AppointmentBlock
          const customStyle = hasCustomColor ? {
            backgroundColor: `${a.color!}15`,
            borderColor: `${a.color!}50`,
          } : {};

          const defaultClasses = !hasCustomColor 
            ? `${style.bg} ${style.border} ${style.text}` 
            : "text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800";

          return (
            <div
              key={a.id}
              className={`group relative flex w-full max-w-full items-center gap-1.5 overflow-hidden rounded-md border px-1.5 py-1 text-[10px] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${defaultClasses} ${isCompleted ? "opacity-75" : ""}`}
              style={customStyle}
              title={`${name} - ${a.title || style.label} (${a.status})`}
            >
              {/* PÍLULA DE STATUS NO MÊS */}
              <div className={`absolute left-0.5 top-0.5 bottom-0.5 w-1 rounded-full ${statusBg} opacity-90`} />
              
              <div className="flex items-center gap-1.5 pl-1.5 w-full truncate">
                {a.start_time && (
                  <span className="shrink-0 font-semibold opacity-80">
                    {a.start_time.slice(0, 5)}
                  </span>
                )}
                <span className="truncate font-semibold">{displayName}</span>
              </div>
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