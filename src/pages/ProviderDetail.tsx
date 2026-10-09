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
  FileText,
  IdCard,
  Clock,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useProvider } from "../hooks/useProvider";
import { Button, Card, Badge, ConfirmDialog, Spinner } from "../components/ui";
import type { ProviderKind } from "../types";

const KIND_LABEL: Record<ProviderKind, string> = {
  person: "Pessoa física",
  company: "Empresa",
};

function documentLabel(kind: ProviderKind): string {
  return kind === "company" ? "CNPJ" : "CPF";
}

export function ProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { provider, loading, error, reload } = useProvider(id);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [working, setWorking] = useState(false);

  async function handleArchive() {
    if (!provider) return;
    setWorking(true);
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
  }

  async function handleReactivate() {
    if (!provider) return;
    setWorking(true);
    const { error } = await supabase
      .from("providers")
      .update({ status: "active" })
      .eq("id", provider.id);
    setWorking(false);

    if (error) {
      alert(error.message);
      return;
    }
    setReactivateOpen(false);
    reload();
  }

  async function handleDelete() {
    if (!provider) return;
    setWorking(true);
    const { error } = await supabase
      .from("providers")
      .delete()
      .eq("id", provider.id);
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
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Voltar
        </Link>
        <Card className="p-12 text-center">
          <p className="text-sm text-gray-500">
            {error ?? "Prestador não encontrado."}
          </p>
        </Card>
      </div>
    );
  }

  const isArchived = provider.status === "archived";
  const KindIcon = provider.kind === "company" ? Building2 : User;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Cabeçalho */}
      <div>
        <Link
          to="/providers"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Voltar para prestadores
        </Link>

        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <KindIcon size={22} />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">
                {provider.display_name}
              </h1>
              {isArchived ? (
                <Badge variant="neutral">Arquivado</Badge>
              ) : (
                <Badge variant="success">Ativo</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {KIND_LABEL[provider.kind]} · Prestador desde{" "}
              {new Date(provider.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      {/* Ações */}
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

      {/* Dados */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-medium text-gray-900">
          Dados do prestador
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <InfoItem
            icon={<IdCard size={14} />}
            label={documentLabel(provider.kind)}
            value={provider.document}
          />
          {provider.kind === "company" && (
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
        </div>
      </Card>

      {/* Notas */}
      {provider.notes && (
        <Card className="p-6">
          <h2 className="mb-3 text-sm font-medium text-gray-900">
            Observações internas
          </h2>
          <p className="whitespace-pre-wrap text-sm text-gray-600">
            {provider.notes}
          </p>
        </Card>
      )}

      {/* Placeholder financeiro */}
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
            <FileText size={16} />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-medium text-gray-900">
              Financeiro
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              As despesas vinculadas a este prestador estarão disponíveis em
              uma próxima versão.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={12} />
            Em breve
          </div>
        </div>
      </Card>

      {/* Modais */}
      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
        title="Arquivar prestador?"
        description={
          <>
            O prestador <strong>{provider.display_name}</strong> não aparecerá
            mais na lista principal, mas continua no sistema. Você pode
            reativá-lo quando quiser.
          </>
        }
        confirmLabel="Arquivar"
        tone="warning"
      />

      <ConfirmDialog
        open={reactivateOpen}
        onClose={() => setReactivateOpen(false)}
        onConfirm={handleReactivate}
        title="Reativar prestador?"
        description={
          <>
            O prestador <strong>{provider.display_name}</strong> voltará para a
            lista principal.
          </>
        }
        confirmLabel="Reativar"
        tone="success"
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
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
        {icon}
        {label}
      </div>
      <p className="text-sm text-gray-900">{value || "—"}</p>
    </div>
  );
}