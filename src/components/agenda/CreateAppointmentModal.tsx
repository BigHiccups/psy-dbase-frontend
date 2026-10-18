import { useMemo, useState } from "react";
import {
  Plus,
  AlertCircle,
  User,
  Ban,
  UserCircle,
  UserPlus,
  Briefcase,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button, Modal, Input, Badge } from "../ui";
import { usePatients } from "../../hooks/usePatients";
import { useProviders } from "../../hooks/useProviders";
import { useOccupiedSlots } from "../../hooks/useOccupiedSlots";
import { formatLongDate, parseDateString } from "../../lib/agenda-date";
import { slotOverlapsAppointment } from "../../lib/appointment-overlap";
import { toTitleCase } from "../../lib/text";
import { maskPhone, isValidPhoneBR } from "../../lib/masks";
import type { AppointmentType } from "../../types";

type Props = {
  open: boolean;
  date: string;         // YYYY-MM-DD
  initialHour: number;
  onClose: () => void;
  onCreated: () => void;
};

type Option = "session" | "personal" | "blocked";

export function CreateAppointmentModal({
  open,
  date,
  initialHour,
  onClose,
  onCreated,
}: Props) {
  const [option, setOption] = useState<Option>("session");

  // Sessão — paciente
  const [patientId, setPatientId] = useState<string>("");
  const [patientQuery, setPatientQuery] = useState("");
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [creatingPatient, setCreatingPatient] = useState(false);

  // Prestador
  const [providerId, setProviderId] = useState<string>("");
  const [providerQuery, setProviderQuery] = useState("");
  const [newProviderName, setNewProviderName] = useState("");
  const [newProviderPhone, setNewProviderPhone] = useState("");
  const [creatingProvider, setCreatingProvider] = useState(false);

  const [startTime, setStartTime] = useState(
    `${String(initialHour).padStart(2, "0")}:00`
  );
  const [duration, setDuration] = useState(50);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { patients } = usePatients("active");
  const { providers } = useProviders("all");
  const { slots: occupiedSlots } = useOccupiedSlots();

  // Só pessoas físicas são agendáveis na agenda
  const activePersonProviders = useMemo(
    () =>
      providers.filter(
        (p) => p.status === "active" && p.kind === "person"
      ),
    [providers]
  );

  // =========================================================
  // Buscas
  // =========================================================
  const filteredPatients = patientQuery
    ? patients.filter((p) =>
        p.full_name.toLowerCase().includes(patientQuery.toLowerCase())
      )
    : patients.slice(0, 5);

  const filteredProviders = providerQuery
    ? activePersonProviders.filter((p) =>
        p.display_name.toLowerCase().includes(providerQuery.toLowerCase())
      )
    : activePersonProviders.slice(0, 5);

  const hasPatientMatch = filteredPatients.length > 0;
  const hasProviderMatch = filteredProviders.length > 0;

  // Se o usuário digitou um nome que é idêntico a um match existente,
  // não faz sentido oferecer "criar novo". Ex: digitou "Teste B" e
  // existe exatamente "Teste B".
  const patientQueryIsExactMatch =
    !!patientQuery.trim() &&
    filteredPatients.some(
      (p) =>
        p.full_name.trim().toLowerCase() ===
        patientQuery.trim().toLowerCase()
    );

  const providerQueryIsExactMatch =
    !!providerQuery.trim() &&
    filteredProviders.some(
      (p) =>
        p.display_name.trim().toLowerCase() ===
        providerQuery.trim().toLowerCase()
    );

  // =========================================================
  // Trocar tipo limpa estados
  // =========================================================
  function handleChangeOption(next: Option) {
    setOption(next);
    setError(null);
  }

  // =========================================================
  // Validação de conflito por sobreposição
  // =========================================================
  function checkConflict(): string | null {
    const weekday = parseDateString(date).getDay();

    const conflicting = occupiedSlots.find((slot) => {
      return slotOverlapsAppointment(
        { weekday, startTime, durationMin: duration },
        {
          weekday: slot.weekday,
          start_time: slot.startTime,
          duration_min: slot.durationMin,
        }
      );
    });

    if (!conflicting) return null;

    const who =
      conflicting.subjectName ??
      (conflicting.occupiedBy === "blocked"
        ? "um bloqueio"
        : "outro agendamento");

    return `Horário em conflito com ${who} (${conflicting.startTime}). Ajuste ou remova o outro agendamento antes.`;
  }

  // =========================================================
  // Submit
  // =========================================================
  async function handleSubmit() {
    setError(null);

    if (option === "session") {
      if (!patientId && !creatingPatient) {
        setError("Selecione um paciente ou crie um novo.");
        return;
      }
      if (creatingPatient) {
        if (!newPatientName.trim()) {
          setError("Informe o nome do novo paciente.");
          return;
        }
        if (newPatientPhone && !isValidPhoneBR(newPatientPhone)) {
          setError("Telefone do paciente inválido.");
          return;
        }
      }
    }

    if (option === "personal") {
      if (!providerId && !creatingProvider) {
        setError("Selecione um prestador ou crie um novo.");
        return;
      }
      if (creatingProvider) {
        if (!newProviderName.trim()) {
          setError("Informe o nome do novo prestador.");
          return;
        }
        if (newProviderPhone && !isValidPhoneBR(newProviderPhone)) {
          setError("Telefone do prestador inválido.");
          return;
        }
      }
    }

    const conflictMsg = checkConflict();
    if (conflictMsg) {
      setError(conflictMsg);
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sessão expirada.");
      setSaving(false);
      return;
    }

    // =========================================================
    // Cadastro rápido — paciente
    // =========================================================
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
        // Cadastro rápido é sempre person (empresa fica de fora da agenda)
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

    // =========================================================
    // Cria o appointment
    // =========================================================
    const type: AppointmentType =
      option === "session"
        ? "session"
        : option === "personal"
          ? "personal"
          : "blocked";

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

    const { error: insertErr } = await supabase
      .from("appointments")
      .insert(payload);
    setSaving(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    onCreated();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo agendamento" size="lg">
      <div className="space-y-5">
        {/* Data */}
        <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-slate-800/60">
          <p className="text-xs text-gray-500 dark:text-slate-400">Data</p>
          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
            {formatLongDate(date)}
          </p>
        </div>

        {/* Tipo de agendamento */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Tipo de agendamento
          </label>
          <div className="grid grid-cols-3 gap-2">
            <TypeButton
              selected={option === "session"}
              onClick={() => handleChangeOption("session")}
              icon={<UserCircle size={18} />}
              title="Sessão"
              subtitle="Com paciente"
            />
            <TypeButton
              selected={option === "personal"}
              onClick={() => handleChangeOption("personal")}
              icon={<Briefcase size={18} />}
              title="Prestador"
              subtitle="Supervisão, terapia"
            />
            <TypeButton
              selected={option === "blocked"}
              onClick={() => handleChangeOption("blocked")}
              icon={<Ban size={18} />}
              title="Bloqueio"
              subtitle="Férias, pausa"
            />
          </div>
        </div>

        {/* Busca paciente — só p/ sessão */}
        {option === "session" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Paciente <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Buscar paciente por nome..."
              value={patientQuery}
              onChange={(e) => {
                setPatientQuery(e.target.value);
                setPatientId("");
                setCreatingPatient(false);
              }}
              disabled={creatingPatient}
            />

            {!creatingPatient && (
              <div className="mt-2 space-y-1 rounded-lg border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {/* Lista de matches */}
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPatientId(p.id);
                      setPatientQuery(p.full_name);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-slate-800 ${
                      patientId === p.id
                        ? "bg-brand-50 text-brand-900 dark:bg-brand-950/40 dark:text-brand-200"
                        : "text-gray-900 dark:text-slate-100"
                    }`}
                  >
                    <User
                      size={14}
                      className="text-gray-400 dark:text-slate-500"
                    />
                    <span className="flex-1">{p.full_name}</span>
                    {patientId === p.id && (
                      <Badge variant="brand">Selecionado</Badge>
                    )}
                  </button>
                ))}

                {!hasPatientMatch && patientQuery.trim() !== "" && (
                  <p className="px-3 py-2 text-xs text-gray-500 dark:text-slate-400">
                    Nenhum paciente encontrado.
                  </p>
                )}

                {/* "+ Criar novo" só aparece se:
                    - nada foi selecionado ainda
                    - o texto digitado NÃO é idêntico a um match existente
                */}
                {!patientId &&
                  patientQuery.trim() !== "" &&
                  !patientQueryIsExactMatch && (
                    <button
                      type="button"
                      onClick={() => {
                        setCreatingPatient(true);
                        setNewPatientName(patientQuery.trim());
                      }}
                      className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm text-brand-700 hover:bg-brand-50 dark:border-slate-800 dark:text-brand-300 dark:hover:bg-brand-950/40"
                    >
                      <UserPlus size={14} />
                      <span className="flex-1">
                        Criar novo paciente "{patientQuery.trim()}"
                      </span>
                    </button>
                  )}
              </div>
            )}

            {creatingPatient && (
              <div className="mt-2 space-y-3 rounded-lg border border-brand-200 bg-brand-50/40 p-3 dark:border-brand-800 dark:bg-brand-950/30">
                <p className="text-xs font-medium text-brand-900 dark:text-brand-200">
                  Novo paciente (cadastro rápido)
                </p>
                <Input
                  label="Nome"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="Ex: Maria Silva"
                />
                <Input
                  label="Telefone (opcional)"
                  type="tel"
                  inputMode="tel"
                  value={newPatientPhone}
                  onChange={(e) =>
                    setNewPatientPhone(maskPhone(e.target.value))
                  }
                  placeholder="(00) 00000-0000"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCreatingPatient(false);
                    setNewPatientName("");
                    setNewPatientPhone("");
                  }}
                  className="text-xs text-gray-600 underline hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  Cancelar cadastro rápido
                </button>
              </div>
            )}
          </div>
        )}

        {/* Busca prestador — só p/ personal (só person) */}
        {option === "personal" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Prestador <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Buscar prestador por nome..."
              value={providerQuery}
              onChange={(e) => {
                setProviderQuery(e.target.value);
                setProviderId("");
                setCreatingProvider(false);
              }}
              disabled={creatingProvider}
            />

            {!creatingProvider && (
              <div className="mt-2 space-y-1 rounded-lg border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {filteredProviders.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProviderId(p.id);
                      setProviderQuery(p.display_name);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-slate-800 ${
                      providerId === p.id
                        ? "bg-brand-50 text-brand-900 dark:bg-brand-950/40 dark:text-brand-200"
                        : "text-gray-900 dark:text-slate-100"
                    }`}
                  >
                    <User
                      size={14}
                      className="text-gray-400 dark:text-slate-500"
                    />
                    <span className="flex-1">{p.display_name}</span>
                    {providerId === p.id && (
                      <Badge variant="brand">Selecionado</Badge>
                    )}
                  </button>
                ))}

                {!hasProviderMatch && providerQuery.trim() !== "" && (
                  <p className="px-3 py-2 text-xs text-gray-500 dark:text-slate-400">
                    Nenhum prestador encontrado.
                  </p>
                )}

                {!providerId &&
                  providerQuery.trim() !== "" &&
                  !providerQueryIsExactMatch && (
                    <button
                      type="button"
                      onClick={() => {
                        setCreatingProvider(true);
                        setNewProviderName(providerQuery.trim());
                      }}
                      className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm text-brand-700 hover:bg-brand-50 dark:border-slate-800 dark:text-brand-300 dark:hover:bg-brand-950/40"
                    >
                      <UserPlus size={14} />
                      <span className="flex-1">
                        Criar novo prestador "{providerQuery.trim()}"
                      </span>
                    </button>
                  )}
              </div>
            )}

            {creatingProvider && (
              <div className="mt-2 space-y-3 rounded-lg border border-brand-200 bg-brand-50/40 p-3 dark:border-brand-800 dark:bg-brand-950/30">
                <p className="text-xs font-medium text-brand-900 dark:text-brand-200">
                  Novo prestador (cadastro rápido)
                </p>
                <Input
                  label="Nome"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  placeholder="Ex: Wlad"
                />
                <Input
                  label="Telefone (opcional)"
                  type="tel"
                  inputMode="tel"
                  value={newProviderPhone}
                  onChange={(e) =>
                    setNewProviderPhone(maskPhone(e.target.value))
                  }
                  placeholder="(00) 00000-0000"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCreatingProvider(false);
                    setNewProviderName("");
                    setNewProviderPhone("");
                  }}
                  className="text-xs text-gray-600 underline hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  Cancelar cadastro rápido
                </button>
              </div>
            )}
          </div>
        )}

        {/* Horário + duração */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Horário de início"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Duração
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value={30}>30 minutos</option>
              <option value={50}>50 minutos</option>
              <option value={60}>60 minutos</option>
              <option value={90}>90 minutos</option>
              <option value={120}>120 minutos</option>
            </select>
          </div>
        </div>

        {/* Observações */}
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
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
            />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Ações */}
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

// =========================================================
// Sub-componente: botão de tipo
// =========================================================
function TypeButton({
  selected,
  onClick,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border p-3 text-left transition ${
        selected
          ? "border-brand-300 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-950/30"
          : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      }`}
    >
      <span
        className={
          selected
            ? "text-brand-600 dark:text-brand-400"
            : "text-gray-400 dark:text-slate-500"
        }
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
          {title}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-slate-400">
          {subtitle}
        </p>
      </div>
    </button>
  );
}