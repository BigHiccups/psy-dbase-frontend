import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  useAgendaView,
  getViewRange,
  type AgendaView,
} from "../hooks/useAgendaView";
import { HOUR_HEIGHT } from "../components/agenda/TimeColumn";
import { useAppointments } from "../hooks/useAppointments";
import { useAllUpcomingBillings, type BillingWithProvider } from "../hooks/useAllUpcomingBillings";
import { AgendaToolbar } from "../components/agenda/AgendaToolbar";
import { WeekView } from "../components/agenda/WeekView";
import { DayView } from "../components/agenda/DayView";
import { MonthView } from "../components/agenda/MonthView";
import { DayOverviewModal } from "../components/agenda/DayOverviewModal";
import { AppointmentDetailModal } from "../components/agenda/AppointmentDetailModal";
import { CreateAppointmentModal } from "../components/agenda/CreateAppointmentModal";
import { DayCancelledModal } from "../components/agenda/DayCancelledModal";
import { MoveAppointmentModal } from "../components/agenda/MoveAppointmentModal";
import { ResizeAppointmentModal } from "../components/agenda/ResizeAppointmentModal";
import { DayBillingsModal } from "../components/agenda/DayBillingsModal";
import { Spinner } from "../components/ui";
import {
  formatLongDate,
  formatMonth,
  toMonthString,
} from "../lib/agenda-date";
import type { AppointmentWithRelations } from "../types";

export function Agenda() {
  const navigate = useNavigate();
  const params = useParams<{ view?: string; date?: string }>();

  const agenda = useAgendaView();
  const { billings } = useAllUpcomingBillings();

  useEffect(() => {
    const viewFromUrl = params.view as AgendaView | undefined;
    if (viewFromUrl && ["day", "week", "month"].includes(viewFromUrl)) {
      if (viewFromUrl !== agenda.view) agenda.setView(viewFromUrl);
    }

    const dateFromUrl = params.date;
    if (dateFromUrl && dateFromUrl !== agenda.date) {
      const normalized =
        viewFromUrl === "month" && dateFromUrl.length === 7
          ? `${dateFromUrl}-01`
          : dateFromUrl;
      agenda.setDate(normalized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.view, params.date]);

  useEffect(() => {
    const { view, date } = agenda;
    const expectedDate = view === "month" ? toMonthString(date) : date;
    const expectedPath = `/agenda/${view}/${expectedDate}`;
    if (window.location.pathname !== expectedPath) {
      navigate(expectedPath, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agenda.view, agenda.date]);

  const range = getViewRange(agenda.view, agenda.date);
  const { appointments, loading, error, reload } = useAppointments(
    range.from,
    range.to
  );

  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithRelations | null>(null);

  const [dayOverviewDate, setDayOverviewDate] = useState<string | null>(null);

  const [createSlot, setCreateSlot] = useState<{
    date: string;
    hour: number;
    duration?: number;
  } | null>(null);

  const [monthCancelledModal, setMonthCancelledModal] = useState<{
    date: string;
    appointments: AppointmentWithRelations[];
  } | null>(null);

  const [billingsModal, setBillingsModal] = useState<{
    date: string;
    billings: BillingWithProvider[];
  } | null>(null);

  // =========================================================
  // Estado do Drag and Drop
  // =========================================================
  const [moveTarget, setMoveTarget] = useState<{
    appointment: AppointmentWithRelations;
    newDate: string;
    newStartTime: string;
  } | null>(null);

  const [resizeTarget, setResizeTarget] = useState<{
    appointment: AppointmentWithRelations;
    deltaY: number;
  } | null>(null);

  const [drawingSlot, setDrawingSlot] = useState<{
    date: string;
    startHour: number;
    startY: number;
    currentY: number;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const appointment = active.data.current
      ?.appointment as AppointmentWithRelations;
    if (!appointment) return;

    const [newDate, hourStr] = (over.id as string).split("|");
    const hour = parseInt(hourStr, 10);

    const originalMinutes = appointment.start_time.split(":")[1].slice(0, 2);
    const newStartTime = `${String(hour).padStart(2, "0")}:${originalMinutes}`;

    if (
      newDate === appointment.starts_on &&
      newStartTime === appointment.start_time.slice(0, 5)
    ) {
      return;
    }

    setMoveTarget({ appointment, newDate, newStartTime });
  }

  function handleResize(appointment: AppointmentWithRelations, deltaY: number) {
    setResizeTarget({ appointment, deltaY });
  }

  // =========================================================
  // Handlers do Criar por Arrastar
  // =========================================================
  function handleDrawStart(date: string, hour: number, clientY: number) {
    setDrawingSlot({ date, startHour: hour, startY: clientY, currentY: clientY });
  }

  function handleDrawMove(clientY: number) {
    if (!drawingSlot) return;
    setDrawingSlot((prev) => (prev ? { ...prev, currentY: clientY } : null));
  }

  function handleDrawEnd(clientY: number) {
    if (!drawingSlot) return;

    const deltaY = clientY - drawingSlot.startY;
    const pixelsPerMin = HOUR_HEIGHT / 60;

    if (Math.abs(deltaY) < 15) {
      setCreateSlot({ date: drawingSlot.date, hour: drawingSlot.startHour, duration: 50 });
      setDrawingSlot(null);
      return;
    }

    let durationMins = Math.round(Math.abs(deltaY) / pixelsPerMin / 5) * 5;
    if (durationMins < 15) durationMins = 15;
    if (durationMins > 240) durationMins = 240;

    let finalHour = drawingSlot.startHour;
    if (deltaY < 0) {
      const deltaHours = Math.floor(durationMins / 60);
      if (deltaY < -(clientY - drawingSlot.startY) % HOUR_HEIGHT) {
        finalHour = Math.max(0, drawingSlot.startHour - deltaHours);
      }
    }

    setCreateSlot({
      date: drawingSlot.date,
      hour: finalHour,
      duration: durationMins,
    });
    setDrawingSlot(null);
  }

  function handleSlotClick(date: string, hour: number) {
    if (drawingSlot) return;
    setCreateSlot({ date, hour });
  }

  function handleAppointmentClick(appointment: AppointmentWithRelations) {
    setSelectedAppointment(appointment);
  }

  function handleDayClick(date: string) {
    setDayOverviewDate(date);
  }


  const title =
    agenda.view === "month"
      ? formatMonth(toMonthString(agenda.date))
      : formatLongDate(agenda.date);

  // =========================================================
  // Bloco de Preview (Fantasma)
  // =========================================================
  function renderPreviewBlock(columnDate: string) {
    if (!drawingSlot || drawingSlot.date !== columnDate) return null;

    const deltaY = drawingSlot.currentY - drawingSlot.startY;
    const pixelsPerMin = HOUR_HEIGHT / 60;
    const durationMins = Math.round(Math.abs(deltaY) / pixelsPerMin / 5) * 5;

    if (durationMins >= 5) {
      const top = (drawingSlot.startHour - 7) * HOUR_HEIGHT + (deltaY < 0 ? deltaY : 0);
      const height = durationMins * pixelsPerMin;

      const startMin = drawingSlot.startHour * 60 + (deltaY < 0 ? deltaY / pixelsPerMin : 0);
      const endMin = startMin + durationMins;
      const endH = Math.floor(endMin / 60) % 24;
      const endM = Math.round(endMin % 60);
      const endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

      return (
        <div
          className="absolute z-40 rounded-md border-l-2 border-brand-500 bg-brand-100/80 px-2 py-1 text-xs text-brand-900 shadow-sm pointer-events-none dark:bg-brand-900/50 dark:text-brand-100"
          style={{
            top: top,
            height: height,
            left: "4px",
            right: "4px",
          }}
        >
          <p className="font-medium">Novo agendamento</p>
          <p className="text-[10px] opacity-80">
            {String(drawingSlot.startHour).padStart(2, "0")}:00 · {endTimeStr}
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-5">
        <AgendaToolbar
          view={agenda.view}
          onViewChange={agenda.setView}
          onPrevious={agenda.goPrevious}
          onNext={agenda.goNext}
          onToday={agenda.goToday}
          title={title}
        />

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Spinner size={24} />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-300">
              Erro: {error}
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            {agenda.view === "week" && (
              <WeekView
                date={agenda.date}
                appointments={appointments}
                billings={billings}
                onBillingsClick={(date: string, billings: BillingWithProvider[]) => setBillingsModal({ date, billings })}
                onAppointmentClick={handleAppointmentClick}
                onResize={handleResize}
                onSlotClick={handleSlotClick}
                onReload={reload}
                onDrawStart={handleDrawStart}
                onDrawMove={handleDrawMove}
                onDrawEnd={handleDrawEnd}
                previewBlock={renderPreviewBlock}
              />
            )}

            {agenda.view === "day" && (
              <DayView
                date={agenda.date}
                appointments={appointments.filter(a => a.status === 'active')} 
                billings={billings}
                onBillingsClick={(date, billings) => setBillingsModal({ date, billings })}
                onAppointmentClick={handleAppointmentClick}
                onResize={handleResize}
                onSlotClick={handleSlotClick}
                onReload={reload}
                onDrawStart={handleDrawStart}
                onDrawMove={handleDrawMove}
                onDrawEnd={handleDrawEnd}
                previewBlock={renderPreviewBlock}
              />
            )}

            {agenda.view === "month" && (
              <MonthView
                monthStr={toMonthString(agenda.date)}
                appointments={appointments}
                onDayClick={handleDayClick}
              />
            )}
          </>
        )}

        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onChanged={reload}
        />

        {dayOverviewDate && (
          <DayOverviewModal
            open
            date={dayOverviewDate}
            appointments={appointments.filter(
              (a) => a.starts_on === dayOverviewDate
            )}
            onClose={() => setDayOverviewDate(null)}
            onAppointmentClick={(a) => {
              setDayOverviewDate(null);
              setSelectedAppointment(a);
            }}
          />
        )}

        {createSlot && (
          <CreateAppointmentModal
            open
            date={createSlot.date}
            initialHour={createSlot.hour}
            initialDuration={createSlot.duration}
            onClose={() => setCreateSlot(null)}
            onCreated={() => {
              reload();
              setCreateSlot(null);
            }}
          />
        )}

        {monthCancelledModal && (
          <DayCancelledModal
            open
            date={monthCancelledModal.date}
            appointments={monthCancelledModal.appointments}
            onClose={() => setMonthCancelledModal(null)}
            onChanged={reload}
          />
        )}

        {billingsModal && (
          <DayBillingsModal
            open
            date={billingsModal.date}
            billings={billingsModal.billings}
            onClose={() => setBillingsModal(null)}
          />
        )}

        {moveTarget && (
          <MoveAppointmentModal
            appointment={moveTarget.appointment}
            newDate={moveTarget.newDate}
            newStartTime={moveTarget.newStartTime}
            onClose={() => setMoveTarget(null)}
            onMoved={() => {
              reload();
              setMoveTarget(null);
            }}
          />
        )}

        {resizeTarget && (
          <ResizeAppointmentModal
            appointment={resizeTarget.appointment}
            deltaY={resizeTarget.deltaY}
            onClose={() => setResizeTarget(null)}
            onResized={() => {
              reload();
              setResizeTarget(null);
            }}
          />
        )}
      </div>
    </DndContext>
  );
}