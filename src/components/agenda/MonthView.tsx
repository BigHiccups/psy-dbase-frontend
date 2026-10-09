import { useMemo } from "react";
import { MonthDayCell } from "./MonthDayCell";
import {
  monthGridDates,
  WEEKDAY_SHORT,
//   isInMonth,
} from "../../lib/agenda-date";
import type { AppointmentWithRelations } from "../../types";

type Props = {
  monthStr: string; // YYYY-MM
  appointments: AppointmentWithRelations[];
  onDayClick: (date: string) => void;
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
};

export function MonthView({
  monthStr,
  appointments,
  onDayClick,
  onAppointmentClick,
}: Props) {
  const gridDates = useMemo(() => monthGridDates(monthStr), [monthStr]);

  // Agrupa appointments por data
  const byDate = useMemo(() => {
    const map: Record<string, AppointmentWithRelations[]> = {};
    for (const appt of appointments) {
      if (!map[appt.starts_on]) map[appt.starts_on] = [];
      map[appt.starts_on].push(appt);
    }
    return map;
  }, [appointments]);

  // Número de linhas (5 ou 6) baseado na quantidade de datas
  const rows = Math.ceil(gridDates.length / 7);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Cabeçalho de dias da semana */}
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

      {/* Grade de dias */}
      <div
        className="grid grid-cols-7"
        style={{ gridTemplateRows: `repeat(${rows}, minmax(100px, 1fr))` }}
      >
        {gridDates.map((date) => (
          <MonthDayCell
            key={date}
            date={date}
            monthStr={monthStr}
            appointments={byDate[date] ?? []}
            onDayClick={onDayClick}
            onAppointmentClick={onAppointmentClick}
          />
        ))}
      </div>
    </div>
  );
}