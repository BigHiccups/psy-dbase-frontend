import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, UserCheck, AlertCircle } from "lucide-react";
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
  parseCurrencyToCents,
  centsToCurrencyBRL,
  isValidPhoneBR,
  maskCurrencyBRL,
} from "../lib/masks";
import { displayName } from "../lib/patient-display";
import type { RecurrenceType, ScheduleInput } from "../types";

export function PatientReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patient, loading, error } = usePatient(id);
  const { slots: occupiedSlots } = useOccupiedSlots();

  const {
    schedules: sourcedSchedules,
    source,
    recurrenceType: sourcedRecurrenceType,
    recurrenceDays: sourcedRecurrenceDays,
    loading: loadingSchedules,
  } = usePatientScheduleSource(id);

  const [form, setForm] = useState({
    full_name: "",
    cpf: "",
    city: "",
    birth_date: "",
    phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    session_price: "",
  });
  const [schedules, setSchedules] = useState<ScheduleInput[]>([]);
  const [recurrenceType, setRecurrenceType] =
    useState<RecurrenceType>("weekly");
  const [recurrenceDays, setRecurrenceDays] = useState<number | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [hasScheduleConflict, setHasScheduleConflict] = useState(false);
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
        session_price: centsToCurrencyBRL(patient.session_price_cents),
      });
    }
  }, [patient]);

  useEffect(() => {
    if (!loadingSchedules && sourcedSchedules.length > 0) {
      setSchedules(sourcedSchedules);
      setRecurrenceType(sourcedRecurrenceType);
      setRecurrenceDays(sourcedRecurrenceDays);
    }
  }, [
    loadingSchedules,
    sourcedSchedules,
    sourcedRecurrenceType,
    sourcedRecurrenceDays,
  ]);

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleRecurrenceChange(
    nextType: RecurrenceType,
    nextDays: number | null
  ) {
    setRecurrenceType(nextType);
    setRecurrenceDays(nextDays);
  }

  async function handleConfirm() {
    setSaveError(null);
    setScheduleError(null);

    if (form.phone && !isValidPhoneBR(form.phone)) {
      setSaveError("Telefone inválido.");
      return;
    }

    if (schedules.length === 0) {
      setScheduleError("Informe pelo menos um horário de sessão.");
      return;
    }

    if (hasScheduleConflict) {
      setScheduleError("Resolva os horários em conflito antes de continuar.");
      return;
    }

    const recurrenceErr = validateRecurrence(recurrenceType, recurrenceDays);
    if (recurrenceErr) {
      setScheduleError(recurrenceErr);
      return;
    }

    const conflict = schedules.find((s) =>
      occupiedSlots.some(
        (o) =>
          o.weekday === s.weekday &&
          o.startTime.slice(0, 5) === s.startTime.slice(0, 5)
      )
    );
    if (conflict) {
      setScheduleError(
        "Há horário em conflito com outro agendamento. Remova ou troque antes de continuar."
      );
      return;
    }

    const seen = new Set<string>();
    for (const s of schedules) {
      const key = `${s.weekday}-${s.startTime.slice(0, 5)}`;
      if (seen.has(key)) {
        setScheduleError("Há horários duplicados entre si. Remova um deles.");
        return;
      }
      seen.add(key);
    }

    setSaving(true);

    const { error: updateError } = await supabase
      .from("patients")
      .update({
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
      })
      .eq("id", id);

    if (updateError) {
      setSaveError(updateError.message);
      setSaving(false);
      return;
    }

    const { error: promoteError } = await supabase.rpc(
      "promote_prospect_to_active",
      {
        p_patient_id: id,
        p_schedules: schedules,
        p_recurrence_type: recurrenceType,
        p_recurrence_days: recurrenceDays,
      }
    );

    if (promoteError) {
      setSaveError(promoteError.message);
      setSaving(false);
      return;
    }

    navigate(`/patients/${id}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={24} />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {error ?? "Paciente não encontrado."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to="/patients"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft size={14} />
          Voltar para pacientes
        </Link>

        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
          />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              Revisando cadastro importado
            </p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300/80">
              Preencha os dados e confirme para ativar como paciente. Nome
              original do Google:{" "}
              <span className="italic">{patient.full_name}</span>
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
          Confirmar como paciente
        </h1>
      </div>

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
          Dados pessoais
        </h2>

        <Input
          label="Nome completo"
          required
          value={form.full_name}
          onChange={(e) => update("full_name", e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="CPF"
            inputMode="numeric"
            value={form.cpf}
            onChange={(e) => update("cpf", maskCPF(e.target.value))}
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
          />
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        {loadingSchedules ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <Spinner size={16} />
            Carregando horários...
          </div>
        ) : (
          <ScheduleEditor
            value={schedules}
            onChange={setSchedules}
            disabledSlots={occupiedSlots}
            error={scheduleError}
            hint={
              source === "google"
                ? "Estes horários vieram do Google Calendar. Você pode ajustá-los ou removê-los."
                : source === "invite"
                  ? "Estes horários vieram do convite. Você pode ajustá-los."
                  : "Estes horários gerarão agendamentos recorrentes. Horários já ocupados aparecem em âmbar."
            }
            onConflictChange={setHasScheduleConflict}
            recurrenceType={recurrenceType}
            recurrenceDays={recurrenceDays}
            onRecurrenceChange={handleRecurrenceChange}
          />
        )}
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
        <h2 className="text-sm font-medium text-gray-900 dark:text-slate-100">
          Observações internas
        </h2>
        <textarea
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </Card>

      {saveError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
          <AlertCircle
            size={16}
            className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
          />
          <p className="text-sm text-red-700 dark:text-red-300">{saveError}</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Link to="/patients">
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </Link>
        <Button
          onClick={handleConfirm}
          disabled={saving || hasScheduleConflict}
          title={
            hasScheduleConflict
              ? "Resolva os horários em conflito antes de salvar"
              : undefined
          }
        >
          <UserCheck size={16} />
          {saving
            ? "Salvando..."
            : hasScheduleConflict
              ? "Resolva os conflitos"
              : "Confirmar e ativar"}
        </Button>
      </div>
    </div>
  );
}