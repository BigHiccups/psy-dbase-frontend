import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Inbox,
  CalendarClock,
  CalendarDays,
  UserPlus,
  ArrowRight,
  Cake,
  ClipboardList,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useProspects } from "../hooks/useProspects";
import { useUpcomingAppointments } from "../hooks/useUpcomingAppointments";
import { useTodayAppointmentsCount } from "../hooks/useTodayAppointmentsCount";
import { useWeekAppointmentsCount } from "../hooks/useWeekAppointmentsCount";
import { useBirthdays } from "../hooks/useBirthdays";
import { Button, Card, Badge, Spinner } from "../components/ui";
import { ProspectCard } from "../components/ProspectCard";
import {
  formatTime,
  formatShortDate,
  isToday,
  toDateString,
} from "../lib/agenda-date";
import { TYPE_STYLES } from "../lib/appointment-colors";
import type { AppointmentWithRelations } from "../types";

type Profile = {
  full_name: string | null;
  crp: string | null;
  phone: string | null;
};

type Summary = {
  activePatients: number;
  pendingSubmissions: number;
};

const PROSPECTS_STORAGE_KEY = "psy-dbase:dashboard:prospects-expanded";
const UPCOMING_STORAGE_KEY = "psy-dbase:dashboard:upcoming-expanded";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

// Lê estado de expansão do localStorage (com fallback)
function readExpanded(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const saved = window.localStorage.getItem(key);
  if (saved === "true") return true;
  if (saved === "false") return false;
  return fallback;
}

function writeExpanded(key: string, value: boolean) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, String(value));
  }
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const prospects = useProspects();
  const upcoming = useUpcomingAppointments(7);
  const todayCount = useTodayAppointmentsCount();
  const weekCount = useWeekAppointmentsCount();
  const birthdays = useBirthdays();

  // Estado de expansão dos blocos colapsáveis
  const [prospectsExpanded, setProspectsExpanded] = useState<boolean>(() =>
    readExpanded(PROSPECTS_STORAGE_KEY, true) // será ajustado depois de carregar
  );
  const [upcomingExpanded, setUpcomingExpanded] = useState<boolean>(() =>
    readExpanded(UPCOMING_STORAGE_KEY, false)
  );

  // Ajuste inicial do bloco "Aguardando revisão":
  // expandido se ≤ 3 provisórios, colapsado se > 3
  // (só na primeira renderização, respeita escolha salva)
  useEffect(() => {
    if (prospects.loading) return;
    const hasSaved = window.localStorage.getItem(PROSPECTS_STORAGE_KEY);
    if (hasSaved === null) {
      const shouldExpand = prospects.prospects.length <= 3;
      setProspectsExpanded(shouldExpand);
      writeExpanded(PROSPECTS_STORAGE_KEY, shouldExpand);
    }
  }, [prospects.loading, prospects.prospects.length]);

  async function loadSummary() {
    if (!user) return;
    setLoadingSummary(true);

    const [profileRes, patientsRes, submissionsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, crp, phone")
        .eq("id", user.id)
        .single(),
      supabase
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("patient_form_submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);

    setSummary({
      activePatients: patientsRes.count ?? 0,
      pendingSubmissions: submissionsRes.count ?? 0,
    });

    setLoadingSummary(false);
  }

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function handleProspectDone() {
    prospects.reload();
    loadSummary();
  }

  function handleGoToAgenda(date: string) {
    navigate(`/agenda/day/${date}`);
  }

  function toggleProspects() {
    const next = !prospectsExpanded;
    setProspectsExpanded(next);
    writeExpanded(PROSPECTS_STORAGE_KEY, next);
  }

  function toggleUpcoming() {
    const next = !upcomingExpanded;
    setUpcomingExpanded(next);
    writeExpanded(UPCOMING_STORAGE_KEY, next);
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "psicólogo";
  const todayStr = toDateString(new Date());

  // Agrupa próximos por data (excluindo hoje)
  const upcomingByDate: Record<string, AppointmentWithRelations[]> = {};
  for (const appt of upcoming.upcoming) {
    if (!upcomingByDate[appt.starts_on]) upcomingByDate[appt.starts_on] = [];
    upcomingByDate[appt.starts_on].push(appt);
  }
  const upcomingDates = Object.keys(upcomingByDate).sort();

  const totalUpcoming = upcoming.today.length + upcoming.upcoming.length;

  return (
    <div className="space-y-8">
      {/* Saudação */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Aqui está o resumo do seu consultório.
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Users size={18} />}
          label="Pacientes ativos"
          value={summary?.activePatients}
          loading={loadingSummary}
          to="/patients"
        />
        <SummaryCard
          icon={<Inbox size={18} />}
          label="Submissões pendentes"
          value={summary?.pendingSubmissions}
          loading={loadingSummary}
          to="/patients"
          highlight={!!summary && summary.pendingSubmissions > 0}
        />
        <SummaryCard
          icon={<CalendarClock size={18} />}
          label="Sessões hoje"
          value={todayCount.count}
          loading={todayCount.loading}
          onClick={() => handleGoToAgenda(todayStr)}
        />
        <SummaryCard
          icon={<CalendarDays size={18} />}
          label="Sessões esta semana"
          value={weekCount.count}
          loading={weekCount.loading}
          onClick={() => navigate("/agenda/week/" + todayStr)}
        />
      </div>

      {/* Aguardando revisão (colapsável) */}
      {prospects.prospects.length > 0 && (
        <section>
          <Card>
            <button
              onClick={toggleProspects}
              className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-gray-50 dark:hover:bg-slate-800/50"
            >
              {prospectsExpanded ? (
                <ChevronDown
                  size={16}
                  className="shrink-0 text-gray-400 dark:text-slate-500"
                />
              ) : (
                <ChevronRight
                  size={16}
                  className="shrink-0 text-gray-400 dark:text-slate-500"
                />
              )}
              <ClipboardList
                size={16}
                className="shrink-0 text-amber-600 dark:text-amber-400"
              />
              <div className="flex flex-1 items-center gap-2">
                <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  Aguardando revisão
                </h2>
                <Badge variant="warning">{prospects.prospects.length}</Badge>
              </div>
              {!prospectsExpanded && (
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {prospects.prospects.length === 1
                    ? "1 cadastro aguardando revisão"
                    : `${prospects.prospects.length} cadastros aguardando revisão`}
                </p>
              )}
            </button>

            {prospectsExpanded && (
              <div className="border-t border-gray-100 p-4 dark:border-slate-800">
                <p className="mb-3 text-xs text-gray-500 dark:text-slate-400">
                  Importados do Google Calendar. Classifique cada um como
                  paciente, prestador ou remova.
                </p>
                <div
                  className={`space-y-3 ${
                    prospects.prospects.length > 3
                      ? "max-h-[420px] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/30 p-3 dark:border-slate-800 dark:bg-slate-900/30"
                      : ""
                  }`}
                >
                  {prospects.prospects.map((p) => (
                    <ProspectCard
                      key={p.id}
                      patient={p}
                      onDone={handleProspectDone}
                    />
                  ))}
                </div>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* Próximas sessões (colapsável) */}
      <section>
        <Card>
          <button
            onClick={toggleUpcoming}
            className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-gray-50 dark:hover:bg-slate-800/50"
          >
            {upcomingExpanded ? (
              <ChevronDown
                size={16}
                className="shrink-0 text-gray-400 dark:text-slate-500"
              />
            ) : (
              <ChevronRight
                size={16}
                className="shrink-0 text-gray-400 dark:text-slate-500"
              />
            )}
            <CalendarClock
              size={16}
              className="shrink-0 text-brand-600 dark:text-brand-400"
            />
            <div className="flex flex-1 items-center gap-2">
              <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
                Próximas sessões
              </h2>
              {totalUpcoming > 0 && (
                <Badge variant="brand">{totalUpcoming}</Badge>
              )}
            </div>
            {!upcomingExpanded && (
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {upcoming.loading
                  ? "Carregando..."
                  : totalUpcoming === 0
                    ? "Nenhuma nos próximos 7 dias"
                    : `Hoje: ${upcoming.today.length} · Próximos 7 dias: ${upcoming.upcoming.length}`}
              </p>
            )}
          </button>

          {upcomingExpanded && (
            <div className="border-t border-gray-100 dark:border-slate-800">
              <div className="flex items-center justify-end border-b border-gray-100 px-4 py-2 dark:border-slate-800">
                <Link
                  to="/agenda"
                  className="text-xs text-brand-700 hover:underline dark:text-brand-400"
                >
                  Ver agenda completa
                </Link>
              </div>

              {upcoming.loading ? (
                <div className="flex items-center gap-2 p-4 text-sm text-gray-500 dark:text-slate-400">
                  <Spinner size={16} />
                  Carregando sessões...
                </div>
              ) : upcoming.today.length === 0 && upcomingDates.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Nenhuma sessão nos próximos 7 dias.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {/* Hoje */}
                  {upcoming.today.length > 0 && (
                    <div className="p-4">
                      <button
                        onClick={() => handleGoToAgenda(todayStr)}
                        className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-brand-700 hover:underline dark:text-brand-400"
                      >
                        <Clock size={12} />
                        Hoje
                      </button>
                      <div className="space-y-2">
                        {upcoming.today.map((appt) => (
                          <AppointmentRow
                            key={appt.id}
                            appointment={appt}
                            onClick={() => handleGoToAgenda(appt.starts_on)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Próximos dias */}
                  {upcomingDates.map((date) => (
                    <div key={date} className="p-4">
                      <button
                        onClick={() => handleGoToAgenda(date)}
                        className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        <Clock size={12} />
                        {isToday(date) ? "Hoje" : formatShortDate(date)}
                      </button>
                      <div className="space-y-2">
                        {upcomingByDate[date].map((appt) => (
                          <AppointmentRow
                            key={appt.id}
                            appointment={appt}
                            onClick={() => handleGoToAgenda(appt.starts_on)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </section>

      {/* Aniversariantes do mês */}
      {birthdays.birthdays.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Cake size={16} className="text-pink-500 dark:text-pink-400" />
            <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
              Aniversariantes do mês
            </h2>
            <Badge variant="brand">{birthdays.birthdays.length}</Badge>
          </div>
          <Card className="divide-y divide-gray-100 dark:divide-slate-800">
            {birthdays.birthdays.map((b) => (
              <Link
                key={b.id}
                to={`/patients/${b.id}`}
                className="flex items-center justify-between gap-3 p-3 transition hover:bg-gray-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-50 text-sm font-medium text-pink-700 dark:bg-pink-950/50 dark:text-pink-300">
                    {b.full_name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      {b.full_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Dia {b.birthday_day} · {b.turns_age} anos
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="text-gray-400 dark:text-slate-500"
                />
              </Link>
            ))}
          </Card>
        </section>
      )}

      {/* Estado vazio inicial */}
      {!loadingSummary &&
        summary &&
        summary.activePatients === 0 &&
        summary.pendingSubmissions === 0 &&
        prospects.prospects.length === 0 &&
        totalUpcoming === 0 && (
          <Card className="p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
              <Users size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100">
              Bem-vindo ao psy-dbase
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500 dark:text-slate-400">
              Comece convidando seu primeiro paciente. Ele receberá um link
              para preencher o cadastro.
            </p>
            <div className="mt-5">
              <Link to="/patients">
                <Button>
                  <UserPlus size={16} />
                  Convidar primeiro paciente
                </Button>
              </Link>
            </div>
          </Card>
        )}
    </div>
  );
}

// =========================================================
// Sub-componentes
// =========================================================

function SummaryCard({
  icon,
  label,
  value,
  loading,
  to,
  onClick,
  highlight,
  disabled,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  loading: boolean;
  to?: string;
  onClick?: () => void;
  highlight?: boolean;
  disabled?: boolean;
  hint?: string;
}) {
  const content = (
    <Card
      className={`h-full p-5 transition ${
        disabled
          ? "opacity-60"
          : "cursor-pointer hover:border-brand-200 hover:shadow-md dark:hover:border-brand-800"
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            highlight
              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
              : "bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400"
          }`}
        >
          {icon}
        </div>
        {highlight && <Badge variant="warning">Atenção</Badge>}
      </div>

      <p className="mt-4 text-2xl font-semibold text-gray-900 dark:text-slate-100">
        {loading ? (
          <span className="inline-block h-7 w-10 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
        ) : (
          (value ?? 0)
        )}
      </p>
      <p className="text-sm text-gray-500 dark:text-slate-400">{label}</p>
      {hint && (
        <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
          {hint}
        </p>
      )}
    </Card>
  );

  if (disabled) return content;
  if (to) return <Link to={to}>{content}</Link>;
  if (onClick)
    return (
      <button onClick={onClick} className="block w-full text-left">
        {content}
      </button>
    );
  return content;
}

function AppointmentRow({
  appointment,
  onClick,
}: {
  appointment: AppointmentWithRelations;
  onClick: () => void;
}) {
  const style = TYPE_STYLES[appointment.type];
  const name =
    appointment.patient?.full_name ??
    appointment.provider?.display_name ??
    "(sem nome)";

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border-l-4 p-3 text-left transition hover:brightness-95 ${style.bg} ${style.border}`}
    >
      <div className="w-14 shrink-0">
        <p className={`text-sm font-semibold ${style.text}`}>
          {formatTime(appointment.start_time)}
        </p>
        <p className={`text-[10px] ${style.text} opacity-70`}>
          {appointment.duration_min}min
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${style.text}`}>{name}</p>
        <p className={`text-[10px] ${style.text} opacity-70`}>
          {style.label}
        </p>
      </div>
    </button>
  );
}