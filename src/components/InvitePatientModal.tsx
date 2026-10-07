import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch } from "../lib/api";
import { WEEKDAYS } from "../lib/weekdays";
import { Button, Input, Modal } from "./ui";
import type { InviteResponse, ScheduleInput } from "../types";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

// Linha padrão de horário ao abrir o modal
const INITIAL_SCHEDULE: ScheduleInput = {
  weekday: 1,
  startTime: "14:00",
  durationMin: 50,
};

export function InvitePatientModal({ onClose, onSuccess }: Props) {
  const [patientNameHint, setPatientNameHint] = useState("");
  const [phone, setPhone] = useState("");
  const [schedules, setSchedules] = useState<ScheduleInput[]>([
    { ...INITIAL_SCHEDULE },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteResponse | null>(null);

  function updateSchedule(index: number, patch: Partial<ScheduleInput>) {
    setSchedules((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  }

  function addSchedule() {
    // Sugere o próximo dia após o último para agilizar
    const last = schedules[schedules.length - 1];
    const nextWeekday = last ? (last.weekday + 1) % 7 : 1;
    setSchedules((prev) => [
      ...prev,
      { ...INITIAL_SCHEDULE, weekday: nextWeekday },
    ]);
  }

  function removeSchedule(index: number) {
    setSchedules((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (schedules.length === 0) {
      setError("Informe pelo menos um horário de sessão.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<InviteResponse>("/invites", {
        method: "POST",
        body: JSON.stringify({ patientNameHint, phone, schedules }),
      });
      setResult(data);
      window.open(data.whatsappUrl, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <Modal open onClose={onClose} title="Convite gerado">
        <p className="mb-4 text-sm text-gray-500">
          O WhatsApp foi aberto em nova aba com a mensagem pronta. Se não
          abriu, copie o link abaixo.
        </p>

        <div className="mb-4 rounded-lg bg-gray-50 p-3 text-xs break-all text-gray-600">
          {result.shortUrl}
        </div>

        <div className="mb-4 rounded-lg border border-gray-200 p-3">
          <p className="mb-2 text-xs font-medium text-gray-500">
            Sessões combinadas
          </p>
          <ul className="space-y-1 text-sm text-gray-700">
            {result.schedules.map((s, i) => (
              <li key={i}>
                {WEEKDAYS.find((w) => w.value === s.weekday)?.long} às{" "}
                {s.startTime}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => navigator.clipboard.writeText(result.shortUrl)}
          >
            Copiar link
          </Button>
          <Button onClick={onSuccess}>Concluir</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Convidar paciente" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Nome do paciente (opcional)"
          placeholder="Ex: Maria Silva"
          value={patientNameHint}
          onChange={(e) => setPatientNameHint(e.target.value)}
        />

        <Input
          label="Telefone (WhatsApp)"
          type="tel"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        {/* Horários das sessões */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Horários das sessões
              <span className="ml-1 text-red-500">*</span>
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addSchedule}
            >
              <Plus size={14} />
              Adicionar
            </Button>
          </div>

          <div className="space-y-2">
            {schedules.map((s, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2"
              >
                <select
                  value={s.weekday}
                  onChange={(e) =>
                    updateSchedule(index, { weekday: Number(e.target.value) })
                  }
                  className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  {WEEKDAYS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.long}
                    </option>
                  ))}
                </select>

                <input
                  type="time"
                  value={s.startTime}
                  onChange={(e) =>
                    updateSchedule(index, { startTime: e.target.value })
                  }
                  className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                />

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={15}
                    max={240}
                    step={5}
                    value={s.durationMin}
                    onChange={(e) =>
                      updateSchedule(index, {
                        durationMin: Number(e.target.value),
                      })
                    }
                    className="w-16 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">min</span>
                </div>

                <button
                  type="button"
                  onClick={() => removeSchedule(index)}
                  disabled={schedules.length === 1}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Remover horário"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Define o combinado que aparecerá para o paciente no formulário.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Gerando..." : "Gerar convite e enviar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}