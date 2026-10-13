import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Users, Inbox, Plus } from "lucide-react";
import { usePatients, type PatientFilter } from "../hooks/usePatients";
import { useSubmissions } from "../hooks/useSubmissions";
import { InvitePatientModal } from "../components/InvitePatientModal";
import { SubmissionCard } from "../components/SubmissionCard";
import { Button, Badge, EmptyState, Spinner } from "../components/ui";
import type { PatientStatus } from "../types";
import { centsToCurrencyBRL } from "../lib/masks";

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

const FILTERS: { value: PatientFilter; label: string }[] = [
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Arquivados" },
  { value: "all", label: "Todos" },
];

export function Patients() {
  const [filter, setFilter] = useState<PatientFilter>("active");
  const patients = usePatients(filter);
  const submissions = useSubmissions();
  const [inviteOpen, setInviteOpen] = useState(false);

  function handleReloadAll() {
    patients.reload();
    submissions.reload();
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
            Pacientes
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Gerencie seus pacientes, convites e cadastros.
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/patients/new">
            <Button variant="secondary">
              <Plus size={16} />
              Novo paciente
            </Button>
          </Link>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus size={16} />
            Convidar
          </Button>
        </div>
      </div>

      {/* Submissões pendentes */}
      {(submissions.loading || submissions.submissions.length > 0) && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Inbox size={16} className="text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
              Submissões pendentes
            </h2>
            {submissions.submissions.length > 0 && (
              <Badge variant="warning">
                {submissions.submissions.length}
              </Badge>
            )}
          </div>

          {submissions.loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
              <Spinner size={16} />
              Carregando submissões...
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.submissions.map((s) => (
                <SubmissionCard
                  key={s.id}
                  submission={s}
                  onApproved={handleReloadAll}
                  onRejected={handleReloadAll}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Lista de pacientes */}
      <section>
        {/* Filtros */}
        <div className="mb-4 flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${filter === f.value
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200"
                  : "text-gray-600 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {patients.loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <Spinner size={16} />
            Carregando pacientes...
          </div>
        )}

        {patients.error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Erro: {patients.error}
          </p>
        )}

        {!patients.loading &&
          !patients.error &&
          patients.patients.length === 0 && (
            <EmptyState
              icon={<Users size={20} />}
              title={
                filter === "active"
                  ? "Nenhum paciente ativo"
                  : filter === "inactive"
                    ? "Nenhum paciente arquivado"
                    : "Nenhum paciente cadastrado ainda"
              }
              description={
                filter === "active"
                  ? 'Clique em "Novo paciente" ou "Convidar" para começar.'
                  : filter === "inactive"
                    ? "Pacientes arquivados aparecem aqui."
                    : 'Clique em "Novo paciente" para começar.'
              }
            />
          )}

        {!patients.loading && patients.patients.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Telefone</th>
                  <th className="hidden px-4 py-3 md:table-cell">Valor</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {patients.patients.map((p) => {
                  const isArchived = p.status !== "active";
                  return (
                    <tr
                      key={p.id}
                      className={`transition hover:bg-gray-50 dark:hover:bg-slate-800/50 ${isArchived ? "opacity-60" : ""
                        }`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/patients/${p.id}`}
                          className="font-medium text-gray-900 hover:text-brand-700 hover:underline dark:text-slate-100 dark:hover:text-brand-400"
                        >
                          {p.full_name}
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 text-gray-600 sm:table-cell dark:text-slate-400">
                        {p.phone ?? "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-gray-600 md:table-cell dark:text-slate-400">
                        {p.session_price_cents !== null
                          ? `R$ ${centsToCurrencyBRL(p.session_price_cents)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[p.status]}>
                          {STATUS_LABEL[p.status]}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {inviteOpen && (
        <InvitePatientModal
          onClose={() => setInviteOpen(false)}
          onSuccess={() => {
            setInviteOpen(false);
            handleReloadAll();
          }}
        />
      )}
    </div>
  );
}