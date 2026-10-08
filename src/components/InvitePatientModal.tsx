import { useState } from "react";
import {
  Plus,
  Trash2,
  CalendarClock,
  Copy,
  Check,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { WEEKDAYS, weekdayLong } from "../lib/weekdays";
import { maskPhone, isValidPhoneBR } from "../lib/masks";
import { toTitleCase } from "../lib/text";
import { Button, Input, Modal, Badge } from "./ui";
import type { InviteResponse, ScheduleInput } from "../types";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

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
  const [copied, setCopied] = useState(false);

  function updateSchedule(index: number, patch: Partial<ScheduleInput>) {
    setSchedules((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  }

  function addSchedule() {
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

    if (!isValidPhoneBR(phone)) {
      setError("Telefone inválido. Use DDD + número.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<InviteResponse>("/invites", {
        method: "POST",
        body: JSON.stringify({
          // Nome normalizado silenciosamente ao enviar
          patientNameHint: patientNameHint
            ? toTitleCase(patientNameHint)
            : "",
          phone,
          schedules,
        }),
      });
      setResult(data);
      window.open(data.whatsappUrl, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // =========================================================
  // Tela de resultado
  // =========================================================
  if (result) {
    return (
      <Modal open onClose={onClose} title="Convite gerado" size="md">
        <div className="space-y-5">
          {/* Sucesso */}
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              <MessageCircle size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-green-900">
                WhatsApp aberto em nova aba
              </p>
              <p className="mt-0.5 text-xs text-green-700">
                Confira a mensagem e envie para o paciente.
              </p>
            </div>
          </div>

          {/* Sessões combinadas */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <CalendarClock size={14} className="text-brand-600" />
              <p className="text-xs font-medium text-gray-500">
                Sessões combinadas
              </p>
            </div>
            <div className="space-y-2">
              {result.schedules.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <span className="font-medium text-gray-900">
                    {weekdayLong(s.weekday)}
                  </span>
                  <span className="text-gray-500">
                    {s.startTime} · {s.durationMin} min
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Link */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">
              Link do formulário
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                {result.shortUrl}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-5">
            <Button variant="secondary" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={onSuccess}>Concluir</Button>
          </div>
        </div>
      </Modal>
    );
  }

  // =========================================================
  // Formulário
  // =========================================================
  return (
    <Modal open onClose={onClose} title="Convidar paciente" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados básicos */}
        <div className="space-y-4">
          <Input
            label="Nome do paciente"
            placeholder="Ex: Maria Silva"
            value={patientNameHint}
            onChange={(e) => setPatientNameHint(e.target.value)}
            hint="Opcional. Aparece na saudação do formulário."
          />

          <Input
            label="Telefone (WhatsApp)"
            type="tel"
            inputMode="tel"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            required
            hint="Formato brasileiro. Será normalizado para o padrão internacional."
          />
        </div>

        {/* Horários */}
        <div className="border-t border-gray-100 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-brand-600" />
              <label className="text-sm font-medium text-gray-900">
                Horários das sessões
                <span className="ml-1 text-red-500">*</span>
              </label>
              <Badge variant="brand">{schedules.length}</Badge>
            </div>
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
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/60 p-2"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700">
                  {index + 1}
                </div>

                <select
                  value={s.weekday}
                  onChange={(e) =>
                    updateSchedule(index, { weekday: Number(e.target.value) })
                  }
                  className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
                  className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
                    className="w-16 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <span className="text-xs text-gray-500">min</span>
                </div>

                <button
                  type="button"
                  onClick={() => removeSchedule(index)}
                  disabled={schedules.length === 1}
                  className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                  title={
                    schedules.length === 1
                      ? "Pelo menos um horário é obrigatório"
                      : "Remover horário"
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Este é o combinado que aparecerá para o paciente no formulário.
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-5">
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