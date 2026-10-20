import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle, User, Building2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button, Card, Input, Spinner } from "../components/ui";
import { ScheduleEditor } from "../components/agenda/ScheduleEditor";
import { BillingList, type DraftBilling } from "../components/BillingList";
import { useProvider } from "../hooks/useProvider";
import { useProviderScheduleSource } from "../hooks/useProviderScheduleSource";
import { useProviderBillings } from "../hooks/useProviderBillings";
import { useOccupiedSlots } from "../hooks/useOccupiedSlots";
import { toTitleCase } from "../lib/text";
import { toDateString } from "../lib/agenda-date";
import {
  maskCPF,
  maskCNPJ,
  maskPhone,
  maskCurrencyBRL,
  parseCurrencyToCents,
  centsToCurrencyBRL,
  isValidCPF,
  isValidCNPJ,
  isValidPhoneBR,
} from "../lib/masks";
import { validateRecurrence } from "../lib/recurrence";
import type { ProviderKind, RecurrenceType, ScheduleInput } from "../types";

type FormState = {
  kind: ProviderKind;
  display_name: string;
  legal_name: string;
  document: string;
  email: string;
  phone: string;
  notes: string;
  session_price: string;
};

const INITIAL_FORM: FormState = {
  kind: "person",
  display_name: "",
  legal_name: "",
  document: "",
  email: "",
  phone: "",
  notes: "",
  session_price: "",
};

function schedulesEqual(a: ScheduleInput[], b: ScheduleInput[]): boolean {
  if (a.length !== b.length) return false;
  const key = (s: ScheduleInput) =>
    `${s.weekday}-${s.startTime.slice(0, 5)}-${s.durationMin}-${s.anchorDate ?? ""}`;
  const ka = [...a].map(key).sort().join("|");
  const kb = [...b].map(key).sort().join("|");
  return ka === kb;
}

function recurrenceEqual(
  aType: RecurrenceType,
  aDays: number | null,
  bType: RecurrenceType,
  bDays: number | null
): boolean {
  return aType === bType && aDays === bDays;
}

export function ProviderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { provider, loading: loadingProvider } = useProvider(id);
  const {
    schedules: sourcedSchedules,
    source,
    recurrenceType: sourcedRecurrenceType,
    recurrenceDays: sourcedRecurrenceDays,
    loading: loadingSchedules,
  } = useProviderScheduleSource(id);

  const {
    billings: existingBillings,
    saveBilling,
    archiveBilling,
    loading: loadingBillings,
  } = useProviderBillings(id);

  const { slots: occupiedSlots } = useOccupiedSlots({
    excludeProviderId: id,
  });

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [personDocType, setPersonDocType] = useState<"cpf" | "cnpj">("cpf");

  const [schedules, setSchedules] = useState<ScheduleInput[]>([]);
  const [initialSchedules, setInitialSchedules] = useState<ScheduleInput[]>([]);

  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("weekly");
  const [recurrenceDays, setRecurrenceDays] = useState<number | null>(null);
  const [initialRecurrenceType, setInitialRecurrenceType] = useState<RecurrenceType>("weekly");
  const [initialRecurrenceDays, setInitialRecurrenceDays] = useState<number | null>(null);

  const [draftBillings, setDraftBillings] = useState<DraftBilling[]>([]);

  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [hasScheduleConflict, setHasScheduleConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (provider) {
      const docDigits = provider.document?.replace(/\D/g, "") ?? "";
      if (provider.kind === "person" && docDigits.length === 14) {
        setPersonDocType("cnpj");
      }
      setForm({
        kind: provider.kind,
        display_name: provider.display_name ?? "",
        legal_name: provider.legal_name ?? "",
        document: provider.document ?? "",
        email: provider.email ?? "",
        phone: provider.phone ?? "",
        notes: provider.notes ?? "",
        session_price: centsToCurrencyBRL(provider.session_price_cents),
      });
    }
  }, [provider]);

  useEffect(() => {
    if (!loadingSchedules) {
      setSchedules(sourcedSchedules);
      setInitialSchedules((prev) => (prev.length === 0 ? sourcedSchedules : prev));

      setRecurrenceType(sourcedRecurrenceType);
      setRecurrenceDays(sourcedRecurrenceDays);
      setInitialRecurrenceType((prev) =>
        prev === "weekly" && sourcedRecurrenceType !== "weekly" ? sourcedRecurrenceType : prev
      );
      setInitialRecurrenceDays((prev) =>
        prev === null && sourcedRecurrenceDays !== null ? sourcedRecurrenceDays : prev
      );
    }
  }, [loadingSchedules, sourcedSchedules, sourcedRecurrenceType, sourcedRecurrenceDays]);

  useEffect(() => {
    if (isEdit && existingBillings) {
      setDraftBillings(existingBillings);
    }
  }, [isEdit, existingBillings]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "kind" && value !== prev.kind) {
        next.document = "";
        if (value === "company") next.session_price = "";
        if (value === "person") setDraftBillings([]); // limpa os vencimentos ao trocar pra pessoa
      }
      return next;
    });
  }

  function handleRecurrenceChange(nextType: RecurrenceType, nextDays: number | null) {
    setRecurrenceType(nextType);
    setRecurrenceDays(nextDays);
  }

  async function handleRemoveBilling(id: string, index: number) {
    if (!confirm("Remover este vencimento?")) return;

    // 1. Remove da memória imediatamente
    setDraftBillings((prev) => prev.filter((_, i) => i !== index));

    // 2. Se tem ID (já foi salvo no banco), arquiva lá também
    if (id) {
      try {
        await archiveBilling(id);
      } catch (err) {
        alert("Erro ao remover do banco: " + (err instanceof Error ? err.message : ""));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setScheduleError(null);

    if (!form.display_name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    if (form.kind === "person") {
      const isCnpj = personDocType === "cnpj";
      if (form.document && isCnpj && !isValidCNPJ(form.document)) {
        setError("CNPJ inválido.");
        return;
      }
      if (form.document && !isCnpj && !isValidCPF(form.document)) {
        setError("CPF inválido.");
        return;
      }
    }

    if (form.kind === "company" && form.document && !isValidCNPJ(form.document)) {
      setError("CNPJ inválido.");
      return;
    }

    if (form.phone && !isValidPhoneBR(form.phone)) {
      setError("Telefone inválido. Use DDD + número.");
      return;
    }

    if (hasScheduleConflict) {
      setScheduleError("Resolva os horários em conflito antes de salvar.");
      return;
    }

    const recurrenceErr = validateRecurrence(recurrenceType, recurrenceDays);
    if (recurrenceErr) {
      setScheduleError(recurrenceErr);
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
      session_price_cents:
        form.kind === "person" ? parseCurrencyToCents(form.session_price) : null,
    };

    const schedulesChanged = !schedulesEqual(schedules, initialSchedules);
    const recurrenceChanged = !recurrenceEqual(
      recurrenceType,
      recurrenceDays,
      initialRecurrenceType,
      initialRecurrenceDays
    );

    const shouldSyncSchedules =
      form.kind === "person" &&
      schedules.length > 0 &&
      (isEdit ? schedulesChanged || recurrenceChanged : true);

    if (isEdit) {
      const { error: updateErr } = await supabase
        .from("providers")
        .update(payload)
        .eq("id", id);

      if (updateErr) {
        setError(updateErr.message);
        setSaving(false);
        return;
      }

      if (shouldSyncSchedules) {
        const { error: scheduleErr } = await supabase.rpc("set_provider_schedules", {
          p_provider_id: id,
          p_schedules: schedules,
          p_recurrence_type: recurrenceType,
          p_recurrence_days: recurrenceType === "custom_days" ? recurrenceDays : null,
        });

        if (scheduleErr) {
          setScheduleError(scheduleErr.message);
          setSaving(false);
          return;
        }
      }

      if (form.kind === "company") {
        try {
          for (const b of draftBillings) {
            await saveBilling({
              id: b.id,
              provider_id: id!,
              description: b.description,
              amount_cents: b.amount_cents,
              due_day: b.due_day,
              due_month: b.due_month ?? null,
              frequency: b.frequency,
              // Preserva starts_on original; só usa hoje se for billing novo
              starts_on: b.starts_on ?? toDateString(new Date()),
            });
          }
        } catch (billErr) {
          setError(billErr instanceof Error ? billErr.message : "Erro ao salvar vencimentos.");
          setSaving(false);
          return;
        }
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

      const { data, error: insertErr } = await supabase
        .from("providers")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();

      if (insertErr || !data) {
        setError(insertErr?.message ?? "Erro ao criar prestador.");
        setSaving(false);
        return;
      }

      if (shouldSyncSchedules) {
        const { error: scheduleErr } = await supabase.rpc("set_provider_schedules", {
          p_provider_id: data.id,
          p_schedules: schedules,
          p_recurrence_type: recurrenceType,
          p_recurrence_days: recurrenceType === "custom_days" ? recurrenceDays : null,
        });

        if (scheduleErr) {
          setScheduleError(scheduleErr.message);
          setSaving(false);
          return;
        }
      }

      if (form.kind === "company") {
        try {
          for (const b of draftBillings) {
            await saveBilling({
              provider_id: data.id,
              description: b.description,
              amount_cents: b.amount_cents,
              due_day: b.due_day,
              due_month: b.due_month ?? null,
              frequency: b.frequency,
              starts_on: b.starts_on ?? toDateString(new Date()),
            });
          }
        } catch (billErr) {
          setError(billErr instanceof Error ? billErr.message : "Erro ao salvar vencimentos.");
          setSaving(false);
          return;
        }
      }

      navigate(`/providers/${data.id}`);
    }
  }

  if (isEdit && (loadingProvider || loadingSchedules || loadingBillings)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to={isEdit ? `/providers/${id}` : "/providers"}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft size={14} />
          {isEdit ? "Voltar para o prestador" : "Voltar para prestadores"}
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
          {isEdit ? "Editar prestador" : "Novo prestador"}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Prestadores de serviço (pessoa) ou instituições (empresa) com quem
          você tem relação.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo */}
        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
            Tipo
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => update("kind", "person")}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${form.kind === "person"
                ? "border-brand-300 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-950/30"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                }`}
            >
              <User
                size={20}
                className={
                  form.kind === "person"
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-gray-400 dark:text-slate-500"
                }
              />
              <div>
                <p className="text-sm font-medium">Profissional</p>
                <p className="text-xs text-gray-500">Supervisor, psicólogo, etc.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => update("kind", "company")}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${form.kind === "company"
                ? "border-brand-300 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-950/30"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                }`}
            >
              <Building2
                size={20}
                className={
                  form.kind === "company"
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-gray-400 dark:text-slate-500"
                }
              />
              <div>
                <p className="text-sm font-medium">Empresa</p>
                <p className="text-xs text-gray-500">Curso, aluguel, plataforma.</p>
              </div>
            </button>
          </div>
        </Card>

        {/* Dados */}
        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
            Dados do prestador
          </h2>

          <Input
            label="Nome de exibição"
            required
            value={form.display_name}
            onChange={(e) => update("display_name", e.target.value)}
            placeholder={form.kind === "person" ? "Ex: Wlad" : "Ex: Escuta Social Psi"}
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
            <div>
              {/* Mini-seletor CPF/CNPJ para pessoa */}
              {form.kind === "person" ? (
                <div className="mb-2 flex h-[22px] items-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPersonDocType("cpf");
                      update("document", "");
                    }}
                    className={
                      personDocType === "cpf"
                        ? "font-medium text-brand-600"
                        : "text-gray-500"
                    }
                  >
                    CPF
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPersonDocType("cnpj");
                      update("document", "");
                    }}
                    className={
                      personDocType === "cnpj"
                        ? "font-medium text-brand-600"
                        : "text-gray-500"
                    }
                  >
                    CNPJ
                  </button>
                </div>
              ) : (
                <div className="mb-2 h-[22px]" />
              )}

              <Input
                label={
                  form.kind === "company" || personDocType === "cnpj"
                    ? "CNPJ"
                    : "CPF"
                }
                inputMode="numeric"
                value={form.document}
                onChange={(e) => {
                  const isCnpj = form.kind === "company" || personDocType === "cnpj";
                  update(
                    "document",
                    isCnpj ? maskCNPJ(e.target.value) : maskCPF(e.target.value)
                  );
                }}
                placeholder={
                  form.kind === "company" || personDocType === "cnpj"
                    ? "00.000.000/0000-00"
                    : "000.000.000-00"
                }
              />
            </div>

            <div>
              {/* Espaçador invisível para alinhar o Telefone com o CPF */}
              <div className="mb-2 h-[22px]" />
              <Input
                label="Telefone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => update("phone", maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="contato@exemplo.com"
          />
        </Card>

        {/* Financeiro */}
        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
            Financeiro
          </h2>

          {form.kind === "person" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Valor da sessão
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.session_price}
                  onChange={(e) =>
                    update("session_price", maskCurrencyBRL(e.target.value))
                  }
                  placeholder="0,00"
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Valor pago por sessão a este prestador.
              </p>
            </div>
          )}

          {form.kind === "company" && (
            <div className="pt-2">
              <BillingList
                billings={draftBillings}
                onChange={setDraftBillings}
                onRemove={handleRemoveBilling}
              />
            </div>
          )}
        </Card>

        {/* Horários (só pessoa física) */}
        {form.kind === "person" && (
          <Card className="space-y-4 p-6">
            <ScheduleEditor
              value={schedules}
              onChange={setSchedules}
              disabledSlots={occupiedSlots}
              error={scheduleError}
              hint={
                source === "google"
                  ? "Estes horários vieram do Google Calendar. Você pode ajustá-los."
                  : "Estes horários gerarão agendamentos recorrentes (compromisso pessoal). Horários já ocupados aparecem em âmbar."
              }
              onConflictChange={setHasScheduleConflict}
              title="Horários do prestador"
              recurrenceType={recurrenceType}
              recurrenceDays={recurrenceDays}
              onRecurrenceChange={handleRecurrenceChange}
            />
          </Card>
        )}

        {/* Notas */}
        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
            Observações internas
          </h2>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={4}
            placeholder="Anotações administrativas sobre este prestador"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </Card>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
            />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pb-12 sm:pb-4">
          <Link to={isEdit ? `/providers/${id}` : "/providers"}>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving || hasScheduleConflict}>
            <Save size={16} />
            {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar prestador"}
          </Button>
        </div>
      </form>
    </div>
  );
}