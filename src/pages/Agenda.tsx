import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    </div>
  );
}