import { useState } from "react";
import { AlertCircle, CalendarX, PauseCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button, Modal, Input } from "../ui";
import { toDateString, addDays } from "../../lib/agenda-date";

type Mode = "immediate" | "from_date" | "suspend";

type Props = {
  open: boolean;
  patientId: string | null;
  patientName: string;
  onClose: () => void;
  onDone: () => void;
};

export function CancelSeriesModal({
  open,
  patientId,
  patientName,
  onClose,
  onDone,
}: Props) {
  const [mode, setMode] = useState<Mode>("immediate");
  const today = toDateString(new Date());
  const [fromDate, setFromDate] = useState(today);
  const [suspendFrom, setSuspendFrom] = useState(today);
  const [suspendTo, setSuspendTo] = useState(addDays(today, 14));
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!patientId) return;

    setWorking(true);
    setError(null);

    const params: Record<string, unknown> = {
      p_patient_id: patientId,
      p_mode: mode,
    };

    if (mode === "from_date") params.p_from_date = fromDate;
    if (mode === "suspend") {
      params.p_from_date = suspendFrom;
      params.p_to_date = suspendTo;
    }

    const { error } = await supabase.rpc("cancel_appointment_series", params);
    setWorking(false);

    if (error) {
      setError(error.message);
      return;
    }

    onDone();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Cancelar série de agendamentos" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Série de <strong>{patientName}</strong>. Escolha como proceder:
        </p>

        {/* Modo 1: imediato */}
        <ModeOption
          selected={mode === "immediate"}
          onSelect={() => setMode("immediate")}
          icon={<CalendarX size={18} />}
          title="Definitivo a partir de hoje"
          description="Cancela todos os agendamentos futuros. O combinado será removido."
        />

        {/* Modo 2: from_date */}
        <ModeOption
          selected={mode === "from_date"}
          onSelect={() => setMode("from_date")}
          icon={<CalendarX size={18} />}
          title="Definitivo a partir de uma data"
          description="Cancela agendamentos a partir de uma data escolhida."
        >
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            disabled={mode !== "from_date"}
          />
        </ModeOption>

        {/* Modo 3: suspend */}
        <ModeOption
          selected={mode === "suspend"}
          onSelect={() => setMode("suspend")}
          icon={<PauseCircle size={18} />}
          title="Suspender por período"
          description="Cancela apenas o intervalo. A série volta automaticamente depois."
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                De
              </label>
              <Input
                type="date"
                value={suspendFrom}
                onChange={(e) => setSuspendFrom(e.target.value)}
                disabled={mode !== "suspend"}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                Até
              </label>
              <Input
                type="date"
                value={suspendTo}
                onChange={(e) => setSuspendTo(e.target.value)}
                disabled={mode !== "suspend"}
              />
            </div>
          </div>
        </ModeOption>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-5">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={working}>
            {working ? "Processando..." : "Confirmar cancelamento"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ModeOption({
  selected,
  onSelect,
  icon,
  title,
  description,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${selected
          ? "border-brand-300 bg-brand-50/40"
          : "border-gray-200 bg-white hover:border-gray-300"
        }`}
    >
      <input
        type="radio"
        checked={selected}
        onChange={onSelect}
        className="mt-1 h-4 w-4 shrink-0 accent-brand-600"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={selected ? "text-brand-600" : "text-gray-400"}>
            {icon}
          </span>
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </label>
  );
}