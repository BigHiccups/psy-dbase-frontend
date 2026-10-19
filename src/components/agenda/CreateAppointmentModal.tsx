import { useMemo, useState } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button, Modal } from "../ui";
import { usePatients } from "../../hooks/usePatients";
import { useProviders } from "../../hooks/useProviders";
import { useOccupiedSlots } from "../../hooks/useOccupiedSlots";
import { formatLongDate, parseDateString, addDays } from "../../lib/agenda-date";
import { validateRecurrence } from "../../lib/recurrence";
import { parseDateBR, formatDateBR, isValidDateBR } from "../../lib/masks";
import { toTitleCase } from "../../lib/text";
import { isValidPhoneBR } from "../../lib/masks";
import type {
  AppointmentType,
  RecurrenceType,
  ScheduleInput,
} from "../../types";

import {
  findSingleConflict,
  findSeriesConflict,
} from "./create-appointment/conflict-checker";
import { TypeSelector, type AppointmentOption } from "./create-appointment/TypeSelector";
import { EntityPicker } from "./create-appointment/EntityPicker";
import { DateTimeFields } from "./create-appointment/DateTimeFields";
import { RecurrenceSelector } from "./create-appointment/RecurrenceSelector";
import { BlockFields, type BlockMode } from "./create-appointment/BlockFields";

type Props = {
  open: boolean;
  date: string;
  initialHour: number;
  initialDuration?: number;
  onClose: () => void;
  onCreated: () => void;
};

const ALL_DAY_START = "07:00";
const ALL_DAY_END = "23:59";

export function CreateAppointmentModal({
  open,
  date,
  initialHour,
  initialDuration,
  onClose,
  onCreated,
}: Props) {
  const [option, setOption] = useState<AppointmentOption>("session");

  // Horário padrão (Sessão / Prestador)
  const [startTime, setStartTime] = useState(
    `${String(initialHour).padStart(2, "0")}:00`
  );
  const [duration, setDuration] = useState(initialDuration ?? 50);

  // Horário padrão (Bloqueio)
  const [blockStartTime, setBlockStartTime] = useState(ALL_DAY_START);
  const [blockEndTime, setBlockEndTime] = useState(ALL_DAY_END);

  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paciente
  const [patientId, setPatientId] = useState("");
  const [patientQuery, setPatientQuery] = useState("");
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");

  // Prestador
  const [providerId, setProviderId] = useState("");
  const [providerQuery, setProviderQuery] = useState("");
  const [creatingProvider, setCreatingProvider] = useState(false);
  const [newProviderName, setNewProviderName] = useState("");
  const [newProviderPhone, setNewProviderPhone] = useState("");

  // Repetir
  const [repeat, setRepeat] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("weekly");
  const [recurrenceDays, setRecurrenceDays] = useState<number | null>(null);

  // Bloqueio
  const [blockMode, setBlockMode] = useState<BlockMode>("all_day_single");
  const [multiFromText, setMultiFromText] = useState(formatDateBR(date));
  const [multiToText, setMultiToText] = useState(formatDateBR(date));

  const { patients } = usePatients("active");
  const { providers } = useProviders("all");
  const { slots: occupiedSlots } = useOccupiedSlots();

  const activePersonProviders = useMemo(
    () =>
      providers.filter((p) => p.status === "active" && p.kind === "person"),
    [providers]
  );

  const filteredPatients = (patientQuery
    ? patients.filter((p) =>
      p.full_name.toLowerCase().includes(patientQuery.toLowerCase())
    )
    : patients.slice(0, 5)
  ).map((p) => ({ id: p.id, name: p.full_name }));

  const filteredProviders = (providerQuery
    ? activePersonProviders.filter((p) =>
      p.display_name.toLowerCase().includes(providerQuery.toLowerCase())
    )
    : activePersonProviders.slice(0, 5)
  ).map((p) => ({ id: p.id, name: p.display_name }));

  function handleChangeOption(next: AppointmentOption) {
    setOption(next);
    setError(null);

    if (next === "blocked") {
      setRepeat(false);
      setBlockStartTime(ALL_DAY_START);
      setBlockEndTime(ALL_DAY_END);
      setBlockMode("all_day_single");
      setRecurrenceDays(null); // <--- Limpa os dias
    } else {
      setStartTime(`${String(initialHour).padStart(2, "0")}:00`);
      // Se não for custom_days, limpa o days para não dar conflito no backend/frontend
      if (recurrenceType !== "custom_days") {
        setRecurrenceDays(null);
      }
    }
  }

  async function handleSubmit() {
    setError(null);

    // ============ Validações comuns ============
    if (option === "session") {
      if (!patientId && !creatingPatient) return setError("Selecione um paciente ou crie um novo.");
      if (creatingPatient) {
        if (!newPatientName.trim()) return setError("Informe o nome do novo paciente.");
        if (newPatientPhone && !isValidPhoneBR(newPatientPhone)) return setError("Telefone do paciente inválido.");
      }
    }

    if (option === "personal") {
      if (!providerId && !creatingProvider) return setError("Selecione um prestador ou crie um novo.");
      if (creatingProvider) {
        if (!newProviderName.trim()) return setError("Informe o nome do novo prestador.");
        if (newProviderPhone && !isValidPhoneBR(newProviderPhone)) return setError("Telefone do prestador inválido.");
      }
    }

    // ============ Bloqueio: validações de data ============
    if (option === "blocked") {
      if (blockMode === "range_single_day" || blockMode === "multi_day") {
        if (!blockStartTime || !blockEndTime) return setError("Preencha horário de início e fim.");
        if (blockEndTime <= blockStartTime) return setError("Horário de fim deve ser posterior ao de início.");
      }
      if (blockMode === "multi_day") {
        if (!isValidDateBR(multiFromText)) return setError("Data 'De' inválida.");
        if (!isValidDateBR(multiToText)) return setError("Data 'Até' inválida.");
        const fromIso = parseDateBR(multiFromText);
        const toIso = parseDateBR(multiToText);
        if (!fromIso || !toIso) return setError("Datas inválidas.");
        if (toIso < fromIso) return setError("Data 'Até' deve ser posterior a 'De'.");
      }
    }

    // ============ Série: validar recorrência ============
    if (option !== "blocked" && repeat) {
      const recurrenceErr = validateRecurrence(recurrenceType, recurrenceDays);
      if (recurrenceErr) return setError(recurrenceErr);
    }

    // ============ Validação de conflito (só Sessão/Prestador) ============
    if (option !== "blocked") {
      if (repeat) {
        const conflictMsg = findSeriesConflict(
          occupiedSlots,
          parseDateString(date).getDay(),
          startTime,
          duration,
          recurrenceType,
          recurrenceDays,
          date
        );
        if (conflictMsg) return setError(conflictMsg);
      } else {
        const conflictMsg = findSingleConflict(
          occupiedSlots,
          parseDateString(date).getDay(),
          startTime,
          duration
        );
        if (conflictMsg) return setError(`Horário em conflito com ${conflictMsg}.`);
      }
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Sessão expirada.");
      setSaving(false);
      return;
    }

    // ============ Cadastro rápido ============
    let finalPatientId: string | null = null;
    let finalProviderId: string | null = null;

    if (option === "session") {
      if (creatingPatient) {
        const { data: newPatient, error: createErr } = await supabase
          .from("patients")
          .insert({
            user_id: user.id,
            full_name: toTitleCase(newPatientName),
            phone: newPatientPhone || null,
            status: "active",
          })
          .select("id")
          .single();

        if (createErr || !newPatient) {
          setError(createErr?.message ?? "Erro ao criar paciente.");
          setSaving(false);
          return;
        }
        finalPatientId = newPatient.id;
      } else {
        finalPatientId = patientId;
      }
    }

    if (option === "personal") {
      if (creatingProvider) {
        const { data: newProvider, error: createErr } = await supabase
          .from("providers")
          .insert({
            user_id: user.id,
            kind: "person",
            display_name: toTitleCase(newProviderName),
            phone: newProviderPhone || null,
            status: "active",
          })
          .select("id")
          .single();

        if (createErr || !newProvider) {
          setError(createErr?.message ?? "Erro ao criar prestador.");
          setSaving(false);
          return;
        }
        finalProviderId = newProvider.id;
      } else {
        finalProviderId = providerId;
      }
    }

    // ============ Caminho 1 — Bloqueio ============
    if (option === "blocked") {
      let startDate = date;
      let endDate = date;
      if (blockMode === "multi_day") {
        startDate = parseDateBR(multiFromText)!;
        endDate = parseDateBR(multiToText)!;
      }

      const timeToMins = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };

      const blockStartMin = blockMode === "all_day_single" ? timeToMins(ALL_DAY_START) : timeToMins(blockStartTime);
      const blockEndMin = blockMode === "all_day_single" ? timeToMins(ALL_DAY_END) : timeToMins(blockEndTime);

      // 1. Buscar agendamentos ativos no período
      const { data: activeAppts, error: fetchErr } = await supabase
        .from("appointments")
        .select("id, start_time, duration_min")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("starts_on", startDate)
        .lte("starts_on", endDate)
        .in("type", ["session", "personal"]);

      if (fetchErr) {
        setError(fetchErr.message);
        setSaving(false);
        return;
      }

      // 2. Filtrar quais realmente se sobrepõem ao bloqueio
      const idsToCancel = (activeAppts || []).filter(appt => {
        const apptStart = timeToMins((appt.start_time as string).slice(0, 5));
        const apptEnd = apptStart + appt.duration_min;
        return (apptStart < blockEndMin && blockStartMin < apptEnd);
      }).map(a => a.id);

      // 3. Criar os blocos
      let blocks: Array<Record<string, unknown>> = [];
      let cur = startDate;
      let guard = 0;

      while (cur <= endDate && guard < 400) {
        guard++;
        blocks.push({
          user_id: user.id,
          patient_id: null,
          provider_id: null,
          type: "blocked",
          weekday: parseDateString(cur).getDay(),
          start_time: (blockMode === "all_day_single" ? ALL_DAY_START : blockStartTime) + ":00",
          duration_min: blockEndMin - blockStartMin,
          starts_on: cur,
          ends_on: cur,
          is_recurring: false,
          status: "active",
          notes: notes.trim() || "Bloqueio",
          linked_expense: false,
        });
        cur = addDays(cur, 1);
      }

      const { data: insertedBlocks, error: blockErr } = await supabase
        .from("appointments")
        .insert(blocks)
        .select("id, starts_on");

      if (blockErr || !insertedBlocks) {
        setError(blockErr?.message ?? "Erro ao criar bloqueio.");
        setSaving(false);
        return;
      }

      // 4. Cancelar os agendamentos (e salvar o ID do bloco nas observações deles)
      if (idsToCancel.length > 0) {
        for (const apptId of idsToCancel) {
          // Descobre a data do appointment para achar o bloco correspondente
          const { data: apptData } = await supabase
            .from("appointments")
            .select("starts_on, notes")
            .eq("id", apptId)
            .single();

          if (apptData) {
            const matchingBlock = insertedBlocks.find(b => b.starts_on === apptData.starts_on);
            if (matchingBlock) {
              // Guarda o ID do bloqueio nas observações do agendamento cancelado
              const oldNotes = apptData.notes ? `${apptData.notes}\n` : "";
              await supabase
                .from("appointments")
                .update({
                  status: "cancelled",
                  notes: `${oldNotes}[cancelled_by_block:${matchingBlock.id}]`
                })
                .eq("id", apptId);
            }
          }
        }
      }

      setSaving(false);
      onCreated();
      onClose();
      return;
    }

    // ============ Caminho 2 — Série ============
    if (repeat) {
      const schedulesPayload: ScheduleInput[] = [
        {
          weekday: parseDateString(date).getDay(),
          startTime,
          durationMin: duration,
          anchorDate: date,
        },
      ];

      // CORREÇÃO AQUI: só envia recurrenceDays se for custom_days
      const finalRecurrenceDays =
        recurrenceType === "custom_days" ? recurrenceDays : null;

      const rpcName =
        option === "session"
          ? "set_patient_schedules"
          : "set_provider_schedules";

      const rpcParams =
        option === "session"
          ? {
            p_patient_id: finalPatientId,
            p_schedules: schedulesPayload,
            p_recurrence_type: recurrenceType,
            p_recurrence_days: finalRecurrenceDays,
          }
          : {
            p_provider_id: finalProviderId,
            p_schedules: schedulesPayload,
            p_recurrence_type: recurrenceType,
            p_recurrence_days: finalRecurrenceDays,
          };

      const { error: rpcErr } = await supabase.rpc(
        rpcName as any,
        rpcParams as any
      );
      setSaving(false);

      if (rpcErr) return setError(rpcErr.message);

      onCreated();
      onClose();
      return;
    }

    // ============ Caminho 3 — Avulso ============
    const type: AppointmentType = option === "session" ? "session" : "personal";
    const payload = {
      user_id: user.id,
      patient_id: finalPatientId,
      provider_id: finalProviderId,
      type,
      weekday: parseDateString(date).getDay(),
      start_time: startTime + ":00",
      duration_min: duration,
      starts_on: date,
      ends_on: date,
      is_recurring: false,
      status: "active" as const,
      notes: notes.trim() || null,
      linked_expense: option === "personal",
    };

    const { error: insertErr } = await supabase.from("appointments").insert(payload);
    setSaving(false);

    if (insertErr) return setError(insertErr.message);

    onCreated();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo agendamento" size="lg">
      <div className="space-y-5">
        <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-slate-800/60">
          <p className="text-xs text-gray-500 dark:text-slate-400">Data</p>
          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
            {formatLongDate(date)}
          </p>
        </div>

        <TypeSelector value={option} onChange={handleChangeOption} />

        {option === "session" && (
          <EntityPicker
            label="Paciente"
            items={filteredPatients}
            selectedId={patientId}
            query={patientQuery}
            creating={creatingPatient}
            newName={newPatientName}
            newPhone={newPatientPhone}
            onQueryChange={(q) => {
              setPatientQuery(q);
              setPatientId("");
              setCreatingPatient(false);
            }}
            onSelect={(id, name) => {
              setPatientId(id);
              setPatientQuery(name);
            }}
            onStartCreating={(name) => {
              setCreatingPatient(true);
              setNewPatientName(name);
            }}
            onCreateCancel={() => {
              setCreatingPatient(false);
              setNewPatientName("");
              setNewPatientPhone("");
            }}
            onNewNameChange={setNewPatientName}
            onNewPhoneChange={setNewPatientPhone}
            searchPlaceholder="Buscar paciente por nome..."
            createLabel="Criar novo paciente"
          />
        )}

        {option === "personal" && (
          <EntityPicker
            label="Prestador"
            items={filteredProviders}
            selectedId={providerId}
            query={providerQuery}
            creating={creatingProvider}
            newName={newProviderName}
            newPhone={newProviderPhone}
            onQueryChange={(q) => {
              setProviderQuery(q);
              setProviderId("");
              setCreatingProvider(false);
            }}
            onSelect={(id, name) => {
              setProviderId(id);
              setProviderQuery(name);
            }}
            onStartCreating={(name) => {
              setCreatingProvider(true);
              setNewProviderName(name);
            }}
            onCreateCancel={() => {
              setCreatingProvider(false);
              setNewProviderName("");
              setNewProviderPhone("");
            }}
            onNewNameChange={setNewProviderName}
            onNewPhoneChange={setNewProviderPhone}
            searchPlaceholder="Buscar prestador por nome..."
            createLabel="Criar novo prestador"
          />
        )}

        {option !== "blocked" ? (
          <DateTimeFields
            startTime={startTime}
            duration={duration}
            onStartTimeChange={setStartTime}
            onDurationChange={setDuration}
          />
        ) : (
          <BlockFields
            mode={blockMode}
            onModeChange={setBlockMode}
            date={date}
            startTime={blockStartTime}
            endTime={blockEndTime}
            onStartTimeChange={setBlockStartTime}
            onEndTimeChange={setBlockEndTime}
            multiFromText={multiFromText}
            multiToText={multiToText}
            onMultiFromChange={setMultiFromText}
            onMultiToChange={setMultiToText}
          />
        )}

        {option !== "blocked" && (
          <RecurrenceSelector
            repeat={repeat}
            recurrenceType={recurrenceType}
            recurrenceDays={recurrenceDays}
            onRepeatChange={setRepeat}
            onTypeChange={(t) => {
              setRecurrenceType(t);
              // Se mudou para semanal, quinzenal, etc, limpa os dias
              if (t !== "custom_days") {
                setRecurrenceDays(null);
              } else if (recurrenceDays === null) {
                setRecurrenceDays(15); // Só coloca 15 se for custom e estiver vazio
              }
            }}
            onDaysChange={setRecurrenceDays}
            dateLabel={formatLongDate(date)}
          />
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Observações
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Opcional"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-5 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            <Plus size={16} />
            {saving ? "Criando..." : "Criar agendamento"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}