import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Archive,
  RotateCcw,
  Phone,
  MapPin,
  Cake,
  IdCard,
  AlertTriangle,
  FileText,
  Clock,
  Trash2,
  PauseCircle,
  CalendarClock,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { usePatient } from "../hooks/usePatient";
import { usePatientSchedules } from "../hooks/usePatientSchedules";
import { Button, Card, Badge, ConfirmDialog, Spinner } from "../components/ui";
import { CancelSeriesModal } from "../components/agenda/CancelSeriesModal";
import { ReactivateModal } from "../components/ReactivateModal";
import { ConflictOnReactivateModal } from "../components/ConflictOnReactivateModal";
import { WEEKDAY_LONG, isoWeekday } from "../lib/agenda-date";
import type { PatientStatus, ScheduleInput } from "../types";

const STATUS_LABEL: Record<PatientStatus, string> = {
  prospect: "Em revisão",
  active: "Ativo",
  inactive: "Arquivado",
  discharged: "Alta",
};

const STATUS_VARIANT: Record<
  PatientStatus,
  "success" | "neutral" | "brand" | "warning"
> = {
  prospect: "warning",
  active: "success",
  inactive: "neutral",
  discharged: "brand",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

type ConflictItem = {
  schedule: ScheduleInput;
  occupiedBy: string;
};

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patient, loading, error, reload } = usePatient(id);
  const { schedules: patientSchedules } = usePatientSchedules(id);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<ConflictItem[]>([]);
  const [working, setWorking] = useState(false);

  async function handleArchive() {
    if (!patient) return;
    setWorking(true);

    const { error: cancelErr } = await supabase.rpc(
      "cancel_future_appointments",
      { p_patient_id: patient.id }
    );

    if (cancelErr) {
      alert(cancelErr.message);
      setWorking(false);
      return;
    }

    const { error } = await supabase
      .from("patients")
      .update({ status: "inactive" })
      .eq("id", patient.id);

    setWorking(false);

    if (error) {
      alert(error.message);
      return;
    }
    setArchiveOpen(false);
    reload();
  }

  async function findConflicts(): Promise<ConflictItem[]> {
    if (!patient || patientSchedules.length === 0) return [];

    const conflicts: ConflictItem[] = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const s of patientSchedules) {
      const { data } = await supabase
        .from("appointments")
        .select("patient_id, patients (full_name)")
        .eq("weekday", s.weekday)
        .eq("start_time", `${s.startTime}:00`)
        .eq("status", "active")
        .gte("starts_on", today)
        .neq("patient_id", patient.id)
        .limit(1);

      if (data && data.length > 0) {
        const row = data[0] as unknown as {
          patients: { full_name: string } | { full_name: string }[] | null;
        };
        const patientRel = Array.isArray(row.patients)
          ? row.patients[0]
          : row.patients;
        conflicts.push({
          schedule: s,
          occupiedBy: patientRel?.full_name ?? "(outro paciente)",
        });
        continue;
      }

      const { data: blockData } = await supabase
        .from("appointments")
        .select("type")
        .eq("weekday", s.weekday)
        .eq("start_time", `${s.startTime}:00`)
        .eq("status", "active")
        .gte("starts_on", today)
        .is("patient_id", null)
        .limit(1);

      if (blockData && blockData.length > 0) {
        conflicts.push({ schedule: s, occupiedBy: "bloqueio pessoal" });
      }
    }

    return conflicts;
  }

  async function handleReactivateClick() {
    if (!patient) return;

    if (patientSchedules.length === 0) {
      setReactivateModalOpen(true);
      return;
    }

    setWorking(true);
    const conflicts = await findConflicts();
    setWorking(false);

    if (conflicts.length === 0) {
      await handleReactivate(patientSchedules);
      return;
    }

    setConflictDetails(conflicts);
    setConflictModalOpen(true);
  }

  async function handleReactivate(schedulesToCreate: ScheduleInput[]) {
    if (!patient) return;
    setWorking(true);

    const { error } = await supabase
      .from("patients")
      .update({ status: "active" })
      .eq("id", patient.id);

    if (error) {
      alert(error.message);
      setWorking(false);
      return;
    }

    if (schedulesToCreate.length > 0) {
      const { error: scheduleErr } = await supabase.rpc(
        "set_patient_schedules",
        { p_patient_id: patient.id, p_schedules: schedulesToCreate }
      );

      if (scheduleErr) {
        alert(scheduleErr.message);
        setWorking(false);
        return;
      }
    }

    setWorking(false);
    reload();
  }

  async function handleReactivateWithoutSchedules() {
    setReactivateModalOpen(false);
    await handleReactivate([]);
  }

  async function handleReactivateOnlyValid() {
    if (!patient) return;

    const validSchedules = patientSchedules.filter(
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
    if (!patient) return;
    setWorking(true);

    const { error } = await supabase.rpc("delete_patient", {
      p_patient_id: patient.id,
    });

    setWorking(false);

    if (error) {
      alert(error.message);
      return;
    }
    setDeleteOpen(false);
    navigate("/patients");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={24} />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          to="/patients"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft size={14} />
          Voltar
        </Link>
        <Card className="p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {error ?? "Paciente não encontrado."}
          </p>
        </Card>
      </div>
    );
  }

  const isArchived = patient.status !== "active";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Cabeçalho */}
      <div>
        <Link
          to="/patients"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft size={14} />
          Voltar para pacientes
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                {patient.full_name}
              </h1>
              <Badge variant={STATUS_VARIANT[patient.status]}>
                {STATUS_LABEL[patient.status]}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Paciente desde{" "}
              {new Date(patient.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        <Link to={`/patients/${patient.id}/edit`}>
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

        {!isArchived && patientSchedules.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSuspendOpen(true)}
            disabled={working}
          >
            <PauseCircle size={14} />
            Suspender agendamentos
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

      {/* Dados cadastrais */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-medium text-gray-900 dark:text-slate-100">
          Dados cadastrais
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <InfoItem
            icon={<IdCard size={14} />}
            label="CPF"
            value={patient.cpf}
          />
          <InfoItem
            icon={<Cake size={14} />}
            label="Nascimento"
            value={formatDate(patient.birth_date)}
          />
          <InfoItem
            icon={<MapPin size={14} />}
            label="Cidade"
            value={patient.city}
          />
          <InfoItem
            icon={<Phone size={14} />}
            label="Telefone"
            value={patient.phone}
          />
        </div>
      </Card>

      {/* Contato de urgência */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle
            size={14}
            className="text-amber-600 dark:text-amber-400"
          />
          <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
            Contato de urgência
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <InfoItem label="Nome" value={patient.emergency_contact_name} />
          <InfoItem
            label="Telefone"
            value={patient.emergency_contact_phone}
          />
        </div>
      </Card>

      {/* Horários recorrentes */}
      {patientSchedules.length > 0 && (
        <Card className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock
              size={14}
              className="text-brand-600 dark:text-brand-400"
            />
            <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
              Horários das sessões
            </h2>
          </div>
          <ul className="space-y-2">
            {patientSchedules.map((s, i) => (
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
        </Card>
      )}

      {/* Notas */}
      {patient.notes && (
        <Card className="p-6">
          <h2 className="mb-3 text-sm font-medium text-gray-900 dark:text-slate-100">
            Observações internas
          </h2>
          <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-slate-300">
            {patient.notes}
          </p>
        </Card>
      )}

      {/* Placeholder do prontuário */}
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400">
            <FileText size={16} />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
              Prontuário e evoluções
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              O registro clínico (anamnese, evolução SOAP, áudio) estará
              disponível em uma próxima versão.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
            <Clock size={12} />
            Em breve
          </div>
        </div>
      </Card>

      {/* Modal: arquivar */}
      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
        title="Arquivar paciente?"
        description={
          <>
            O paciente <strong>{patient.full_name}</strong> será arquivado e
            todos os agendamentos futuros serão cancelados. Você pode
            reativá-lo quando quiser.
          </>
        }
        confirmLabel="Arquivar"
        tone="warning"
      />

      {/* Modal: reativar sem schedules */}
      <ReactivateModal
        open={reactivateModalOpen}
        subjectType="patient"
        subjectName={patient.full_name}
        onClose={() => setReactivateModalOpen(false)}
        onDefineSchedules={() => {
          setReactivateModalOpen(false);
          navigate(`/patients/${patient.id}/edit`);
        }}
        onReactivateWithout={handleReactivateWithoutSchedules}
      />

      {/* Modal: reativar com conflito */}
      <ConflictOnReactivateModal
        open={conflictModalOpen}
        subjectType="patient"
        conflicts={conflictDetails}
        onClose={() => setConflictModalOpen(false)}
        onEditSchedules={() => {
          setConflictModalOpen(false);
          navigate(`/patients/${patient.id}/edit`);
        }}
        onReactivateValidOnes={handleReactivateOnlyValid}
      />

      {/* Modal: excluir */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Excluir paciente permanentemente?"
        description={
          <>
            <p>
              Esta ação <strong>não pode ser desfeita</strong>. Todos os dados
              de <strong>{patient.full_name}</strong> serão removidos do
              sistema.
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

      {/* Modal: suspender agendamentos */}
      {suspendOpen && (
        <CancelSeriesModal
          open
          subjectId={patient.id}
          subjectType="patient"
          subjectName={patient.full_name}
          onClose={() => setSuspendOpen(false)}
          onDone={() => {
            setSuspendOpen(false);
            reload();
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