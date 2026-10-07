import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

type InviteCheck = {
  valid: boolean;
  reason: string | null;
  patient_name_hint: string | null;
};

type FormState = {
  full_name: string;
  cpf: string;
  city: string;
  birth_date: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  consent_accepted: boolean;
};

const INITIAL_FORM: FormState = {
  full_name: "",
  cpf: "",
  city: "",
  birth_date: "",
  phone: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  consent_accepted: false,
};

export function PublicForm() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<InviteCheck | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Valida o token ao carregar
  useEffect(() => {
    if (!token) return;

    supabase
      .rpc("get_invite_by_token", { p_token: token })
      .single()
      .then(({ data, error }) => {
        if (error) {
          setInvite({ valid: false, reason: "Erro ao validar convite.", patient_name_hint: null });
        } else {
          setInvite(data as InviteCheck);
        }
        setLoadingInvite(false);
      });
  }, [token]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setError(null);

    const { error } = await supabase.rpc("submit_patient_form", {
      p_token: token,
      p_full_name: form.full_name,
      p_cpf: form.cpf || null,
      p_city: form.city || null,
      p_birth_date: form.birth_date || null,
      p_phone: form.phone || null,
      p_emergency_contact_name: form.emergency_contact_name || null,
      p_emergency_contact_phone: form.emergency_contact_phone || null,
      p_consent_accepted: form.consent_accepted,
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (loadingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Validando convite...</p>
      </div>
    );
  }

  if (!invite?.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-md">
          <h1 className="mb-2 text-xl font-semibold text-gray-900">
            Convite indisponível
          </h1>
          <p className="text-sm text-gray-500">{invite?.reason}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-md">
          <h1 className="mb-2 text-xl font-semibold text-gray-900">
            Cadastro enviado!
          </h1>
          <p className="text-sm text-gray-500">
            Seus dados foram recebidos. O psicólogo vai revisar e entrar em
            contato.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">
          Formulário de cadastro
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          {invite.patient_name_hint
            ? `Olá, ${invite.patient_name_hint}! Preencha os campos abaixo.`
            : "Preencha os campos abaixo para concluir seu cadastro."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome completo" required>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </Field>

          <Field label="CPF">
            <input
              type="text"
              value={form.cpf}
              onChange={(e) => update("cpf", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </Field>

          <Field label="Cidade">
            <input
              type="text"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </Field>

          <Field label="Data de nascimento">
            <input
              type="date"
              value={form.birth_date}
              onChange={(e) => update("birth_date", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </Field>

          <Field label="Telefone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </Field>

          <Field label="Contato de urgência — nome">
            <input
              type="text"
              value={form.emergency_contact_name}
              onChange={(e) => update("emergency_contact_name", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </Field>

          <Field label="Contato de urgência — telefone">
            <input
              type="tel"
              value={form.emergency_contact_phone}
              onChange={(e) => update("emergency_contact_phone", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </Field>

          <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <input
              type="checkbox"
              required
              checked={form.consent_accepted}
              onChange={(e) => update("consent_accepted", e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-xs text-gray-600">
              Li e concordo com o <strong>termo de confidencialidade</strong>.
              Meus dados serão tratados conforme a LGPD e utilizados apenas
              para fins de atendimento psicológico.
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Enviar cadastro"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}