import { useState } from "react";
import { TimeColumn, HOUR_HEIGHT, START_HOUR, END_HOUR } from "./TimeColumn";
import { DayHeader } from "./DayHeader";
import { AppointmentBlock } from "./AppointmentBlock";
import { StackOverviewModal } from "./StackOverviewModal";
import { SlotCancelledModal } from "./SlotCancelledModal";
import { weekDates, isToday } from "../../lib/agenda-date";
import { computeLayout, countHiddenByStack } from "../../lib/appointment-layout";
import type { AppointmentWithRelations } from "../../types";

const HEADER_HEIGHT = 64;

type Props = {
  date: string;
  appointments: AppointmentWithRelations[];
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
  onSlotClick: (date: string, hour: number) => void;
  onReload: () => void;
};

export function WeekView({
  date,
  appointments,
  onAppointmentClick,
  onSlotClick,
  onReload,
}: Props) {
  const dates = weekDates(date);

  // Modais
  const [stackModal, setStackModal] = useState<{
    date: string;
    appointments: AppointmentWithRelations[];
  } | null>(null);

  const [cancelledModal, setCancelledModal] = useState<{
    date: string;
    startTime: string;
    appointments: AppointmentWithRelations[];
  } | null>(null);

  // Separa por data e status
  const activeByDate: Record<string, AppointmentWithRelations[]> = {};
  const dueByDate: Record<string, AppointmentWithRelations[]> = {};
  // Cancelados agrupados por "data + horário"
  const cancelledBySlot: Record<string, AppointmentWithRelations[]> = {};

  for (const d of dates) activeByDate[d] = [];

  for (const appt of appointments) {
    if (!dates.includes(appt.starts_on)) continue;

    if (appt.type === "due") {
      if (!dueByDate[appt.starts_on]) dueByDate[appt.starts_on] = [];
      dueByDate[appt.starts_on].push(appt);
      continue;
    }

    if (appt.status === "cancelled") {
      const startTime = appt.start_time.slice(0, 5);
      const key = `${appt.starts_on}|${startTime}`;
      if (!cancelledBySlot[key]) cancelledBySlot[key] = [];
      cancelledBySlot[key].push(appt);
    } else {
      activeByDate[appt.starts_on].push(appt);
    }
  }

  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i
  );

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Cabeçalho */}
            <div className="flex border-b border-gray-200">
              <div
                className="w-16 shrink-0 border-r border-gray-200 bg-gray-50/50"
                style={{ height: HEADER_HEIGHT }}
              />
              {dates.map((d) => (
                <div key={d} className="min-w-0 flex-1">
                  <DayHeader date={d} />
                  {dueByDate[d] && dueByDate[d].length > 0 && (
                    <div className="border-t border-amber-100 bg-amber-50 px-1 py-0.5 text-center text-[10px] text-amber-800">
                      {dueByDate[d].length} venc.
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Corpo */}
            <div className="flex">
              <TimeColumn headerHeight={0} />
              <div className="flex flex-1">
                {dates.map((d) => {
                  // Layout só dos ativos
                  const layouts = computeLayout(
                    activeByDate[d],
                    HOUR_HEIGHT,
                    START_HOUR
                  );
                  const hiddenByStack = countHiddenByStack(layouts);

                  return (
                    <div
                      key={d}
                      className={`relative min-w-0 flex-1 border-r border-gray-100 last:border-r-0 ${
                        isToday(d) ? "bg-brand-50/20" : ""
                      }`}
                    >
                      {/* Linhas de hora */}
                      {hours.map((h) => {
                        const startTime = `${String(h).padStart(2, "0")}:00`;
                        const key = `${d}|${startTime}`;
                        const cancelledHere = cancelledBySlot[key];

                        return (
                          <div
                            key={h}
                            onClick={() => onSlotClick(d, h)}
                            className="relative cursor-pointer border-b border-gray-100 transition hover:bg-gray-50/60"
                            style={{ height: HOUR_HEIGHT }}
                          >
                            {/* Badge de cancelados do slot */}
                            {cancelledHere && cancelledHere.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCancelledModal({
                                    date: d,
                                    startTime,
                                    appointments: cancelledHere,
                                  });
                                }}
                                className="absolute right-1 top-1 z-10 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
                                title={`${cancelledHere.length} cancelado(s) neste horário`}
                              >
                                {cancelledHere.length} ✕
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* Blocos ativos */}
                      {layouts
                        .filter((l) => !l.isHidden)
                        .map((l) => (
                          <AppointmentBlock
                            key={l.appointment.id}
                            appointment={l.appointment}
                            onClick={onAppointmentClick}
                            top={l.top}
                            height={l.height}
                            leftPercent={l.leftPercent}
                            widthPercent={l.widthPercent}
                            zIndex={l.zIndex}
                          />
                        ))}

                      {/* +N */}
                      {Object.entries(hiddenByStack).map(
                        ([stackIdStr, count]) => {
                          const stackId = Number(stackIdStr);
                          const hidden = layouts.filter(
                            (l) => l.stackId === stackId && l.isHidden
                          );
                          if (hidden.length === 0) return null;
                          const anchor = hidden[0];
                          return (
                            <button
                              key={`stack-${stackId}`}
                              onClick={() =>
                                setStackModal({
                                  date: d,
                                  appointments: hidden.map(
                                    (l) => l.appointment
                                  ),
                                })
                              }
                              className="absolute rounded-md border border-gray-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
                              style={{
                                top: anchor.top + 4,
                                right: 8,
                                zIndex: 100,
                              }}
                            >
                              +{count}
                            </button>
                          );
                        }
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {stackModal && (
        <StackOverviewModal
          open
          date={stackModal.date}
          appointments={stackModal.appointments}
          onClose={() => setStackModal(null)}
          onAppointmentClick={(a) => {
            setStackModal(null);
            onAppointmentClick(a);
          }}
        />
      )}

      {cancelledModal && (
        <SlotCancelledModal
          open
          date={cancelledModal.date}
          startTime={cancelledModal.startTime}
          appointments={cancelledModal.appointments}
          onClose={() => setCancelledModal(null)}
          onChanged={onReload}
        />
      )}
    </>
  );
}