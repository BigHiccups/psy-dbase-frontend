import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, UserCheck, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button, Card, Input, Spinner } from "../components/ui";
import { ScheduleEditor } from "../components/agenda/ScheduleEditor";
import { usePatient } from "../hooks/usePatient";
import { useOccupiedSlots } from "../hooks/useOccupiedSlots";
import { toTitleCase } from "../lib/text";
import { maskCPF, maskPhone, isValidPhoneBR } from "../lib/masks";
import { displayName } from "../lib/patient-display";
import type { ScheduleInput } from "../types";
const [hasScheduleConflict, setHasScheduleConflict] = useState(false);

export function PatientReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patient, loading, error } = usePatient(id);

  // Slots ocupados por outros pacientes
  const { slots: occupiedSlots } = useOccupiedSlots();

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
  const [schedules, setSchedules] = useState<ScheduleInput[]>([]);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
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
    if (!patient) return;

    async function loadInviteSchedules() {
      const { data: submissions } = await supabase
        .from("patient_form_submissions")
        .select("invite_id, full_name")
        .eq("status", "approved")
        .ilike("full_name", patient!.full_name)
        .limit(1);

      if (!submissions || submissions.length === 0) return;

      const inviteId = submissions[0].invite_id;

      const { data: inviteSchedules } = await supabase
        .from("patient_invite_schedules")
        .select("weekday, start_time, duration_min")
        .eq("invite_id", inviteId)
        .order("weekday", { ascending: true });

      if (inviteSchedules && inviteSchedules.length > 0) {
        setSchedules(
          inviteSchedules.map((row) => ({
            weekday: row.weekday,
            startTime: (row.start_time as string).slice(0, 5),
            durationMin: row.duration_min,
          }))
        );
      }
    }

    loadInviteSchedules();
  }, [patient]);

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
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

    // Validação de conflito
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

    if (schedules.length > 0) {
      const conflict = schedules.find((s) =>
        occupiedSlots.some(
          (o) =>
            o.weekday === s.weekday &&
            o.startTime.slice(0, 5) === s.startTime.slice(0, 5)
        )
      );
      if (conflict) {
        setScheduleError("Há horário em conflito. Remova ou troque antes.");
        return;
      }

      const seen = new Set<string>();
      for (const s of schedules) {
        const key = `${s.weekday}-${s.startTime.slice(0, 5)}`;
        if (seen.has(key)) {
          setScheduleError("Há horários duplicados entre si.");
          return;
        }
        seen.add(key);
      }
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
          <p className="text-sm text-gray-500">
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
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Voltar para pacientes
        </Link>

        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Revisando cadastro importado
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Preencha os dados e confirme para ativar como paciente. Nome
              original do Google:{" "}
              <span className="italic">{patient.full_name}</span>
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900">
          Confirmar como paciente
        </h1>
      </div>

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-medium text-gray-900">Dados pessoais</h2>

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
        <h2 className="text-sm font-medium text-gray-900">
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
        <ScheduleEditor
          value={schedules}
          onChange={setSchedules}
          disabledSlots={occupiedSlots}
          error={scheduleError}
          hint="Horários já ocupados aparecem em âmbar."
          onConflictChange={setHasScheduleConflict}
        />
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-medium text-gray-900">
          Observações internas
        </h2>
        <textarea
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </Card>

      {saveError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{saveError}</p>
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