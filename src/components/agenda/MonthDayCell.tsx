import { isToday, isInMonth } from "../../lib/agenda-date";
import { TYPE_STYLES } from "../../lib/appointment-colors";
import { formatTime } from "../../lib/agenda-date";
import type { AppointmentWithRelations } from "../../types";

const MAX_VISIBLE = 2;

type Props = {
  date: string; // YYYY-MM-DD
  monthStr: string; // YYYY-MM
  appointments: AppointmentWithRelations[];
  onDayClick: (date: string) => void;
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
};

export function MonthDayCell({
  date,
  monthStr,
  appointments,
  onDayClick,
  onAppointmentClick,
}: Props) {
  const dayNumber = Number(date.slice(8, 10));
  const inMonth = isInMonth(date, monthStr);
  const today = isToday(date);

  // Ignora `due` no bloco compacto (só mostra sessões/personal/blocked)
  const visible = appointments.filter((a) => a.type !== "due");
  const shown = visible.slice(0, MAX_VISIBLE);
  const remaining = visible.length - shown.length;

  return (
    <div
      onClick={() => onDayClick(date)}
      className={`
        group relative flex min-h-[100px] cursor-pointer flex-col border-b border-r
        border-gray-100 p-1.5 transition hover:bg-gray-50
        ${inMonth ? "bg-white" : "bg-gray-50/60"}
      `}
    >
      {/* Número do dia */}
      <div className="mb-1 flex items-center justify-between">
        <span
          className={`
            flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
            ${
              today
                ? "bg-brand-600 text-white"
                : inMonth
                  ? "text-gray-900"
                  : "text-gray-400"
            }
          `}
        >
          {dayNumber}
        </span>
      </div>

      {/* Blocos compactos */}
      <div className="flex-1 space-y-0.5">
        {shown.map((appt) => {
          const style = TYPE_STYLES[appt.type];
          const name =
            appt.patient?.full_name ??
            appt.provider?.display_name ??
            "(sem nome)";
          return (
            <button
              key={appt.id}
              onClick={(e) => {
                e.stopPropagation();
                onAppointmentClick(appt);
              }}
              className={`
                block w-full truncate rounded border-l-2 px-1 py-0.5 text-left text-[10px]
                font-medium transition hover:brightness-95
                ${style.bg} ${style.border} ${style.text}
              `}
              title={`${formatTime(appt.start_time)} · ${name}`}
            >
              {formatTime(appt.start_time)} {name}
            </button>
          );
        })}

        {remaining > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDayClick(date);
            }}
            className="block w-full text-left text-[10px] text-gray-500 hover:text-gray-900 hover:underline"
          >
            +{remaining} mais
          </button>
        )}
      </div>
    </div>
  );
}