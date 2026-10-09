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
import { Spinner } from "../components/ui";
import {
  formatLongDate,
  formatMonth,
  // toDateString,
  toMonthString,
} from "../lib/agenda-date";
import type { AppointmentWithRelations } from "../types";

export function Agenda() {
  const navigate = useNavigate();
  const params = useParams<{ view?: string; date?: string }>();

  const agenda = useAgendaView();

  // Sincroniza URL ↔ estado
  useEffect(() => {
    const viewFromUrl = params.view as AgendaView | undefined;
    if (viewFromUrl && ["day", "week", "month"].includes(viewFromUrl)) {
      if (viewFromUrl !== agenda.view) agenda.setView(viewFromUrl);
    }

    const dateFromUrl = params.date;
    if (dateFromUrl && dateFromUrl !== agenda.date) {
      // Se for month, adiciona -01
      const normalized =
        viewFromUrl === "month" && dateFromUrl.length === 7
          ? `${dateFromUrl}-01`
          : dateFromUrl;
      agenda.setDate(normalized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.view, params.date]);

  // Redireciona para URL canônica quando a view/date muda
  useEffect(() => {
    const { view, date } = agenda;
    const expectedDate = view === "month" ? toMonthString(date) : date;
    const expectedPath = `/agenda/${view}/${expectedDate}`;
    if (window.location.pathname !== expectedPath) {
      navigate(expectedPath, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agenda.view, agenda.date]);

  // Carrega appointments do range
  const range = getViewRange(agenda.view, agenda.date);
  const { appointments, loading, error, reload } = useAppointments(
    range.from,
    range.to
  );

  // Estado dos modais
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithRelations | null>(null);

  const [dayOverviewDate, setDayOverviewDate] = useState<string | null>(null);

  const [createSlot, setCreateSlot] = useState<{
    date: string;
    hour: number;
  } | null>(null);

  // Ao clicar num slot vazio da grade
  function handleSlotClick(date: string, hour: number) {
    setCreateSlot({ date, hour });
  }

  // Ao clicar num appointment
  function handleAppointmentClick(appointment: AppointmentWithRelations) {
    setSelectedAppointment(appointment);
  }

  // Ao clicar num dia do mês
  function handleDayClick(date: string) {
    setDayOverviewDate(date);
  }

  // Título contextual
  const title =
    agenda.view === "month"
      ? formatMonth(toMonthString(agenda.date))
      : formatLongDate(agenda.date);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <AgendaToolbar
        view={agenda.view}
        onViewChange={agenda.setView}
        onPrevious={agenda.goPrevious}
        onNext={agenda.goNext}
        onToday={agenda.goToday}
        title={title}
      />

      {/* Conteúdo */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size={24} />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">Erro: {error}</p>
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
            />
          )}

          {agenda.view === "day" && (
            <DayView
              date={agenda.date}
              appointments={appointments}
              onAppointmentClick={handleAppointmentClick}
              onSlotClick={handleSlotClick}
            />
          )}

          {agenda.view === "month" && (
            <MonthView
              monthStr={toMonthString(agenda.date)}
              appointments={appointments}
              onDayClick={handleDayClick}
              onAppointmentClick={handleAppointmentClick}
            />
          )}
        </>
      )}

      {/* Modais */}
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
    </div>
  );
}