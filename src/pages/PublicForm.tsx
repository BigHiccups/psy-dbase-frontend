import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle2,
  CalendarClock,
  ShieldCheck,
  Lock,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { weekdayLong } from "../lib/weekdays";
import { toTitleCase } from "../lib/text";
import { maskCPF, maskPhone } from "../lib/masks";
import type { InviteCheck } from "../types";

type FormState = {
  full_name: string;
  cpf: string;
  city: string;
  birth_date: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  consent_accepted: boolean;
  place_acknowledged: boolean;
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
  place_acknowledged: false,
};

export function PublicForm() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<InviteCheck | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    supabase
      .rpc("get_invite_by_token", { p_token: token })
      .single()
      .then(({ data, error }) => {
        if (error) {
          setInvite({
            valid: false,
            reason: "Erro ao validar convite.",
            patient_name_hint: null,
            schedules: [],
          });
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
      p_full_name: toTitleCase(form.full_name),
      p_cpf: form.cpf || null,
      p_city: form.city.trim() || null,
      p_birth_date: form.birth_date || null,
      p_phone: form.phone || null,
      p_emergency_contact_name: toTitleCase(form.emergency_contact_name),
      p_emergency_contact_phone: form.emergency_contact_phone || null,
      p_consent_accepted: form.consent_accepted,
      p_place_acknowledged: form.place_acknowledged,
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
      <CenteredCard>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600 dark:border-slate-700 dark:border-t-brand-400" />
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Validando convite...
          </p>
        </div>
      </CenteredCard>
    );
  }

  if (!invite?.valid) {
    return (
      <CenteredCard>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
          <AlertCircle size={24} />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
          Convite indisponível
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
          {invite?.reason}
        </p>
        <p className="mt-4 text-xs text-gray-400 dark:text-slate-500">
          Se você acredita que isso é um erro, entre em contato com o
          psicólogo responsável.
        </p>
      </CenteredCard>
    );
  }

  if (submitted) {
    return (
      <CenteredCard>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400">
          <CheckCircle2 size={28} />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
          Cadastro enviado!
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
          Seus dados foram recebidos com sucesso. O psicólogo vai revisar e
          entrar em contato para confirmar o início do atendimento.
        </p>
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-left dark:bg-brand-950/40">
          <Lock
            size={14}
            className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-300"
          />
          <p className="text-xs text-brand-900 dark:text-brand-200">
            Seus dados são confidenciais e serão tratados conforme a LGPD e o
            código de ética profissional.
          </p>
        </div>
        <p className="mt-6 text-xs text-gray-400 dark:text-slate-500">
          Você já pode fechar esta página.
        </p>
      </CenteredCard>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-gray-100 p-6 dark:border-slate-800">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
              Formulário de cadastro
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {invite.patient_name_hint
                ? `Olá, ${invite.patient_name_hint}! Preencha os campos abaixo para concluir seu cadastro.`
                : "Preencha os campos abaixo para concluir seu cadastro."}
            </p>
          </div>

          {invite.schedules.length > 0 && (
            <div className="bg-brand-50/60 p-6 dark:bg-brand-950/30">
              <div className="mb-3 flex items-center gap-2 text-brand-700 dark:text-brand-300">
                <CalendarClock size={16} />
                <p className="text-sm font-medium">Sessões combinadas</p>
              </div>
              <ul className="space-y-2">
                {invite.schedules.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm dark:bg-slate-900"
                  >
                    <span className="font-medium text-gray-900 dark:text-slate-100">
                      {weekdayLong(s.weekday)}
                    </span>
                    <span className="text-gray-600 dark:text-slate-400">
                      {s.startTime} · {s.durationMin} min
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-gray-100 p-6 dark:border-slate-800">
            <h2 className="text-base font-medium text-gray-900 dark:text-slate-100">
              Seus dados
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Todos os campos marcados com{" "}
              <span className="text-red-500">*</span> são obrigatórios.
            </p>
          </div>

          <div className="space-y-5 p-6">
            <Field label="Nome completo" required>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="CPF">
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.cpf}
                  onChange={(e) => update("cpf", maskCPF(e.target.value))}
                  className={inputClass}
                  placeholder="000.000.000-00"
                />
              </Field>

              <Field label="Data de nascimento" required>
                <input
                  type="date"
                  required
                  value={form.birth_date}
                  onChange={(e) => update("birth_date", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Cidade" required>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Telefone" required>
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  value={form.phone}
                  onChange={(e) => update("phone", maskPhone(e.target.value))}
                  className={inputClass}
                  placeholder="(00) 00000-0000"
                />
              </Field>
            </div>

            <div className="border-t border-gray-100 pt-5 dark:border-slate-800">
              <p className="mb-3 text-sm font-medium text-gray-900 dark:text-slate-100">
                Contato de urgência
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nome">
                  <input
                    type="text"
                    value={form.emergency_contact_name}
                    onChange={(e) =>
                      update("emergency_contact_name", e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Telefone">
                  <input
                    type="tel"
                    inputMode="tel"
                    value={form.emergency_contact_phone}
                    onChange={(e) =>
                      update(
                        "emergency_contact_phone",
                        maskPhone(e.target.value)
                      )
                    }
                    className={inputClass}
                    placeholder="(00) 00000-0000"
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-5 dark:border-slate-800">
              <CheckCard
                icon={<ShieldCheck size={16} />}
                checked={form.consent_accepted}
                onChange={(v) => update("consent_accepted", v)}
                title="Termo de confidencialidade"
                description="Li e concordo com o termo de confidencialidade. Meus dados serão tratados conforme a LGPD e utilizados apenas para fins de atendimento psicológico."
                required
              />

              <CheckCard
                icon={<Lock size={16} />}
                checked={form.place_acknowledged}
                onChange={(v) => update("place_acknowledged", v)}
                title="Orientações sobre o atendimento"
                description="Estou ciente de que o atendimento deve ocorrer em um ambiente tranquilo, silencioso e privado, livre de interrupções, para garantir a qualidade e o sigilo da sessão."
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 bg-gray-50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900"
            >
              {submitting ? "Enviando..." : "Enviar cadastro"}
            </button>
            <p className="mt-3 text-center text-xs text-gray-400 dark:text-slate-500">
              Seus dados são confidenciais e protegidos.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";

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
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

function CheckCard({
  icon,
  checked,
  onChange,
  title,
  description,
  required,
}: {
  icon: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  description: string;
  required?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
        checked
          ? "border-brand-300 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-950/30"
          : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
        className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-brand-600"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className={
              checked
                ? "text-brand-600 dark:text-brand-400"
                : "text-gray-400 dark:text-slate-500"
            }
          >
            {icon}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
            {title}
            {required && <span className="ml-1 text-red-500">*</span>}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </label>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {children}
      </div>
    </div>
  );
}