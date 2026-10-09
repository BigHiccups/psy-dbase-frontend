import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCheck,
  Building2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button, ConfirmDialog } from "./ui";
import { displayName } from "../lib/patient-display";
import type { Patient } from "../types";

type Props = {
  patient: Patient;
  onDone: () => void;
};

export function ProspectCard({ patient, onDone }: Props) {
  const navigate = useNavigate();
  const [converting, setConverting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [convertAsProviderOpen, setConvertAsProviderOpen] = useState(false);

  const cleanName = displayName(patient.full_name);

  async function handleConvertToProvider() {
    setConverting("provider");
    setError(null);

    const { error } = await supabase.rpc("convert_prospect_to_provider", {
      p_patient_id: patient.id,
      p_kind: "person",
    });

    if (error) {
      setError(error.message);
      setConverting(null);
      return;
    }

    setConverting(null);
    setConvertAsProviderOpen(false);
    onDone();
  }

  async function handleDiscard() {
    setConverting("discard");
    setError(null);

    const { error } = await supabase.rpc("discard_prospect", {
      p_patient_id: patient.id,
    });

    if (error) {
      setError(error.message);
      setConverting(null);
      return;
    }

    setConverting(null);
    setConfirmDiscard(false);
    onDone();
  }

  function handlePromoteAsPatient() {
    // Navega para o formulário de edição em modo especial
    // O PatientForm precisa detectar status='prospect' e mostrar botão "Confirmar e ativar"
    navigate(`/patients/${patient.id}/review`);
  }

  return (
    <>
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <AlertCircle size={16} />
            </div>
            <div>
              <p className="font-medium text-gray-900">{cleanName}</p>
              <p className="text-xs text-gray-500">
                Importado do Google Calendar · Nome original:{" "}
                <span className="italic">{patient.full_name}</span>
              </p>
              {patient.phone && (
                <p className="mt-0.5 text-xs text-gray-500">
                  Telefone: {patient.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="mb-3 text-xs text-red-600">Erro: {error}</p>
        )}

        {/* Ações */}
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConfirmDiscard(true)}
            disabled={converting !== null}
          >
            <Trash2 size={14} />
            Remover
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConvertAsProviderOpen(true)}
            disabled={converting !== null}
          >
            <Building2 size={14} />
            É prestador
          </Button>

          <Button
            size="sm"
            onClick={handlePromoteAsPatient}
            disabled={converting !== null}
          >
            <UserCheck size={14} />
            É paciente
          </Button>
        </div>
      </div>

      {/* Modal: converter em prestador */}
      <ConfirmDialog
        open={convertAsProviderOpen}
        onClose={() => setConvertAsProviderOpen(false)}
        onConfirm={handleConvertToProvider}
        title="Converter em prestador de serviço?"
        description={
          <>
            <p>
              <strong>{cleanName}</strong> deixará de ser paciente e passará a
              ser prestador (pessoa física). Os agendamentos vinculados serão
              marcados como <strong>compromisso pessoal</strong>.
            </p>
            <p className="mt-2 text-xs">
              Útil para terapia pessoal, supervisão, análise, etc.
            </p>
          </>
        }
        confirmLabel="Converter em prestador"
        tone="warning"
      />

      {/* Modal: descartar */}
      <ConfirmDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={handleDiscard}
        title="Remover este provisório?"
        description={
          <>
            <p>
              O cadastro de <strong>{cleanName}</strong> e todos os
              agendamentos vinculados serão <strong>removidos</strong>.
            </p>
            <p className="mt-2 text-xs">
              Use esta opção se você importou algo do Google que não é um
              atendimento (ex: bloqueio pessoal, evento esquecido).
            </p>
          </>
        }
        confirmLabel="Remover permanentemente"
        tone="danger"
      />
    </>
  );
}