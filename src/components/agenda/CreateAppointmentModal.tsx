import { useState } from "react";
import { Plus, AlertCircle, User, Ban, UserCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button, Modal, Input, Badge } from "../ui";
import { usePatients } from "../../hooks/usePatients";
import { formatLongDate, 
// timeToMinutes,
} from "../../lib/agenda-date";
import type { AppointmentType } from "../../types";

type Props = {
  open: boolean;
  date: string;         // YYYY-MM-DD
  initialHour: number;  // hora do slot clicado
  onClose: () => void;
  onCreated: () => void;
};

type Option = "session" | "blocked";

export function CreateAppointmentModal({
  open,
  date,
  initialHour,
  onClose,
  onCreated,
}: Props) {
  const [option, setOption] = useState<Option>("session");
  const [patientId, setPatientId] = useState<string>("");
  const [patientQuery, setPatientQuery] = useState("");
  const [startTime, setStartTime] = useState(
    `${String(initialHour).padStart(2, "0")}:00`
  );
  const [duration, setDuration] = useState(50);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { patients } = usePatients("active");

  // Filtra pacientes pela busca
  const filteredPatients = patientQuery
    ? patients.filter((p) =>
        p.full_name.toLowerCase().includes(patientQuery.toLowerCase())
      )
    : patients.slice(0, 5);

  async function handleSubmit() {
    setError(null);

    if (option === "session" && !patientId) {
      setError("Selecione um paciente.");
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

    const payload = {
      user_id: user.id,
      patient_id: option === "session" ? patientId : null,
      type: (option === "session" ? "session" : "blocked") as AppointmentType,
      weekday: new Date(date + "T00:00:00").getDay(),
      start_time: startTime + ":00",
      duration_min: duration,
      starts_on: date,
      ends_on: date,
      is_recurring: false,
      status: "active" as const,
      notes: notes.trim() || null,
    };

    const { error } = await supabase.from("appointments").insert(payload);
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    onCreated();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo agendamento" size="lg">
      <div className="space-y-5">
        {/* Data em destaque */}
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">Data</p>
          <p className="text-sm font-medium text-gray-900">
            {formatLongDate(date)}
          </p>
        </div>

        {/* Tipo */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Tipo de agendamento
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOption("session")}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left transition ${
                option === "session"
                  ? "border-brand-300 bg-brand-50/50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <UserCircle
                size={18}
                className={
                  option === "session" ? "text-brand-600" : "text-gray-400"
                }
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Sessão</p>
                <p className="text-xs text-gray-500">Com paciente</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOption("blocked")}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left transition ${
                option === "blocked"
                  ? "border-brand-300 bg-brand-50/50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <Ban
                size={18}
                className={
                  option === "blocked" ? "text-brand-600" : "text-gray-400"
                }
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Bloqueio</p>
                <p className="text-xs text-gray-500">Férias, pausa, etc.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Paciente (só se sessão) */}
        {option === "session" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Paciente <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Buscar paciente..."
              value={patientQuery}
              onChange={(e) => setPatientQuery(e.target.value)}
            />
            <div className="mt-2 space-y-1 rounded-lg border border-gray-200 bg-white">
              {filteredPatients.length === 0 && (
                <p className="px-3 py-2 text-xs text-gray-500">
                  Nenhum paciente encontrado.
                </p>
              )}
              {filteredPatients.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPatientId(p.id);
                    setPatientQuery(p.full_name);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${
                    patientId === p.id ? "bg-brand-50 text-brand-900" : ""
                  }`}
                >
                  <User size={14} className="text-gray-400" />
                  <span className="flex-1">{p.full_name}</span>
                  {patientId === p.id && <Badge variant="brand">Selecionado</Badge>}
                </button>
              ))}
            </div>
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
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Duração
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value={30}>30 minutos</option>
              <option value={50}>50 minutos</option>
              <option value={60}>60 minutos</option>
              <option value={90}>90 minutos</option>
              <option value={120}>120 minutos</option>
            </select>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Observações
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Opcional"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-5">
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