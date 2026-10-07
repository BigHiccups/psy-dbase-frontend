import { useState } from "react";
import { apiFetch } from "../lib/api";
import type { InviteResponse } from "../types";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export function InvitePatientModal({ onClose, onSuccess }: Props) {
  const [patientNameHint, setPatientNameHint] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<InviteResponse>("/invites", {
        method: "POST",
        body: JSON.stringify({ patientNameHint, phone }),
      });
      setResult(data);
      // Abre o WhatsApp em nova aba com a mensagem pré-preenchida
      window.open(data.whatsappUrl, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {!result ? (
          <>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Convidar paciente
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Nome do paciente (opcional)
                </label>
                <input
                  type="text"
                  value={patientNameHint}
                  onChange={(e) => setPatientNameHint(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                  placeholder="Ex: Maria Silva"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Telefone (WhatsApp)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                  placeholder="(11) 99999-9999"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? "Gerando..." : "Gerar convite e enviar"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              Convite gerado!
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              O WhatsApp foi aberto em nova aba com a mensagem pronta. Se não
              abriu, copie o link abaixo.
            </p>

            <div className="mb-4 rounded-lg bg-gray-50 p-3 text-xs break-all text-gray-600">
              {result.shortUrl}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.shortUrl);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Copiar link
              </button>
              <button
                onClick={onSuccess}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Concluir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}