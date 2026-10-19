import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import {
  useAgendaView,
  getViewRange,
  type AgendaView,
} from "../hooks/useAgendaView";
import { useAppointments } from "../hooks/useAppointments";
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
  } | null>(null);

  const [monthCancelledModal, setMonthCancelledModal] = useState<{
    date: string;
    appointments: AppointmentWithRelations[];
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

  // Sensores do DnD (exige arrastar 5px para ativar, evitando cliques acidentais)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    // Se soltou fora de um slot válido, ignora
    if (!over) return;

    const appointment = active.data.current
      ?.appointment as AppointmentWithRelations;
    if (!appointment) return;

    // O id do DroppableSlot tem o formato "YYYY-MM-DD|hour" (ex: "2026-10-23|14")
    const [newDate, hourStr] = (over.id as string).split("|");
    const hour = parseInt(hourStr, 10);

    // Mantém os minutos originais (ex: se era 14:30, vira 15:30)
    const originalMinutes = appointment.start_time.split(":")[1].slice(0, 2);
    const newStartTime = `${String(hour).padStart(2, "0")}:${originalMinutes}`;

    // Se a data e o horário não mudaram, não faz nada
    if (
      newDate === appointment.starts_on &&
      newStartTime === appointment.start_time.slice(0, 5)
    ) {
      return;
    }

    // Abre o modal de confirmação
    setMoveTarget({ appointment, newDate, newStartTime });
  }

  function handleResize(appointment: AppointmentWithRelations, deltaY: number) {
    setResizeTarget({ appointment, deltaY });
  }

  // =========================================================
  // Handlers de cliques normais
  // =========================================================
  function handleSlotClick(date: string, hour: number) {
    setCreateSlot({ date, hour });
  }

  function handleAppointmentClick(appointment: AppointmentWithRelations) {
    setSelectedAppointment(appointment);
  }

  function handleDayClick(date: string) {
    setDayOverviewDate(date);
  }

  function handleMonthCancelledClick(date: string) {
    const cancelled = appointments.filter(
      (a) => a.starts_on === date && a.status === "cancelled"
    );
    setMonthCancelledModal({ date, appointments: cancelled });
  }

  const title =
    agenda.view === "month"
      ? formatMonth(toMonthString(agenda.date))
      : formatLongDate(agenda.date);

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
                onAppointmentClick={handleAppointmentClick}
                onResize={handleResize} // <--- ADICIONADO AQUI
                onSlotClick={handleSlotClick}
                onReload={reload}
              />
            )}

            {agenda.view === "day" && (
              <DayView
                date={agenda.date}
                appointments={appointments.filter(
                  (a) => a.starts_on === agenda.date
                )}
                onAppointmentClick={handleAppointmentClick}
                onResize={handleResize} // <--- ADICIONADO AQUI
                onSlotClick={handleSlotClick}
                onReload={reload}
              />
            )}

            {agenda.view === "month" && (
              <MonthView
                monthStr={toMonthString(agenda.date)}
                appointments={appointments}
                onDayClick={handleDayClick}
                onCancelledClick={handleMonthCancelledClick}
                onAppointmentClick={handleAppointmentClick}
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

        {/* Modal de confirmação do Drag and Drop */}
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

        {/* Modal de confirmação do Resize */}
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