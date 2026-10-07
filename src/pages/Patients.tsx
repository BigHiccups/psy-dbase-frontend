import { useState } from "react";
import { usePatients } from "../hooks/usePatients";
import { InvitePatientModal } from "../components/InvitePatientModal";


export function Patients() {
  const { patients, loading, error, reload } = usePatients();
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Pacientes</h1>
          <button
            onClick={() => setInviteOpen(true)}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Convidar paciente
          </button>
        </div>

        {loading && <p className="text-gray-500">Carregando...</p>}
        {error && <p className="text-red-600">Erro: {error}</p>}

        {!loading && !error && patients.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-gray-500">
              Nenhum paciente cadastrado ainda.
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Clique em "Convidar paciente" para enviar o formulário.
            </p>
          </div>
        )}

        {!loading && patients.length > 0 && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.full_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {inviteOpen && (
        <InvitePatientModal
          onClose={() => setInviteOpen(false)}
          onSuccess={() => {
            setInviteOpen(false);
            reload();
          }}
        />
      )}
    </div>
  );
}