import { useMemo } from "react";
import { TimeColumn, HOUR_HEIGHT, START_HOUR, END_HOUR } from "./TimeColumn";
import { DayHeader } from "./DayHeader";
import { AppointmentBlock } from "./AppointmentBlock";
import { isToday, formatLongDate } from "../../lib/agenda-date";
import type { AppointmentWithRelations } from "../../types";

type Props = {
  date: string; // YYYY-MM-DD
  appointments: AppointmentWithRelations[];
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
  onSlotClick: (date: string, hour: number) => void;
};

export function DayView({
  date,
  appointments,
  onAppointmentClick,
  onSlotClick,
}: Props) {
  // Separa vencimentos dos appointments com horário
  const { withTime, due } = useMemo(() => {
    const withTime: AppointmentWithRelations[] = [];
    const due: AppointmentWithRelations[] = [];
    for (const a of appointments) {
      if (a.type === "due") due.push(a);
      else withTime.push(a);
    }
    return { withTime, due };
  }, [appointments]);

  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i
  );

  return (
    <div className="space-y-4">
      {/* Cabeçalho do dia */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <DayHeader date={date} large />
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-gray-900">
            {formatLongDate(date)}
          </p>
          <p className="text-xs text-gray-500">
            {withTime.length} {withTime.length === 1 ? "sessão" : "sessões"}
            {due.length > 0 && ` · ${due.length} vencimento(s)`}
          </p>
        </div>

        {/* Vencimentos do dia (não ocupam grade de horário) */}
        {due.length > 0 && (
          <div className="border-t border-amber-100 bg-amber-50 px-4 py-2">
            <p className="mb-1 text-xs font-medium text-amber-900">
              Vencimentos
            </p>
            <div className="space-y-1">
              {due.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onAppointmentClick(d)}
                  className="block w-full text-left text-xs text-amber-900 hover:underline"
                >
                  {d.provider?.display_name ?? "(sem nome)"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grade de horário */}
      <div
        className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${
          isToday(date) ? "ring-1 ring-brand-200" : ""
        }`}
      >
        <div className="flex">
          <TimeColumn headerHeight={0} />
          <div className="relative flex-1">
            {hours.map((h) => (
              <div
                key={h}
                onClick={() => onSlotClick(date, h)}
                className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50/60"
                style={{ height: HOUR_HEIGHT }}
              />
            ))}

            {withTime.map((appt) => (
              <AppointmentBlock
                key={appt.id}
                appointment={appt}
                onClick={onAppointmentClick}
                expanded
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}