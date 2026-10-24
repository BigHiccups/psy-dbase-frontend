import { useState } from "react";
import { TimeColumn, HOUR_HEIGHT, START_HOUR, END_HOUR } from "./TimeColumn";
import { DayHeader } from "./DayHeader";
import { AppointmentBlock } from "./AppointmentBlock";
import { StackOverviewModal } from "./StackOverviewModal";
import { SlotCancelledModal } from "./SlotCancelledModal";
import { DroppableSlot } from "./dnd/DroppableSlot";
import { weekDates, isToday } from "../../lib/agenda-date";
import { computeLayout, countHiddenByStack } from "../../lib/appointment-layout";
import { billingHappensOnDate } from "../../lib/billings-date";
import type { AppointmentWithRelations } from "../../types";
import type { BillingWithProvider } from "../../hooks/useAllUpcomingBillings";

const HEADER_HEIGHT = 64;

type Props = {
  date: string;
  appointments: AppointmentWithRelations[];
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
  onResize: (appointment: AppointmentWithRelations, deltaY: number) => void;
  onSlotClick: (date: string, hour: number) => void;
  onReload: () => void;
  onDrawStart?: (date: string, hour: number, clientY: number) => void;
  onDrawMove?: (clientY: number) => void;
  onDrawEnd?: (clientY: number) => void;
  previewBlock?: (date: string) => React.ReactNode;
  billings?: BillingWithProvider[];
  onBillingsClick?: (date: string, billings: BillingWithProvider[]) => void;
};

export function WeekView({
  date, appointments, onAppointmentClick, onResize, onSlotClick, onReload,
  onDrawStart, onDrawMove, onDrawEnd, previewBlock, billings = [], onBillingsClick,
}: Props) {
  const dates = weekDates(date);

  const [stackModal, setStackModal] = useState<{ date: string; appointments: AppointmentWithRelations[]; } | null>(null);
  const [cancelledModal, setCancelledModal] = useState<{ date: string; startTime: string; appointments: AppointmentWithRelations[]; } | null>(null);

  const activeByDate: Record<string, AppointmentWithRelations[]> = {};
  const dueByDate: Record<string, AppointmentWithRelations[]> = {};
  const cancelledBySlot: Record<string, AppointmentWithRelations[]> = {};
  const billingsByDate: Record<string, BillingWithProvider[]> = {};

  for (const d of dates) activeByDate[d] = [];

  for (const appt of appointments) {
    if (!dates.includes(appt.starts_on)) continue;

    if (appt.type === "due") {
      if (!dueByDate[appt.starts_on]) dueByDate[appt.starts_on] = [];
      dueByDate[appt.starts_on].push(appt);
      continue;
    }

    if (appt.status === "cancelled") {
      const startTime = (appt.start_time || "").slice(0, 5);
      const key = `${appt.starts_on}|${startTime}`;
      if (!cancelledBySlot[key]) cancelledBySlot[key] = [];
      cancelledBySlot[key].push(appt);
    } else {
      activeByDate[appt.starts_on].push(appt);
    }
  }

  for (const b of billings) {
    for (const d of dates) {
      if (billingHappensOnDate(b.starts_on, b.due_day, b.frequency, d)) {
        if (!billingsByDate[d]) billingsByDate[d] = [];
        billingsByDate[d].push(b);
      }
    }
  }

  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i
  );

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="flex border-b border-gray-200 dark:border-slate-800">
              <div className="w-16 shrink-0 border-r border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-900" style={{ height: HEADER_HEIGHT }} />
              {dates.map((d) => (
                <div key={d} className="min-w-0 flex-1 border-r border-gray-100 last:border-r-0 dark:border-slate-800">
                  <DayHeader date={d} billingsCount={billingsByDate[d]?.length} onBillingsClick={() => onBillingsClick?.(d, billingsByDate[d] || [])} />
                  {dueByDate[d] && dueByDate[d].length > 0 && (
                    <div className="border-t border-amber-100 bg-amber-50 px-1 py-0.5 text-center text-[10px] text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                      {dueByDate[d].length} venc.
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex pt-4">
              <TimeColumn headerHeight={0} />
              <div className="flex flex-1">
                {dates.map((d) => {
                  const layouts = computeLayout(activeByDate[d], HOUR_HEIGHT, START_HOUR);
                  const hiddenByStack = countHiddenByStack(layouts);

                  return (
                    <div
                      key={d}
                      className={`relative min-w-0 flex-1 border-r border-gray-100 last:border-r-0 dark:border-slate-800 ${isToday(d) ? "bg-brand-50/20 dark:bg-brand-950/10" : ""}`}
                    >
                      {hours.map((h) => {
                        const startTime = `${String(h).padStart(2, "0")}:00`;
                        const key = `${d}|${startTime}`;
                        const cancelledHere = cancelledBySlot[key];

                        return (
                          <DroppableSlot
                            key={h}
                            id={`${d}|${h}`}
                            onClick={() => onSlotClick(d, h)}
                            onDrawStart={onDrawStart}
                            onDrawMove={onDrawMove}
                            onDrawEnd={onDrawEnd}
                            style={{ height: HOUR_HEIGHT }}
                          >
                            {cancelledHere && cancelledHere.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCancelledModal({ date: d, startTime, appointments: cancelledHere });
                                }}
                                className="absolute right-1 top-1 z-10 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                title={`${cancelledHere.length} cancelado(s) neste horário`}
                              >
                                {cancelledHere.length} ✕
                              </button>
                            )}
                          </DroppableSlot>
                        );
                      })}

                      {layouts
                        .filter((l) => !l.isHidden)
                        .map((l) => (
                          <AppointmentBlock
                            key={l.appointment.id}
                            appointment={l.appointment}
                            onClick={onAppointmentClick}
                            onResize={onResize}
                            top={l.top}
                            height={l.height}
                            leftPercent={l.leftPercent}
                            widthPercent={l.widthPercent}
                            zIndex={l.zIndex}
                          />
                        ))}

                      {Object.entries(hiddenByStack).map(([stackIdStr, count]) => {
                        const stackId = Number(stackIdStr);
                        const hidden = layouts.filter((l) => l.stackId === stackId && l.isHidden);
                        if (hidden.length === 0) return null;
                        const anchor = hidden[0];
                        return (
                          <button
                            key={`stack-${stackId}`}
                            onClick={() => setStackModal({ date: d, appointments: hidden.map((l) => l.appointment) })}
                            className="absolute rounded-md border border-gray-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            style={{ top: anchor.top + 4, right: 8, zIndex: 100 }}
                          >
                            +{count}
                          </button>
                        );
                      })}

                      {previewBlock && previewBlock(d)}
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
          onAppointmentClick={(a) => { setStackModal(null); onAppointmentClick(a); }}
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