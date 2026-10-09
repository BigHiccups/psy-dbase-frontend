import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle, User, Building2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button, Card, Input, Spinner } from "../components/ui";
import { useProvider } from "../hooks/useProvider";
import { toTitleCase } from "../lib/text";
import {
  maskCPF,
  maskCNPJ,
  maskPhone,
  isValidCPF,
  isValidCNPJ,
  isValidPhoneBR,
} from "../lib/masks";
import type { ProviderKind } from "../types";

type FormState = {
  kind: ProviderKind;
  display_name: string;
  legal_name: string;
  document: string;
  email: string;
  phone: string;
  notes: string;
};

const INITIAL_FORM: FormState = {
  kind: "person",
  display_name: "",
  legal_name: "",
  document: "",
  email: "",
  phone: "",
  notes: "",
};

export function ProviderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { provider, loading: loadingProvider } = useProvider(id);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (provider) {
      setForm({
        kind: provider.kind,
        display_name: provider.display_name ?? "",
        legal_name: provider.legal_name ?? "",
        document: provider.document ?? "",
        email: provider.email ?? "",
        phone: provider.phone ?? "",
        notes: provider.notes ?? "",
      });
    }
  }, [provider]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Ao trocar o tipo, limpa o documento (máscara é diferente)
      if (key === "kind" && value !== prev.kind) {
        next.document = "";
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.display_name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    if (form.kind === "person" && form.document) {
      if (!isValidCPF(form.document)) {
        setError("CPF inválido.");
        return;
      }
    }
    if (form.kind === "company" && form.document) {
      if (!isValidCNPJ(form.document)) {
        setError("CNPJ inválido.");
        return;
      }
    }
    if (form.phone && !isValidPhoneBR(form.phone)) {
      setError("Telefone inválido. Use DDD + número.");
      return;
    }

    setSaving(true);

    const payload = {
      kind: form.kind,
      display_name: toTitleCase(form.display_name),
      legal_name: form.legal_name.trim() || null,
      document: form.document.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone || null,
      notes: form.notes.trim() || null,
    };

    if (isEdit) {
      const { error } = await supabase
        .from("providers")
        .update(payload)
        .eq("id", id);

      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }

      navigate(`/providers/${id}`);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Sessão expirada. Faça login novamente.");
        setSaving(false);
        return;
      }

      const { data, error } = await supabase
        .from("providers")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();

      if (error || !data) {
        setError(error?.message ?? "Erro ao criar prestador.");
        setSaving(false);
        return;
      }

      navigate(`/providers/${data.id}`);
    }
  }

  if (isEdit && loadingProvider) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Cabeçalho */}
      <div>
        <Link
          to={isEdit ? `/providers/${id}` : "/providers"}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          {isEdit ? "Voltar para o prestador" : "Voltar para prestadores"}
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEdit ? "Editar prestador" : "Novo prestador"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Prestadores de serviço (pessoa) ou instituições (empresa) com quem
          você tem relação financeira.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo */}
        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-medium text-gray-900">Tipo</h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => update("kind", "person")}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                form.kind === "person"
                  ? "border-brand-300 bg-brand-50/50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <User
                size={20}
                className={
                  form.kind === "person" ? "text-brand-600" : "text-gray-400"
                }
              />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Pessoa física
                </p>
                <p className="text-xs text-gray-500">
                  Psicólogo, supervisor, etc.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => update("kind", "company")}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                form.kind === "company"
                  ? "border-brand-300 bg-brand-50/50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <Building2
                size={20}
                className={
                  form.kind === "company"
                    ? "text-brand-600"
                    : "text-gray-400"
                }
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Empresa</p>
                <p className="text-xs text-gray-500">
                  Curso, plataforma, aluguel, etc.
                </p>
              </div>
            </button>
          </div>
        </Card>

        {/* Dados */}
        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-medium text-gray-900">
            Dados do prestador
          </h2>

          <Input
            label="Nome de exibição"
            required
            value={form.display_name}
            onChange={(e) => update("display_name", e.target.value)}
            placeholder={
              form.kind === "person" ? "Ex: Wlad" : "Ex: Escuta Social Psi"
            }
          />

          {form.kind === "company" && (
            <Input
              label="Razão social"
              value={form.legal_name}
              onChange={(e) => update("legal_name", e.target.value)}
              placeholder="Nome jurídico completo"
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={form.kind === "company" ? "CNPJ" : "CPF"}
              inputMode="numeric"
              value={form.document}
              onChange={(e) =>
                update(
                  "document",
                  form.kind === "company"
                    ? maskCNPJ(e.target.value)
                    : maskCPF(e.target.value)
                )
              }
              placeholder={
                form.kind === "company"
                  ? "00.000.000/0000-00"
                  : "000.000.000-00"
              }
            />

            <Input
              label="Telefone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => update("phone", maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
            />
          </div>

          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="contato@exemplo.com"
          />
        </Card>

        {/* Notas */}
        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-medium text-gray-900">
            Observações internas
          </h2>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={4}
            placeholder="Anotações administrativas sobre este prestador"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </Card>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-2">
          <Link to={isEdit ? `/providers/${id}` : "/providers"}>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save size={16} />
            {saving
              ? "Salvando..."
              : isEdit
                ? "Salvar alterações"
                : "Criar prestador"}
          </Button>
        </div>
      </form>
    </div>
  );
}