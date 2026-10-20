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

  const active = appointments.filter(
    (a) => a.starts_on === date && a.status === "active"
  );

  const visibleAppointments = active.slice(0, 2);
  const hiddenCount = active.length - visibleAppointments.length + billings.length;

  return (
    <div
      onClick={onClick}
      // h-full, w-full, overflow-hidden. Isso impede que o conteúdo vaze da célula.
      className={`flex h-full min-h-[80px] sm:min-h-[110px] w-full cursor-pointer flex-col overflow-hidden p-1 transition hover:bg-gray-50 dark:hover:bg-slate-800/40 ${
        !inMonth ? "bg-gray-50/50 opacity-40 dark:bg-slate-900/50" : ""
      }`}
    >
      <div className="mb-1 flex w-full items-start justify-between">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${
            today
              ? "bg-brand-600 text-white"
              : "text-gray-700 dark:text-slate-300"
          }`}
        >
          {d.getDate()}
        </span>

        {billings.length > 0 && (
          <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
        )}
      </div>

      {/* Aqui a mágica acontece: max-w-full e overflow-hidden */}
      <div className="flex flex-col gap-0.5 w-full max-w-full overflow-hidden">
        {visibleAppointments.map((a) => {
          const style = TYPE_STYLES[a.type];
          const name =
            a.patient?.full_name ??
            a.provider?.display_name ??
            (a.type === "blocked" ? "Bloqueio" : "Sessão");

          return (
            <div
              key={a.id}
              // truncate vai colocar a elipse (…)
              className={`block w-full max-w-full truncate rounded px-1 py-0.5 text-[9px] font-medium leading-tight ${style.bg} ${style.text}`}
              title={name}
            >
              {name}
            </div>
          );
        })}

        {hiddenCount > 0 && (
          <div className="w-full truncate pl-1 text-[9px] font-medium text-gray-500 dark:text-slate-400">
            + {hiddenCount}
          </div>
        )}
      </div>
    </div>
  );
}