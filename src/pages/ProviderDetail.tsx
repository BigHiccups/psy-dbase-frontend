import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Archive,
  RotateCcw,
  Trash2,
  Building2,
  User,
  Phone,
  Mail,
  IdCard,
  Clock,
  PauseCircle,
  CalendarClock,
  Plus,
  Wallet,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useProvider } from "../hooks/useProvider";
import { useProviderSchedules } from "../hooks/useProviderSchedules";
import { Button, Card, Badge, ConfirmDialog, Spinner } from "../components/ui";
import { CancelSeriesModal } from "../components/agenda/CancelSeriesModal";
import { ReactivateModal } from "../components/ReactivateModal";
import { ConflictOnReactivateModal } from "../components/ConflictOnReactivateModal";
import { WEEKDAY_LONG, isoWeekday } from "../lib/agenda-date";
import { centsToCurrencyBRL } from "../lib/masks";
import { getRecurrenceShortLabel } from "../lib/recurrence";
import type { ProviderKind, ScheduleInput } from "../types";

const KIND_LABEL: Record<ProviderKind, string> = {
  person: "Pessoa física",
  company: "Empresa",
};

function documentLabel(kind: ProviderKind): string {
  return kind === "company" ? "CNPJ" : "CPF";
}

type ConflictItem = {
  schedule: ScheduleInput;
  occupiedBy: string;
};

export function ProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { provider, loading, error, reload } = useProvider(id);

  const {
    schedules: providerSchedules,
    recurrenceType,
    recurrenceDays,
    reload: reloadSchedules,
  } = useProviderSchedules(id);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<ConflictItem[]>([]);
  const [working, setWorking] = useState(false);

  async function handleArchive() {
    if (!provider) return;
    setWorking(true);

    const { error: cancelErr } = await supabase.rpc(
      "cancel_provider_future_appointments",
      { p_provider_id: provider.id }
    );

    if (cancelErr) {
      alert(cancelErr.message);
      setWorking(false);
      return;
    }

    const { error } = await supabase
      .from("providers")
      .update({ status: "archived" })
      .eq("id", provider.id);

    setWorking(false);

    if (error) {
      alert(error.message);
      return;
    }
    setArchiveOpen(false);
    reload();
    reloadSchedules();
  }

  async function findConflicts(): Promise<ConflictItem[]> {
    if (!provider || providerSchedules.length === 0) return [];

    const conflicts: ConflictItem[] = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const s of providerSchedules) {
      const { data } = await supabase
        .from("appointments")
        .select(
          "patient_id, provider_id, patients (full_name), providers (display_name)"
        )
        .eq("weekday", s.weekday)
        .eq("start_time", `${s.startTime}:00`)
        .eq("status", "active")
        .gte("starts_on", today)
        .or(`patient_id.not.is.null,provider_id.neq.${provider.id}`)
        .limit(1);

      if (data && data.length > 0) {
        const row = data[0] as unknown as {
          patient_id: string | null;
          provider_id: string | null;
          patients: { full_name: string } | { full_name: string }[] | null;
          providers:
          | { display_name: string }
          | { display_name: string }[]
          | null;
        };

        if (row.provider_id === provider.id && !row.patient_id) continue;

        const patientRel = Array.isArray(row.patients)
          ? row.patients[0]
          : row.patients;
        const providerRel = Array.isArray(row.providers)
          ? row.providers[0]
          : row.providers;

        const name =
          patientRel?.full_name ??
          providerRel?.display_name ??
          "outro agendamento";

        conflicts.push({ schedule: s, occupiedBy: name });
        continue;
      }

      const { data: blockData } = await supabase
        .from("appointments")
        .select("id")
        .eq("weekday", s.weekday)
        .eq("start_time", `${s.startTime}:00`)
        .eq("status", "active")
        .gte("starts_on", today)
        .is("patient_id", null)
        .is("provider_id", null)
        .limit(1);

      if (blockData && blockData.length > 0) {
        conflicts.push({ schedule: s, occupiedBy: "bloqueio pessoal" });
      }
    }

    return conflicts;
  }

  async function handleReactivateClick() {
    if (!provider) return;

    if (providerSchedules.length === 0) {
      setReactivateModalOpen(true);
      return;
    }

    setWorking(true);
    const conflicts = await findConflicts();
    setWorking(false);

    if (conflicts.length === 0) {
      await handleReactivate(providerSchedules);
      return;
    }

    setConflictDetails(conflicts);
    setConflictModalOpen(true);
  }

  async function handleReactivate(schedulesToCreate: ScheduleInput[]) {
    if (!provider) return;
    setWorking(true);

    const { error } = await supabase
      .from("providers")
      .update({ status: "active" })
      .eq("id", provider.id);

    if (error) {
      alert(error.message);
      setWorking(false);
      return;
    }

    if (schedulesToCreate.length > 0) {
      const { error: scheduleErr } = await supabase.rpc(
        "set_provider_schedules",
        { p_provider_id: provider.id, p_schedules: schedulesToCreate }
      );

      if (scheduleErr) {
        alert(scheduleErr.message);
        setWorking(false);
        return;
      }
    }

    setWorking(false);
    reload();
    reloadSchedules();
  }

  async function handleReactivateWithoutSchedules() {
    setReactivateModalOpen(false);
    await handleReactivate([]);
  }

  async function handleReactivateOnlyValid() {
    if (!provider) return;

    const validSchedules = providerSchedules.filter(
      (s) => !conflictDetails.some((c) => c.schedule === s)
    );

    if (validSchedules.length === 0) {
      alert("Nenhum horário livre para reativar. Escolha novos horários.");
      return;
    }

    setConflictModalOpen(false);
    await handleReactivate(validSchedules);
  }

  async function handleDelete() {
    if (!provider) return;
    setWorking(true);

    const { error } = await supabase.rpc("delete_provider", {
      p_provider_id: provider.id,
    });

    setWorking(false);

    if (error) {
      alert(error.message);
      return;
    }
    setDeleteOpen(false);
    navigate("/providers");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={24} />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link
          to="/providers"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft size={14} />
          Voltar
        </Link>
        <Card className="p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {error ?? "Prestador não encontrado."}
          </p>
        </Card>
      </div>
    );
  }

  const isArchived = provider.status === "archived";
  const isCompany = provider.kind === "company";
  const KindIcon = isCompany ? Building2 : User;
  const hasActiveSchedules =
    !isArchived && !isCompany && providerSchedules.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to="/providers"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft size={14} />
          Voltar para prestadores
        </Link>

        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
            <KindIcon size={22} />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                {provider.display_name}
              </h1>
              {isArchived ? (
                <Badge variant="neutral">Arquivado</Badge>
              ) : (
                <Badge variant="success">Ativo</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {KIND_LABEL[provider.kind]} · Prestador desde{" "}
              {new Date(provider.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      {/* Ações do topo */}
      <div className="flex flex-wrap gap-2">
        <Link to={`/providers/${provider.id}/edit`}>
          <Button variant="secondary" size="sm" disabled={working}>
            <Pencil size={14} />
            Editar
          </Button>
        </Link>

        {isArchived ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReactivateClick}
            disabled={working}
          >
            <RotateCcw size={14} />
            Reativar
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setArchiveOpen(true)}
            disabled={working}
          >
            <Archive size={14} />
            Arquivar
          </Button>
        )}

        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          disabled={working}
          className="text-gray-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
        >
          <Trash2 size={14} />
          Excluir
        </Button>
      </div>

      {/* Dados do prestador */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-medium text-gray-900 dark:text-slate-100">
          Dados do prestador
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <InfoItem
            icon={<IdCard size={14} />}
            label={documentLabel(provider.kind)}
            value={provider.document}
          />
          {isCompany && (
            <InfoItem
              icon={<Building2 size={14} />}
              label="Razão social"
              value={provider.legal_name}
            />
          )}
          <InfoItem
            icon={<Mail size={14} />}
            label="E-mail"
            value={provider.email}
          />
          <InfoItem
            icon={<Phone size={14} />}
            label="Telefone"
            value={provider.phone}
          />
          {provider.session_price_cents !== null && (
            <InfoItem
              icon={<Wallet size={14} />}
              label={
                isCompany ? "Valor recorrente (referência)" : "Valor da sessão"
              }
              value={`R$ ${centsToCurrencyBRL(provider.session_price_cents)}`}
            />
          )}
        </div>
      </Card>

      {/* Pessoa física: horários recorrentes */}
      {!isCompany && (
        <Card className="p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarClock
                size={14}
                className="text-brand-600 dark:text-brand-400"
              />
              <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
                Horários
              </h2>
              {providerSchedules.length > 0 && (
                <Badge
                  variant={recurrenceType === "weekly" ? "neutral" : "brand"}
                >
                  {recurrenceType === "custom_days" && recurrenceDays
                    ? `A cada ${recurrenceDays} dias`
                    : getRecurrenceShortLabel(recurrenceType)}
                </Badge>
              )}
            </div>
            {hasActiveSchedules && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSuspendOpen(true)}
                disabled={working}
                className="text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <PauseCircle size={14} />
                Suspender agendamentos
              </Button>
            )}
          </div>

          {providerSchedules.length > 0 ? (
            <ul className="space-y-2">
              {providerSchedules.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                >
                  <span className="font-medium text-gray-900 dark:text-slate-100">
                    {WEEKDAY_LONG[isoWeekday(s.weekday)]}
                  </span>
                  <span className="text-gray-500 dark:text-slate-400">
                    {s.startTime} · {s.durationMin} min
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-slate-700">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Nenhum horário definido ainda.
              </p>
              {!isArchived && (
                <Link to={`/providers/${provider.id}/edit`}>
                  <Button variant="secondary" size="sm" className="mt-3">
                    <Plus size={14} />
                    Definir horários
                  </Button>
                </Link>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Empresa: vencimentos (placeholder Fase B) */}
      {isCompany && (
        <Card className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock
              size={14}
              className="text-brand-600 dark:text-brand-400"
            />
            <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
              Vencimentos
            </h2>
          </div>
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Cadastre pagamentos recorrentes (mensal, bimestral, semestral,
              anual).
            </p>
            <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-400 dark:text-slate-500">
              <Clock size={12} />
              Disponível em breve
            </div>
          </div>
        </Card>
      )}

      {/* Notas */}
      {provider.notes && (
        <Card className="p-6">
          <h2 className="mb-3 text-sm font-medium text-gray-900 dark:text-slate-100">
            Observações internas
          </h2>
          <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-slate-300">
            {provider.notes}
          </p>
        </Card>
      )}

      {/* Modais */}
      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
        title="Arquivar prestador?"
        description={
          <>
            <strong>{provider.display_name}</strong> será arquivado e todos os
            agendamentos futuros serão cancelados. Você pode reativá-lo quando
            quiser.
          </>
        }
        confirmLabel="Arquivar"
        tone="warning"
      />

      <ReactivateModal
        open={reactivateModalOpen}
        subjectType="provider"
        subjectName={provider.display_name}
        onClose={() => setReactivateModalOpen(false)}
        onDefineSchedules={() => {
          setReactivateModalOpen(false);
          navigate(`/providers/${provider.id}/edit`);
        }}
        onReactivateWithout={handleReactivateWithoutSchedules}
      />

      <ConflictOnReactivateModal
        open={conflictModalOpen}
        subjectType="provider"
        conflicts={conflictDetails}
        onClose={() => setConflictModalOpen(false)}
        onEditSchedules={() => {
          setConflictModalOpen(false);
          navigate(`/providers/${provider.id}/edit`);
        }}
        onReactivateValidOnes={handleReactivateOnlyValid}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Excluir prestador permanentemente?"
        description={
          <>
            <p>
              Esta ação <strong>não pode ser desfeita</strong>. Todos os dados
              de <strong>{provider.display_name}</strong> serão removidos.
            </p>
            <p className="mt-2 text-xs">
              Se quiser apenas tirar da lista principal, use{" "}
              <strong>Arquivar</strong> em vez de Excluir.
            </p>
          </>
        }
        confirmLabel="Excluir permanentemente"
        tone="danger"
      />

      {suspendOpen && (
        <CancelSeriesModal
          open
          subjectId={provider.id}
          subjectType="provider"
          subjectName={provider.display_name}
          onClose={() => setSuspendOpen(false)}
          onDone={() => {
            setSuspendOpen(false);
            reload();
            reloadSchedules();
          }}
        />
      )}
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400">
        {icon}
        {label}
      </div>
      <p className="text-sm text-gray-900 dark:text-slate-100">
        {value || "—"}
      </p>
    </div>
  );
}