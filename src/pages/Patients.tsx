import { useState } from "react";
import { UserPlus, Users, Inbox } from "lucide-react";
import { usePatients } from "../hooks/usePatients";
import { useSubmissions } from "../hooks/useSubmissions";
import { InvitePatientModal } from "../components/InvitePatientModal";
import { SubmissionCard } from "../components/SubmissionCard";
import { Button, Badge, EmptyState, Spinner } from "../components/ui";

export function Patients() {
  const patients = usePatients();
  const submissions = useSubmissions();
  const [inviteOpen, setInviteOpen] = useState(false);

  function handleSubmissionDone() {
    submissions.reload();
    patients.reload();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500">
            Gerencie seus pacientes e convites pendentes.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus size={16} />
          Convidar paciente
        </Button>
      </div>

      {/* Submissões pendentes */}
      {(submissions.loading || submissions.submissions.length > 0) && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Inbox size={16} className="text-amber-600" />
            <h2 className="text-sm font-medium text-gray-900">
              Submissões pendentes
            </h2>
            {submissions.submissions.length > 0 && (
              <Badge variant="warning">
                {submissions.submissions.length}
              </Badge>
            )}
          </div>

          {submissions.loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Spinner size={16} />
              Carregando submissões...
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.submissions.map((s) => (
                <SubmissionCard
                  key={s.id}
                  submission={s}
                  onApproved={handleSubmissionDone}
                  onRejected={handleSubmissionDone}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Lista de pacientes */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-gray-900">
          Pacientes ativos
        </h2>

        {patients.loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Spinner size={16} />
            Carregando pacientes...
          </div>
        )}

        {patients.error && (
          <p className="text-sm text-red-600">Erro: {patients.error}</p>
        )}

        {!patients.loading && !patients.error && patients.patients.length === 0 && (
          <EmptyState
            icon={<Users size={20} />}
            title="Nenhum paciente cadastrado ainda"
            description='Clique em "Convidar paciente" para enviar o formulário de cadastro.'
          />
        )}

        {!patients.loading && patients.patients.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.patients.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.full_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="success">{p.status}</Badge>
                    </td>
                  </tr>
                ))}
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
            handleSubmissionDone();
          }}
        />
      )}
    </div>
  );
} 