import { useState } from "react";
import { TimeColumn, HOUR_HEIGHT, START_HOUR, END_HOUR } from "./TimeColumn";
import { DayHeader } from "./DayHeader";
import { AppointmentBlock } from "./AppointmentBlock";
import { StackOverviewModal } from "./StackOverviewModal";
import { SlotCancelledModal } from "./SlotCancelledModal";
import { isToday, formatLongDate } from "../../lib/agenda-date";
import { computeLayout, countHiddenByStack } from "../../lib/appointment-layout";
import type { AppointmentWithRelations } from "../../types";

type Props = {
  date: string;
  appointments: AppointmentWithRelations[];
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
  onSlotClick: (date: string, hour: number) => void;
  onReload: () => void;
};

export function DayView({
  date,
  appointments,
  onAppointmentClick,
  onSlotClick,
  onReload,
}: Props) {
  const [stackModal, setStackModal] = useState<
    AppointmentWithRelations[] | null
  >(null);

  const [cancelledModal, setCancelledModal] = useState<{
    startTime: string;
    appointments: AppointmentWithRelations[];
  } | null>(null);

  // Separa
  const active: AppointmentWithRelations[] = [];
  const due: AppointmentWithRelations[] = [];
  const cancelledBySlot: Record<string, AppointmentWithRelations[]> = {};

  for (const a of appointments) {
    if (a.type === "due") {
      due.push(a);
      continue;
    }
    if (a.status === "cancelled") {
      const startTime = a.start_time.slice(0, 5);
      if (!cancelledBySlot[startTime]) cancelledBySlot[startTime] = [];
      cancelledBySlot[startTime].push(a);
    } else {
      active.push(a);
    }
  }

  const layouts = computeLayout(active, HOUR_HEIGHT, START_HOUR);
  const hiddenByStack = countHiddenByStack(layouts);

  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i
  );

  return (
    <>
      <div className="space-y-4">
        {/* Cabeçalho */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <DayHeader date={date} large />
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-gray-900">
              {formatLongDate(date)}
            </p>
            <p className="text-xs text-gray-500">
              {active.length} {active.length === 1 ? "sessão" : "sessões"}
              {due.length > 0 && ` · ${due.length} vencimento(s)`}
            </p>
          </div>
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

        {/* Grade */}
        <div
          className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${
            isToday(date) ? "ring-1 ring-brand-200" : ""
          }`}
        >
          <div className="flex">
            <TimeColumn headerHeight={0} />
            <div className="relative flex-1">
              {hours.map((h) => {
                const startTime = `${String(h).padStart(2, "0")}:00`;
                const cancelledHere = cancelledBySlot[startTime];

                return (
                  <div
                    key={h}
                    onClick={() => onSlotClick(date, h)}
                    className="relative cursor-pointer border-b border-gray-100 transition hover:bg-gray-50/60"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    {cancelledHere && cancelledHere.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancelledModal({
                            startTime,
                            appointments: cancelledHere,
                          });
                        }}
                        className="absolute right-2 top-1 z-10 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
                        title={`${cancelledHere.length} cancelado(s) neste horário`}
                      >
                        {cancelledHere.length} ✕
                      </button>
                    )}
                  </div>
                );
              })}

              {layouts
                .filter((l) => !l.isHidden)
                .map((l) => (
                  <AppointmentBlock
                    key={l.appointment.id}
                    appointment={l.appointment}
                    onClick={onAppointmentClick}
                    expanded
                    top={l.top}
                    height={l.height}
                    leftPercent={l.leftPercent}
                    widthPercent={l.widthPercent}
                    zIndex={l.zIndex}
                  />
                ))}

              {Object.entries(hiddenByStack).map(([stackIdStr, count]) => {
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
                      setStackModal(hidden.map((l) => l.appointment))
                    }
                    className="absolute rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
                    style={{
                      top: anchor.top + 4,
                      right: 8,
                      zIndex: 100,
                    }}
                  >
                    +{count}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {stackModal && (
        <StackOverviewModal
          open
          date={date}
          appointments={stackModal}
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
          date={date}
          startTime={cancelledModal.startTime}
          appointments={cancelledModal.appointments}
          onClose={() => setCancelledModal(null)}
          onChanged={onReload}
        />
      )}
    </>
  );
}