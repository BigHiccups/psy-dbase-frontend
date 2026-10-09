import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Building2, User } from "lucide-react";
import { useProviders, type ProviderFilter } from "../hooks/useProviders";
import { Button, Badge, EmptyState, Spinner } from "../components/ui";
import type { ProviderKind } from "../types";

const KIND_LABEL: Record<ProviderKind, string> = {
  person: "Pessoa física",
  company: "Empresa",
};

const FILTERS: { value: ProviderFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "person", label: "Pessoas" },
  { value: "company", label: "Empresas" },
  { value: "archived", label: "Arquivados" },
];

export function Providers() {
  const [filter, setFilter] = useState<ProviderFilter>("all");
  const { providers, loading, error } = useProviders(filter);

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Prestadores
          </h1>
          <p className="text-sm text-gray-500">
            Prestadores de serviço e instituições com quem você tem relação
            financeira.
          </p>
        </div>

        <Link to="/providers/new">
          <Button>
            <Plus size={16} />
            Novo prestador
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              filter === f.value
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Spinner size={16} />
          Carregando prestadores...
        </div>
      )}

      {error && <p className="text-sm text-red-600">Erro: {error}</p>}

      {!loading && !error && providers.length === 0 && (
        <EmptyState
          icon={<Building2 size={20} />}
          title={
            filter === "archived"
              ? "Nenhum prestador arquivado"
              : "Nenhum prestador cadastrado ainda"
          }
          description={
            filter === "archived"
              ? "Prestadores arquivados aparecem aqui."
              : "Cadastre prestadores para vincular despesas do consultório."
          }
        />
      )}

      {!loading && providers.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="hidden px-4 py-3 sm:table-cell">Tipo</th>
                <th className="hidden px-4 py-3 sm:table-cell">Telefone</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {providers.map((p) => {
                const isArchived = p.status === "archived";
                return (
                  <tr
                    key={p.id}
                    className={`transition hover:bg-gray-50 ${
                      isArchived ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            p.kind === "company"
                              ? "text-gray-400"
                              : "text-gray-400"
                          }
                        >
                          {p.kind === "company" ? (
                            <Building2 size={14} />
                          ) : (
                            <User size={14} />
                          )}
                        </span>
                        <Link
                          to={`/providers/${p.id}`}
                          className="font-medium text-gray-900 hover:text-brand-700 hover:underline"
                        >
                          {p.display_name}
                        </Link>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                      {KIND_LABEL[p.kind]}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                      {p.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {isArchived ? (
                        <Badge variant="neutral">Arquivado</Badge>
                      ) : (
                        <Badge variant="success">Ativo</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}