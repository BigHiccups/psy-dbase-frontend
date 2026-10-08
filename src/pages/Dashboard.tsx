import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Inbox,
  CalendarClock,
  UserPlus,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Button, Card, Badge } from "../components/ui";

type Profile = {
  full_name: string | null;
  crp: string | null;
  phone: string | null;
};

type Summary = {
  activePatients: number;
  pendingSubmissions: number;
};

// Saudação conforme o horário local
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);

      // Busca o perfil e os contadores em paralelo
      const [profileRes, patientsRes, submissionsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, crp, phone")
          .eq("id", user!.id)
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

      setLoading(false);
    }

    load();
  }, [user]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "psicólogo";
  const profileIncomplete = profile && (!profile.crp || !profile.phone);

  return (
    <div className="space-y-8">
      {/* Saudação */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Aqui está o resumo do seu consultório.
        </p>
      </div>

      {/* Aviso de perfil incompleto */}
      {!loading && profileIncomplete && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              Complete seu perfil
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              {!profile?.crp && !profile?.phone
                ? "Adicione seu CRP e telefone para que os recibos e lembretes funcionem corretamente."
                : !profile?.crp
                  ? "Adicione seu CRP para emitir recibos e documentos."
                  : "Adicione seu telefone para receber notificações."}
            </p>
          </div>
          <Link
            to="/settings"
            className="shrink-0 text-xs font-medium text-amber-900 underline hover:no-underline"
          >
            Configurar
          </Link>
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          icon={<Users size={18} />}
          label="Pacientes ativos"
          value={summary?.activePatients}
          loading={loading}
          to="/patients"
        />
        <SummaryCard
          icon={<Inbox size={18} />}
          label="Submissões pendentes"
          value={summary?.pendingSubmissions}
          loading={loading}
          to="/patients"
          highlight={!!summary && summary.pendingSubmissions > 0}
        />
        <SummaryCard
          icon={<CalendarClock size={18} />}
          label="Sessões hoje"
          value={0}
          loading={false}
          disabled
          hint="Disponível em breve"
        />
      </div>

      {/* Ações rápidas */}
      <Card className="p-6">
        <h2 className="text-sm font-medium text-gray-900">Ações rápidas</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => (window.location.href = "/patients")}>
            <UserPlus size={16} />
            Convidar paciente
          </Button>
          <Link to="/patients">
            <Button variant="secondary">
              Ver todos os pacientes
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Estado vazio inicial */}
      {!loading &&
        summary &&
        summary.activePatients === 0 &&
        summary.pendingSubmissions === 0 && (
          <Card className="p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Users size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-900">
              Bem-vindo ao psy-dbase
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
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

// Card de resumo com número + label
function SummaryCard({
  icon,
  label,
  value,
  loading,
  to,
  highlight,
  disabled,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  loading: boolean;
  to?: string;
  highlight?: boolean;
  disabled?: boolean;
  hint?: string;
}) {
  const content = (
    <Card
      className={`p-5 transition ${
        disabled
          ? "opacity-60"
          : "hover:border-brand-200 hover:shadow-md cursor-pointer"
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            highlight ? "bg-amber-50 text-amber-600" : "bg-brand-50 text-brand-600"
          }`}
        >
          {icon}
        </div>
        {highlight && <Badge variant="warning">Atenção</Badge>}
      </div>

      <p className="mt-4 text-2xl font-semibold text-gray-900">
        {loading ? (
          <span className="inline-block h-7 w-10 animate-pulse rounded bg-gray-200" />
        ) : (
          (value ?? 0)
        )}
      </p>
      <p className="text-sm text-gray-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </Card>
  );

  if (disabled || !to) return content;
  return <Link to={to}>{content}</Link>;
}