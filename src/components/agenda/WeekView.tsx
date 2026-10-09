import { useMemo } from "react";
import { TimeColumn, HOUR_HEIGHT, START_HOUR, END_HOUR } from "./TimeColumn";
import { DayHeader } from "./DayHeader";
import { AppointmentBlock } from "./AppointmentBlock";
import { weekDates, isToday } from "../../lib/agenda-date";
import type { AppointmentWithRelations } from "../../types";

const HEADER_HEIGHT = 64; // altura do DayHeader em px

type Props = {
  date: string; // data âncora (qualquer dia da semana)
  appointments: AppointmentWithRelations[];
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
  onSlotClick: (date: string, hour: number) => void;
};

export function WeekView({
  date,
  appointments,
  onAppointmentClick,
  onSlotClick,
}: Props) {
  const dates = useMemo(() => weekDates(date), [date]);

  // Agrupa appointments por data
  const byDate = useMemo(() => {
    const map: Record<string, AppointmentWithRelations[]> = {};
    for (const d of dates) map[d] = [];
    for (const appt of appointments) {
      if (map[appt.starts_on]) map[appt.starts_on].push(appt);
    }
    return map;
  }, [dates, appointments]);

  // Vencimentos (due) não ocupam horário; ficam no cabeçalho do dia
  const dueByDate = useMemo(() => {
    const map: Record<string, AppointmentWithRelations[]> = {};
    for (const appt of appointments) {
      if (appt.type !== "due") continue;
      if (!map[appt.starts_on]) map[appt.starts_on] = [];
      map[appt.starts_on].push(appt);
    }
    return map;
  }, [appointments]);

  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Container com scroll horizontal (mobile) */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Cabeçalho: coluna vazia + 7 dias */}
          <div className="flex border-b border-gray-200">
            <div
              className="w-16 shrink-0 border-r border-gray-200 bg-gray-50/50"
              style={{ height: HEADER_HEIGHT }}
            />
            {dates.map((d) => (
              <div key={d} className="min-w-0 flex-1">
                <DayHeader date={d} />
                {/* Vencimentos do dia (badge compacta abaixo do dia) */}
                {dueByDate[d] && dueByDate[d].length > 0 && (
                  <div className="border-t border-amber-100 bg-amber-50 px-1 py-0.5 text-center text-[10px] text-amber-800">
                    {dueByDate[d].length} venc.
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Corpo: coluna de horários + 7 colunas de dias */}
          <div className="flex">
            <TimeColumn headerHeight={0} />

            <div className="flex flex-1">
              {dates.map((d) => (
                <div
                  key={d}
                  className={`relative min-w-0 flex-1 border-r border-gray-100 last:border-r-0 ${
                    isToday(d) ? "bg-brand-50/20" : ""
                  }`}
                >
                  {/* Linhas de hora */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      onClick={() => onSlotClick(d, h)}
                      className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50/60"
                      style={{ height: HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Blocos de appointment */}
                  {byDate[d]?.map((appt) => (
                    <AppointmentBlock
                      key={appt.id}
                      appointment={appt}
                      onClick={onAppointmentClick}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}