import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button, Card, Input, Spinner } from "../components/ui";
import { ScheduleEditor } from "../components/agenda/ScheduleEditor";
import { usePatient } from "../hooks/usePatient";
import { usePatientScheduleSource } from "../hooks/usePatientScheduleSource";
import { useOccupiedSlots } from "../hooks/useOccupiedSlots";
import { toTitleCase } from "../lib/text";
import { validateRecurrence } from "../lib/recurrence";
import {
  maskCPF,
  maskPhone,
  maskCurrencyBRL,
  parseCurrencyToCents,
  centsToCurrencyBRL,
  isValidCPF,
  isValidPhoneBR,
} from "../lib/masks";
import type { RecurrenceType, ScheduleInput } from "../types";

type FormState = {
  full_name: string;
  cpf: string;
  city: string;
  birth_date: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
  session_price: string;
};

const INITIAL_FORM: FormState = {
  full_name: "",
  cpf: "",
  city: "",
  birth_date: "",
  phone: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
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

export function PatientForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { patient, loading: loadingPatient } = usePatient(id);
  const {
    schedules: sourcedSchedules,
    source,
    recurrenceType: sourcedRecurrenceType,
    recurrenceDays: sourcedRecurrenceDays,
    loading: loadingSchedules,
  } = usePatientScheduleSource(id);

  const { slots: occupiedSlots } = useOccupiedSlots({ excludePatientId: id });

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [schedules, setSchedules] = useState<ScheduleInput[]>([]);
  const [initialSchedules, setInitialSchedules] = useState<ScheduleInput[]>([]);

  const [recurrenceType, setRecurrenceType] =
    useState<RecurrenceType>("weekly");
  const [recurrenceDays, setRecurrenceDays] = useState<number | null>(null);
  const [initialRecurrenceType, setInitialRecurrenceType] =
    useState<RecurrenceType>("weekly");
  const [initialRecurrenceDays, setInitialRecurrenceDays] =
    useState<number | null>(null);

  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [hasScheduleConflict, setHasScheduleConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patient) {
      setForm({
        full_name: patient.full_name ?? "",
        cpf: patient.cpf ?? "",
        city: patient.city ?? "",
        birth_date: patient.birth_date ?? "",
        phone: patient.phone ?? "",
        emergency_contact_name: patient.emergency_contact_name ?? "",
        emergency_contact_phone: patient.emergency_contact_phone ?? "",
        notes: patient.notes ?? "",
        session_price: centsToCurrencyBRL(patient.session_price_cents),
      });
    }
  }, [patient]);

  useEffect(() => {
    if (!loadingSchedules) {
      setSchedules(sourcedSchedules);
      setInitialSchedules((prev) =>
        prev.length === 0 ? sourcedSchedules : prev
      );

      setRecurrenceType(sourcedRecurrenceType);
      setRecurrenceDays(sourcedRecurrenceDays);
      setInitialRecurrenceType((prev) =>
        prev === "weekly" && sourcedRecurrenceType !== "weekly"
          ? sourcedRecurrenceType
          : prev
      );
      setInitialRecurrenceDays((prev) =>
        prev === null && sourcedRecurrenceDays !== null
          ? sourcedRecurrenceDays
          : prev
      );
    }
  }, [loadingSchedules, sourcedSchedules, sourcedRecurrenceType, sourcedRecurrenceDays]);

  useEffect(() => {
    if (patient && patient.status === "prospect" && isEdit) {
      navigate(`/patients/${patient.id}/review`, { replace: true });
    }
  }, [patient, isEdit, navigate]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleRecurrenceChange(
    nextType: RecurrenceType,
    nextDays: number | null
  ) {
    setRecurrenceType(nextType);
    setRecurrenceDays(nextDays);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setScheduleError(null);

    if (form.cpf && !isValidCPF(form.cpf)) {
      setError("CPF inválido. Confira os dígitos.");
      return;
    }
    if (form.phone && !isValidPhoneBR(form.phone)) {
      setError("Telefone inválido. Use DDD + número.");
      return;
    }
    if (
      form.emergency_contact_phone &&
      !isValidPhoneBR(form.emergency_contact_phone)
    ) {
      setError("Telefone do contato de urgência inválido.");
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
      full_name: toTitleCase(form.full_name),
      cpf: form.cpf.trim() || null,
      city: form.city.trim() || null,
      birth_date: form.birth_date || null,
      phone: form.phone || null,
      emergency_contact_name: form.emergency_contact_name
        ? toTitleCase(form.emergency_contact_name)
        : null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      notes: form.notes.trim() || null,
      session_price_cents: parseCurrencyToCents(form.session_price),
    };

    if (isEdit) {
      const { error: updateErr } = await supabase
        .from("patients")
        .update(payload)
        .eq("id", id);

      if (updateErr) {
        setError(updateErr.message);
        setSaving(false);
        return;
      }

      const schedulesChanged = !schedulesEqual(schedules, initialSchedules);
      const recurrenceChanged = !recurrenceEqual(
        recurrenceType,
        recurrenceDays,
        initialRecurrenceType,
        initialRecurrenceDays
      );

      if (schedules.length > 0 && (schedulesChanged || recurrenceChanged)) {
        const { error: scheduleErr } = await supabase.rpc(
          "set_patient_schedules",
          {
            p_patient_id: id,
            p_schedules: schedules,
            p_recurrence_type: recurrenceType,
            p_recurrence_days: recurrenceDays,
          }
        );

        if (scheduleErr) {
          setScheduleError(scheduleErr.message);
          setSaving(false);
          return;
        }
      }

      navigate(`/patients/${id}`);
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
        .from("patients")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();

      if (insertErr || !data) {
        setError(insertErr?.message ?? "Erro ao criar paciente.");
        setSaving(false);
        return;
      }

      if (schedules.length > 0) {
        const { error: scheduleErr } = await supabase.rpc(
          "set_patient_schedules",
          {
            p_patient_id: data.id,
            p_schedules: schedules,
            p_recurrence_type: recurrenceType,
            p_recurrence_days: recurrenceDays,
          }
        );

        if (scheduleErr) {
          setScheduleError(scheduleErr.message);
          setSaving(false);
          return;
        }
      }

      navigate(`/patients/${data.id}`);
    }
  }

  if (isEdit && (loadingPatient || loadingSchedules)) {
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
          to={isEdit ? `/patients/${id}` : "/patients"}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft size={14} />
          {isEdit ? "Voltar para o paciente" : "Voltar para pacientes"}
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
          {isEdit ? "Editar paciente" : "Novo paciente"}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          {isEdit
            ? "Atualize os dados cadastrais do paciente."
            : "Cadastre um paciente manualmente, sem enviar convite."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
            Dados pessoais
          </h2>

          <Input
            label="Nome completo"
            required
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            placeholder="Ex: Maria Silva"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="CPF"
              inputMode="numeric"
              value={form.cpf}
              onChange={(e) => update("cpf", maskCPF(e.target.value))}
              placeholder="000.000.000-00"
            />

            <Input
              label="Data de nascimento"
              type="date"
              value={form.birth_date}
              onChange={(e) => update("birth_date", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Cidade"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
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
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
            Contato de urgência
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nome"
              value={form.emergency_contact_name}
              onChange={(e) =>
                update("emergency_contact_name", e.target.value)
              }
            />

            <Input
              label="Telefone"
              type="tel"
              inputMode="tel"
              value={form.emergency_contact_phone}
              onChange={(e) =>
                update("emergency_contact_phone", maskPhone(e.target.value))
              }
              placeholder="(00) 00000-0000"
            />
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
            Financeiro
          </h2>

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
              Valor cobrado por sessão. Usado nos relatórios financeiros.
            </p>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <ScheduleEditor
            value={schedules}
            onChange={setSchedules}
            disabledSlots={occupiedSlots}
            error={scheduleError}
            hint={
              source === "google"
                ? "Estes horários vieram do Google Calendar. Você pode ajustá-los."
                : source === "invite"
                  ? "Estes horários vieram do convite. Você pode ajustá-los."
                  : "Estes horários gerarão agendamentos recorrentes. Horários já ocupados aparecem em âmbar."
            }
            onConflictChange={setHasScheduleConflict}
            recurrenceType={recurrenceType}
            recurrenceDays={recurrenceDays}
            onRecurrenceChange={handleRecurrenceChange}
          />
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
            Observações internas
          </h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Notas
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={4}
              placeholder="Anotações administrativas (não vão para o prontuário)"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Campo opcional. Visível apenas para você.
            </p>
          </div>
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
          <Link to={isEdit ? `/patients/${id}` : "/patients"}>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving || hasScheduleConflict}
            title={
              hasScheduleConflict
                ? "Resolva os horários em conflito antes de salvar"
                : undefined
            }
          >
            <Save size={16} />
            {saving
              ? "Salvando..."
              : hasScheduleConflict
                ? "Resolva os conflitos"
                : isEdit
                  ? "Salvar alterações"
                  : "Criar paciente"}
          </Button>
        </div>
      </form>
    </div>
  );
}