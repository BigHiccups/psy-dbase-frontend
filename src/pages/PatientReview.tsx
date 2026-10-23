import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, UserCheck, AlertCircle, Plus, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button, Card, Input, Spinner } from "../components/ui";
import { ServiceScheduleField } from "../components/agenda/ServiceScheduleField";
import { usePatient } from "../hooks/usePatient";
import { usePatientScheduleSource } from "../hooks/usePatientScheduleSource";
import { toTitleCase } from "../lib/text";
import { toDateString } from "../lib/agenda-date";
import {
  maskCPF,
  maskPhone,
  maskCurrencyBRL,
  parseCurrencyToCents,
  centsToCurrencyBRL,
  isValidPhoneBR,
} from "../lib/masks";
import { displayName } from "../lib/patient-display";
import type { RecurrenceType, ScheduleInput, PaymentFormat } from "../types";

type PatientService = {
  id: string;
  title: string;
  sessionPrice: string;
  paymentFormat: PaymentFormat;
  schedule: ScheduleInput;
  recurrenceType: RecurrenceType;
  recurrenceDays: number | null;
};

const DEFAULT_SCHEDULE: ScheduleInput = {
  weekday: 1,
  startTime: "14:00",
  durationMin: 50,
  anchorDate: toDateString(new Date()),
};

export function PatientReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patient, loading, error } = usePatient(id);

  const { schedules: sourcedSchedules, loading: loadingSchedules } = usePatientScheduleSource(id);

  const isInitialized = useRef(false);

  const [form, setForm] = useState({
    full_name: "",
    cpf: "",
    city: "",
    birth_date: "",
    phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
  });

  const [services, setServices] = useState<PatientService[]>([
    { id: crypto.randomUUID(), title: "Sessão", sessionPrice: "", paymentFormat: "avulso", schedule: DEFAULT_SCHEDULE, recurrenceType: "weekly", recurrenceDays: null }
  ]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (patient) {
      setForm({
        full_name: displayName(patient.full_name),
        cpf: patient.cpf ?? "",
        city: patient.city ?? "",
        birth_date: patient.birth_date ?? "",
        phone: patient.phone ?? "",
        emergency_contact_name: patient.emergency_contact_name ?? "",
        emergency_contact_phone: patient.emergency_contact_phone ?? "",
        notes: patient.notes ?? "",
      });
    }
  }, [patient]);

  useEffect(() => {
    if (!loadingSchedules && sourcedSchedules.length > 0 && !isInitialized.current) {
      isInitialized.current = true;
      
      const newServices = sourcedSchedules.map((sched) => {
        return {
          id: crypto.randomUUID(),
          title: sched.title || "Sessão",
          sessionPrice: sched.sessionPrice ? centsToCurrencyBRL(sched.sessionPrice) : "",
          paymentFormat: (sched.paymentFormat as PaymentFormat) || "avulso",
          schedule: sched,
          recurrenceType: sched.recurrenceType || "weekly",
          recurrenceDays: sched.recurrenceDays || null,
        };
      });
      setServices(newServices);
    }
  }, [loadingSchedules, sourcedSchedules]);

  function updateService(id: string, field: keyof PatientService, value: any) {
    setServices((prev) => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  function addService() {
    setServices((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: "Novo Serviço", sessionPrice: "", paymentFormat: "avulso", schedule: DEFAULT_SCHEDULE, recurrenceType: "weekly", recurrenceDays: null }
    ]);
  }

  function removeService(id: string) {
    if (services.length === 1) return;
    setServices((prev) => prev.filter(s => s.id !== id));
  }

  async function handleConfirm() {
    setSaveError(null);

    if (form.phone && !isValidPhoneBR(form.phone)) {
      setSaveError("Telefone inválido.");
      return;
    }

    // Validação de horários duplicados
    const seenTimes = new Set<string>();
    for (const s of services) {
      if (!s.schedule.startTime) continue;
      const key = `${s.schedule.weekday}-${s.schedule.startTime}`;
      if (seenTimes.has(key)) {
        setSaveError("Existem serviços agendados no mesmo dia e horário. Altere o horário de um deles.");
        return;
      }
      seenTimes.add(key);
    }

    setSaving(true);

    // 1. Atualiza os dados básicos do paciente
    const { error: updateError } = await supabase
      .from("patients")
      .update({
        full_name: toTitleCase(form.full_name),
        cpf: form.cpf.trim() || null,
        city: form.city.trim() || null,
        birth_date: form.birth_date || null,
        phone: form.phone || null,
        emergency_contact_name: form.emergency_contact_name ? toTitleCase(form.emergency_contact_name) : null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        notes: form.notes.trim() || null,
      })
      .eq("id", id);

    if (updateError) {
      setSaveError(updateError.message);
      setSaving(false);
      return;
    }

    // 2. Prepara os serviços para a RPC
    const allSchedules = services.map(s => ({
      ...s.schedule,
      recurrenceType: s.recurrenceType,
      recurrenceDays: s.recurrenceDays,
      title: s.title,
      sessionPrice: parseCurrencyToCents(s.sessionPrice),
      paymentFormat: s.paymentFormat,
    }));

    const mainRecurrence = services[0].recurrenceType;
    const mainRecurrenceDays = services[0].recurrenceDays;

    // 3. Promove para ativo com os horários/serviços
    const { error: promoteError } = await supabase.rpc("promote_prospect_to_active", {
      p_patient_id: id,
      p_schedules: allSchedules,
      p_recurrence_type: mainRecurrence,
      p_recurrence_days: mainRecurrenceDays,
    });

    if (promoteError) {
      setSaveError(promoteError.message);
      setSaving(false);
      return;
    }

    navigate(`/patients/${id}`);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>;
  }

  if (error || !patient) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-slate-400">{error ?? "Paciente não encontrado."}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/patients" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100">
          <ArrowLeft size={14} /> Voltar para pacientes
        </Link>

        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Revisando cadastro importado</p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300/80">
              Preencha os dados e confirme para ativar como paciente. Nome original do Google: <span className="italic">{patient.full_name}</span>
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Confirmar como paciente</h1>
      </div>

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">Dados pessoais</h2>
        <Input label="Nome completo" required value={form.full_name} onChange={(e) => setForm(prev => ({...prev, full_name: e.target.value}))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="CPF" inputMode="numeric" value={form.cpf} onChange={(e) => setForm(prev => ({...prev, cpf: maskCPF(e.target.value)}))} />
          <Input label="Data de nascimento" type="date" value={form.birth_date} onChange={(e) => setForm(prev => ({...prev, birth_date: e.target.value}))} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Cidade" value={form.city} onChange={(e) => setForm(prev => ({...prev, city: e.target.value}))} />
          <Input label="Telefone" type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm(prev => ({...prev, phone: maskPhone(e.target.value)}))} />
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">Contato de urgência</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome" value={form.emergency_contact_name} onChange={(e) => setForm(prev => ({...prev, emergency_contact_name: e.target.value}))} />
          <Input label="Telefone" type="tel" inputMode="tel" value={form.emergency_contact_phone} onChange={(e) => setForm(prev => ({...prev, emergency_contact_phone: maskPhone(e.target.value)}))} />
        </div>
      </Card>

      {/* BLOCO DE SERVIÇOS */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome do Serviço" placeholder="Ex: Terapia Individual" value={service.title} onChange={(e) => updateService(service.id, "title", e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Valor</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                  <input type="text" inputMode="numeric" value={service.sessionPrice} onChange={(e) => updateService(service.id, "sessionPrice", maskCurrencyBRL(e.target.value))} placeholder="0,00" className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Forma</label>
                <select value={service.paymentFormat} onChange={(e) => updateService(service.id, "paymentFormat", e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <option value="avulso">Avulso</option>
                  <option value="vencimento">Vencimento</option>
                  <option value="antecipado">Antecipado</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
            <ServiceScheduleField
              value={service.schedule}
              onChange={(val) => updateService(service.id, "schedule", val)}
              recurrenceType={service.recurrenceType}
              recurrenceDays={service.recurrenceDays}
              onRecurrenceChange={(type, days) => {
                setServices((prev) => prev.map((s) => s.id === service.id ? { ...s, recurrenceType: type, recurrenceDays: days ?? null } : s));
              }}
            />
          </div>
        </Card>
      ))}

      <Button type="button" variant="secondary" onClick={addService} className="w-full border-dashed border-2 py-6">
        <Plus size={18} /> Adicionar outro serviço
      </Button>

      <Card className="space-y-4 p-6 mt-6">
        <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">Observações internas</h2>
        <textarea value={form.notes} onChange={(e) => setForm(prev => ({...prev, notes: e.target.value}))} rows={3} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      </Card>

      {saveError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-300">{saveError}</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Link to="/patients">
          <Button type="button" variant="secondary">Cancelar</Button>
        </Link>
        <Button onClick={handleConfirm} disabled={saving}>
          <UserCheck size={16} /> {saving ? "Salvando..." : "Confirmar e ativar"}
        </Button>
      </div>
    </div>
  );
}