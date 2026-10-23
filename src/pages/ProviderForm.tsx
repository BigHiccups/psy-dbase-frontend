import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle, User, Building2, Plus, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button, Card, Input, Spinner, AlertDialog } from "../components/ui";
import { ServiceScheduleField } from "../components/agenda/ServiceScheduleField";
import { BillingList, type DraftBilling } from "../components/BillingList";
import { useProvider } from "../hooks/useProvider";
import { useProviderScheduleSource } from "../hooks/useProviderScheduleSource";
import { useProviderBillings } from "../hooks/useProviderBillings";
import { toTitleCase } from "../lib/text";
import { toDateString } from "../lib/agenda-date";
import { maskPhone } from "../lib/masks";
import type { ProviderKind, RecurrenceType, ScheduleInput, PaymentFormat } from "../types";

type FormState = {
  kind: ProviderKind;
  display_name: string;
  legal_name: string;
  document: string;
  email: string;
  phone: string;
  notes: string;
  payment_format: PaymentFormat;
  default_payment_method: string;
  session_number_start: string;
};

type ServiceBlock = {
  id: string;
  schedule: ScheduleInput;
  recurrenceType: RecurrenceType;
  recurrenceDays: number | null;
  billings: DraftBilling[];
};

const INITIAL_FORM: FormState = {
  kind: "person", display_name: "", legal_name: "", document: "", email: "", phone: "", notes: "",
  payment_format: "avulso", default_payment_method: "", session_number_start: "0",
};

const DEFAULT_SCHEDULE: ScheduleInput = {
  weekday: 1, // Segunda
  startTime: "14:00",
  durationMin: 50,
  anchorDate: toDateString(new Date()), // Inicia com a data de hoje por padrão
};

export function ProviderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { provider, loading: loadingProvider } = useProvider(id);
  const { schedules: sourcedSchedules, loading: loadingSchedules } = useProviderScheduleSource(id);
  const { billings: existingBillings, saveBilling, loading: loadingBillings } = useProviderBillings(id);

  // Controle para não sobrescrever o que o usuário está digitando
  const isInitialized = useRef(false);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [personDocType, setPersonDocType] = useState<"cpf" | "cnpj">("cpf");

  const [services, setServices] = useState<ServiceBlock[]>([
    { id: crypto.randomUUID(), schedule: DEFAULT_SCHEDULE, recurrenceType: "weekly", recurrenceDays: null, billings: [] }
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{ title: string; message: string; tone: "info" | "error" | "success" } | null>(null);

  // 1. Carrega os dados básicos do prestador
  useEffect(() => {
    if (provider) {
      const docDigits = provider.document?.replace(/\D/g, "") ?? "";
      if (provider.kind === "person" && docDigits.length === 14) setPersonDocType("cnpj");
      setForm({
        kind: provider.kind, display_name: provider.display_name ?? "", legal_name: provider.legal_name ?? "",
        document: provider.document ?? "", email: provider.email ?? "", phone: provider.phone ?? "", notes: provider.notes ?? "",
        payment_format: provider.payment_format ?? "avulso", default_payment_method: provider.default_payment_method ?? "",
        session_number_start: provider.session_number_start?.toString() ?? "0",
      });
    }
  }, [provider]);

  // 2. Carrega os serviços (horários + faturamentos)
  useEffect(() => {
    if (!loadingSchedules && !loadingBillings && isEdit && !isInitialized.current) {
      isInitialized.current = true;

      const numSchedules = sourcedSchedules.length;
      const numBillings = existingBillings.length;

      // Descobre quantos blocos precisamos criar (o maior entre a quantidade de horários e faturamentos)
      const maxBlocks = Math.max(numSchedules, numBillings, 1);

      const newServices: ServiceBlock[] = [];

      for (let i = 0; i < maxBlocks; i++) {
        const schedule = sourcedSchedules[i] || DEFAULT_SCHEDULE;
        const billing = existingBillings[i];

        newServices.push({
          id: crypto.randomUUID(),
          schedule: { ...schedule },
          recurrenceType: schedule.recurrenceType || "weekly",
          recurrenceDays: schedule.recurrenceDays || null,
          billings: billing ? [billing] : []
        });
      }

      setServices(newServices);
    }
  }, [loadingSchedules, loadingBillings, isEdit, sourcedSchedules, existingBillings]);

  function updateService(id: string, field: keyof ServiceBlock, value: any) {
    setServices((prev) => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  function addService() {
    setServices((prev) => [
      ...prev,
      { id: crypto.randomUUID(), schedule: DEFAULT_SCHEDULE, recurrenceType: "weekly", recurrenceDays: null, billings: [] }
    ]);
  }

  function removeService(id: string) {
    if (services.length === 1) return; // Mantém pelo menos 1
    setServices((prev) => prev.filter(s => s.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.display_name.trim()) return setError("Nome é obrigatório.");

    // Junta todos os horários de todos os blocos para salvar no banco
    const allSchedules = services.map(s => ({
      ...s.schedule,
      recurrenceType: s.recurrenceType,
      recurrenceDays: s.recurrenceDays,
      // Pega a descrição do primeiro faturamento do bloco, se existir
      title: s.billings[0]?.description || (s.schedule.startTime ? "Sessão" : "Compromisso"),
      color: s.schedule.color || null,
    }));

    // Junta todos os faturamentos
    const allBillings = services.flatMap(s => s.billings);

    // Para o banco, usamos a recorrência do primeiro bloco como "principal" (a estrutura atual do banco pede isso)
    const mainRecurrence = services[0].recurrenceType;
    const mainRecurrenceDays = services[0].recurrenceDays;

    setSaving(true);
    const firstBilling = allBillings[0];

    const payload = {
      kind: form.kind, display_name: toTitleCase(form.display_name), legal_name: form.legal_name.trim() || null,
      document: form.document.trim() || null, email: form.email.trim() || null, phone: form.phone || null,
      notes: form.notes.trim() || null, session_price_cents: firstBilling ? firstBilling.amount_cents : null,
      payment_format: form.payment_format, default_payment_method: form.default_payment_method || null,
      session_number_start: parseInt(form.session_number_start, 10) || 0,
    };

    const shouldSyncSchedules = allSchedules.length > 0;

    if (isEdit) {
      const { error: updateErr } = await supabase.from("providers").update(payload).eq("id", id);
      if (updateErr) { setError(updateErr.message); setSaving(false); return; }

      if (shouldSyncSchedules) {
        const { error: scheduleErr } = await supabase.rpc("set_provider_schedules", {
          p_provider_id: id, p_schedules: allSchedules, p_recurrence_type: mainRecurrence, p_recurrence_days: mainRecurrenceDays,
        });
        if (scheduleErr) { setError(scheduleErr.message); setSaving(false); return; }
      }

      try {
        for (const b of allBillings) {
          await saveBilling({ id: b.id, provider_id: id!, description: b.description, amount_cents: b.amount_cents, due_day: b.due_day, due_month: null, frequency: "monthly", custom_interval_days: null, starts_on: b.starts_on ?? toDateString(new Date()) });
        }
      } catch (billErr) { setError("Erro ao salvar faturamentos."); setSaving(false); return; }

      navigate(`/providers/${id}`);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Sessão expirada."); setSaving(false); return; }

      const { data, error: insertErr } = await supabase.from("providers").insert({ ...payload, user_id: user.id }).select().single();
      if (insertErr || !data) { setError(insertErr?.message ?? "Erro ao criar prestador."); setSaving(false); return; }

      if (shouldSyncSchedules) {
        await supabase.rpc("set_provider_schedules", {
          p_provider_id: data.id, p_schedules: allSchedules, p_recurrence_type: mainRecurrence, p_recurrence_days: mainRecurrenceDays,
        });
      }

      for (const b of allBillings) {
        await saveBilling({ provider_id: data.id, description: b.description, amount_cents: b.amount_cents, due_day: b.due_day, due_month: null, frequency: "monthly", custom_interval_days: null, starts_on: b.starts_on ?? toDateString(new Date()) });
      }
      navigate(`/providers/${data.id}`);
    }
  }

  if (isEdit && (loadingProvider || loadingSchedules || loadingBillings)) {
    return <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to={isEdit ? `/providers/${id}` : "/providers"} className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100">
          <ArrowLeft size={14} /> {isEdit ? "Voltar para o prestador" : "Voltar para prestadores"}
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">{isEdit ? "Editar prestador" : "Novo prestador"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* BLOCO A - DADOS */}
        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">Dados do prestador</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button type="button" onClick={() => setForm(prev => ({ ...prev, kind: "person" }))} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${form.kind === "person" ? "border-brand-300 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-950/30" : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"}`}>
              <User size={20} className={form.kind === "person" ? "text-brand-600" : "text-gray-400"} />
              <div><p className="text-sm font-medium">Profissional</p><p className="text-xs text-gray-500">Supervisor, psicólogo, etc.</p></div>
            </button>
            <button type="button" onClick={() => setForm(prev => ({ ...prev, kind: "company" }))} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${form.kind === "company" ? "border-brand-300 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-950/30" : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"}`}>
              <Building2 size={20} className={form.kind === "company" ? "text-brand-600" : "text-gray-400"} />
              <div><p className="text-sm font-medium">Empresa</p><p className="text-xs text-gray-500">Curso, aluguel, plataforma.</p></div>
            </button>
          </div>
          <Input label="Nome de exibição" required value={form.display_name} onChange={(e) => setForm(prev => ({ ...prev, display_name: e.target.value }))} />
          {form.kind === "company" && <Input label="Razão social" value={form.legal_name} onChange={(e) => setForm(prev => ({ ...prev, legal_name: e.target.value }))} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={form.kind === "company" || personDocType === "cnpj" ? "CNPJ" : "CPF"} value={form.document} onChange={(e) => setForm(prev => ({ ...prev, document: e.target.value }))} />
            <Input label="Telefone" value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: maskPhone(e.target.value) }))} />
          </div>
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
        </Card>

        {/* BLOCO B - SERVIÇOS */}
        {services.map((service, index) => (
          <Card key={service.id} className="space-y-6 p-6 relative group">
            {services.length > 1 && (
              <button type="button" onClick={() => removeService(service.id)} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded dark:hover:bg-red-950/50">
                <Trash2 size={16} />
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                {index + 1}
              </span>
              <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">Configuração do Serviço</h2>
            </div>

            <div className="pt-2">
              <ServiceScheduleField
                value={service.schedule}
                onChange={(val) => updateService(service.id, "schedule", val)}
                recurrenceType={service.recurrenceType}
                onRecurrenceChange={(type) => updateService(service.id, "recurrenceType", type)}
              />
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
              <BillingList
                billings={service.billings}
                providerData={{ payment_format: form.payment_format, default_payment_method: form.default_payment_method, session_number_start: parseInt(form.session_number_start) || 0 }}
                onChange={(val) => updateService(service.id, "billings", val)}
                onProviderDataChange={(data) => setForm(prev => ({ ...prev, ...data, session_number_start: data.session_number_start.toString(), payment_format: data.payment_format as PaymentFormat }))}
              />
            </div>
          </Card>
        ))}

        <Button type="button" variant="secondary" onClick={addService} className="w-full border-dashed border-2 py-6">
          <Plus size={18} /> Adicionar novo serviço
        </Button>

        {/* BLOCO C - OBSERVAÇÕES */}
        <Card className="space-y-4 p-6 mt-6">
          <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">Observações internas</h2>
          <textarea value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={4} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
        </Card>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pb-12 sm:pb-4 pt-4">
          <Link to={isEdit ? `/providers/${id}` : "/providers"}>
            <Button type="button" variant="secondary">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save size={16} /> {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>

      <AlertDialog open={alertState !== null} onClose={() => setAlertState(null)} title={alertState?.title ?? ""} message={alertState?.message} tone={alertState?.tone ?? "info"} />
    </div>
  );
}