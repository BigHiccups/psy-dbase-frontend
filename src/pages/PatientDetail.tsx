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
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { usePatient } from "../hooks/usePatient";
import { Button, Card, Badge, ConfirmDialog, Spinner } from "../components/ui";
import type { PatientStatus } from "../types";

const STATUS_LABEL: Record<PatientStatus, string> = {
  active: "Ativo",
  inactive: "Arquivado",
  discharged: "Alta",
};

const STATUS_VARIANT: Record<
  PatientStatus,
  "success" | "neutral" | "brand"
> = {
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

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patient, loading, error, reload } = usePatient(id);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [working, setWorking] = useState(false);

  async function handleArchive() {
    if (!patient) return;
    setWorking(true);
    const { error } = await supabase
      .from("patients")
      .update({ status: "inactive" })
      .eq("id", patient.id);
    setWorking(false);

    if (error) {
      alert(error.message); // TODO: substituir por AlertDialog do design system
      return;
    }
    setArchiveOpen(false);
    reload();
  }

  async function handleReactivate() {
    if (!patient) return;
    setWorking(true);
    const { error } = await supabase
      .from("patients")
      .update({ status: "active" })
      .eq("id", patient.id);
    setWorking(false);

    if (error) {
      alert(error.message);
      return;
    }
    setReactivateOpen(false);
    reload();
  }

  async function handleDelete() {
    if (!patient) return;
    setWorking(true);
    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", patient.id);
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
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Voltar
        </Link>
        <Card className="p-12 text-center">
          <p className="text-sm text-gray-500">
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
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Voltar para pacientes
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">
                {patient.full_name}
              </h1>
              <Badge variant={STATUS_VARIANT[patient.status]}>
                {STATUS_LABEL[patient.status]}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
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
            onClick={() => setReactivateOpen(true)}
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

        {/* Excluir — discreto, à direita */}
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          disabled={working}
          className="text-gray-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={14} />
          Excluir
        </Button>
      </div>

      {/* Dados cadastrais */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-medium text-gray-900">
          Dados cadastrais
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <InfoItem icon={<IdCard size={14} />} label="CPF" value={patient.cpf} />
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
          <AlertTriangle size={14} className="text-amber-600" />
          <h2 className="text-sm font-medium text-gray-900">
            Contato de urgência
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <InfoItem label="Nome" value={patient.emergency_contact_name} />
          <InfoItem label="Telefone" value={patient.emergency_contact_phone} />
        </div>
      </Card>

      {/* Notas */}
      {patient.notes && (
        <Card className="p-6">
          <h2 className="mb-3 text-sm font-medium text-gray-900">
            Observações internas
          </h2>
          <p className="whitespace-pre-wrap text-sm text-gray-600">
            {patient.notes}
          </p>
        </Card>
      )}

      {/* Placeholder do prontuário */}
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
            <FileText size={16} />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-medium text-gray-900">
              Prontuário e evoluções
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              O registro clínico (anamnese, evolução SOAP, áudio) estará
              disponível em uma próxima versão.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
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
            O paciente <strong>{patient.full_name}</strong> não aparecerá mais
            na lista principal, mas continua no sistema. Você pode reativá-lo
            quando quiser.
          </>
        }
        confirmLabel="Arquivar"
        tone="warning"
      />

      {/* Modal: reativar */}
      <ConfirmDialog
        open={reactivateOpen}
        onClose={() => setReactivateOpen(false)}
        onConfirm={handleReactivate}
        title="Reativar paciente?"
        description={
          <>
            O paciente <strong>{patient.full_name}</strong> voltará para a
            lista principal como ativo.
          </>
        }
        confirmLabel="Reativar"
        tone="success"
      />

      {/* Modal: excluir permanentemente */}
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
    </div>
  );
}

// Item de informação com ícone opcional
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
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
        {icon}
        {label}
      </div>
      <p className="text-sm text-gray-900">{value || "—"}</p>
    </div>
  );
}