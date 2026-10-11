import { useMemo } from "react";
import { MonthDayCell } from "./MonthDayCell";
import { monthGridDates, WEEKDAY_SHORT } from "../../lib/agenda-date";
import type { AppointmentWithRelations } from "../../types";

type Props = {
  monthStr: string;
  appointments: AppointmentWithRelations[]; // todos (para separar internamente)
  onDayClick: (date: string) => void;
  onCancelledClick: (date: string) => void;
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
};

export function MonthView({
  monthStr,
  appointments,
  onDayClick,
  onCancelledClick,
  onAppointmentClick,
}: Props) {
  const gridDates = useMemo(() => monthGridDates(monthStr), [monthStr]);

  // Agrupa ativos e cancelados por data (ignora due, que tem seu próprio slot)
  const { activeByDate, cancelledCountByDate } = useMemo(() => {
    const active: Record<string, AppointmentWithRelations[]> = {};
    const cancelled: Record<string, number> = {};

    for (const appt of appointments) {
      if (appt.status === "cancelled") {
        cancelled[appt.starts_on] = (cancelled[appt.starts_on] ?? 0) + 1;
      } else {
        if (!active[appt.starts_on]) active[appt.starts_on] = [];
        active[appt.starts_on].push(appt);
      }
    }

    return { activeByDate: active, cancelledCountByDate: cancelled };
  }, [appointments]);

  const rows = Math.ceil(gridDates.length / 7);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Cabeçalho */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/60">
        {WEEKDAY_SHORT.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-xs font-medium uppercase text-gray-500"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grade */}
      <div
        className="grid grid-cols-7"
        style={{ gridTemplateRows: `repeat(${rows}, minmax(100px, 1fr))` }}
      >
        {gridDates.map((date) => (
          <MonthDayCell
            key={date}
            date={date}
            monthStr={monthStr}
            appointments={activeByDate[date] ?? []}
            cancelledCount={cancelledCountByDate[date] ?? 0}
            onDayClick={onDayClick}
            onCancelledClick={onCancelledClick}
            onAppointmentClick={onAppointmentClick}
          />
        ))}
      </div>
    </div>
  );
}