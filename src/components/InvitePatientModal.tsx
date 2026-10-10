import { useState } from "react";
import { Copy, Check, MessageCircle, AlertCircle } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useOccupiedSlots } from "../hooks/useOccupiedSlots";
import { ScheduleEditor } from "./agenda/ScheduleEditor";
import { maskPhone, isValidPhoneBR } from "../lib/masks";
import { toTitleCase } from "../lib/text";
import { weekdayLong } from "../lib/weekdays";
import { Button, Input, Modal } from "./ui";
import type { InviteResponse, ScheduleInput } from "../types";
const [hasScheduleConflict, setHasScheduleConflict] = useState(false);

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

  // Slots ocupados (bloqueio rígido)
  const { slots: occupiedSlots } = useOccupiedSlots();

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

    // Verifica conflito com slots ocupados
    const conflict = schedules.find((s) =>
      occupiedSlots.some(
        (o) => o.weekday === s.weekday && o.startTime === s.startTime
      )
    );
    if (conflict) {
      setError(
        `O horário de ${weekdayLong(conflict.weekday)} às ${conflict.startTime} já está ocupado.`
      );
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<InviteResponse>("/invites", {
        method: "POST",
        body: JSON.stringify({
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

          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">
              Sessões combinadas
            </p>
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

        <div className="border-t border-gray-100 pt-5">
          <ScheduleEditor
            value={schedules}
            onChange={setSchedules}
            disabledSlots={occupiedSlots}
            error={null}
            hint="Horários já ocupados aparecem em âmbar."
            onConflictChange={setHasScheduleConflict}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || hasScheduleConflict}>
            {loading
              ? "Gerando..."
              : hasScheduleConflict
                ? "Resolva os conflitos"
                : "Gerar convite e enviar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}