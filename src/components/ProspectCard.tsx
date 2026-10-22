import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCheck, Building2, Trash2, AlertCircle, Link as LinkIcon } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button, ConfirmDialog, AlertDialog } from "./ui";
import { LinkPatientModal } from "./LinkPatientModal";
import { displayName } from "../lib/patient-display";
import type { Patient } from "../types";

type Props = {
  patient: Patient;
  onDone: () => void;
};

export function ProspectCard({ patient, onDone }: Props) {
  const navigate = useNavigate();
  const [converting, setConverting] = useState<string | null>(null);
  const [convertAsProviderOpen, setConvertAsProviderOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  
  const [alertState, setAlertState] = useState<{ title: string; message: string; tone: "error" | "success" } | null>(null);

  const cleanName = displayName(patient.full_name);

  async function handleConvertToProvider() {
    setConverting("provider");
    const { error } = await supabase.rpc("convert_prospect_to_provider", {
      p_patient_id: patient.id,
      p_kind: "person",
    });

    if (error) {
      setAlertState({ title: "Erro", message: error.message, tone: "error" });
      setConverting(null);
      return;
    }
    setConverting(null);
    setConvertAsProviderOpen(false);
    onDone();
  }

  async function handleDiscard() {
    setConverting("discard");
    const { error } = await supabase.rpc("discard_prospect", {
      p_patient_id: patient.id,
    });

    if (error) {
      setAlertState({ title: "Erro", message: error.message, tone: "error" });
      setConverting(null);
      return;
    }
    setConverting(null);
    setConfirmDiscard(false);
    onDone();
  }

  async function handleMerge(existingPatientId: string) {
    const { error } = await supabase.rpc("merge_prospect_into_patient", {
      p_prospect_id: patient.id,
      p_existing_patient_id: existingPatientId,
    });

    if (error) {
      setAlertState({ title: "Erro ao vincular", message: error.message, tone: "error" });
      return;
    }

    setLinkModalOpen(false);
    setAlertState({ title: "Sucesso", message: "Horários vinculados ao paciente existente!", tone: "success" });
    setTimeout(() => onDone(), 1500);
  }

  return (
    <>
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
              <AlertCircle size={16} />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-slate-100">{cleanName}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Importado do Google Calendar · Nome original: <span className="italic">{patient.full_name}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConfirmDiscard(true)} disabled={converting !== null}>
            <Trash2 size={14} /> Remover
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setConvertAsProviderOpen(true)} disabled={converting !== null}>
            <Building2 size={14} /> É prestador
          </Button>
          
          {/* NOVO BOTÃO AQUI */}
          <Button variant="secondary" size="sm" onClick={() => setLinkModalOpen(true)} disabled={converting !== null}>
            <LinkIcon size={14} /> Vincular Existente
          </Button>

          <Button size="sm" onClick={() => navigate(`/patients/${patient.id}/review`)} disabled={converting !== null}>
            <UserCheck size={14} /> É novo paciente
          </Button>
        </div>
      </div>

      <LinkPatientModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onConfirm={handleMerge}
      />

      <ConfirmDialog
        open={convertAsProviderOpen}
        onClose={() => setConvertAsProviderOpen(false)}
        onConfirm={handleConvertToProvider}
        title="Converter em prestador de serviço?"
        description={<> <strong>{cleanName}</strong> deixará de ser paciente e passará a ser prestador (pessoa física).</>}
        confirmLabel="Converter em prestador"
        tone="warning"
      />

      <ConfirmDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={handleDiscard}
        title="Remover este provisório?"
        description={<> O cadastro de <strong>{cleanName}</strong> e todos os agendamentos vinculados serão <strong>removidos</strong>.</>}
        confirmLabel="Remover permanentemente"
        tone="danger"
      />

      <AlertDialog
        open={alertState !== null}
        onClose={() => { setAlertState(null); if(alertState?.tone === "success") onDone(); }}
        title={alertState?.title ?? ""}
        message={alertState?.message}
        tone={alertState?.tone ?? "info"}
      />
    </>
  );
}