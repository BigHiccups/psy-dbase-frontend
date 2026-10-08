import { useState } from "react";
import { Check, X, Phone, User, Calendar } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button, Badge, ConfirmDialog } from "./ui";
import type { Submission } from "../hooks/useSubmissions";

type Props = {
  submission: Submission;
  onApproved: () => void;
  onRejected: () => void;
};

export function SubmissionCard({ submission, onApproved, onRejected }: Props) {
  const [working, setWorking] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);

  async function handleApprove() {
    setWorking("approve");
    setError(null);

    const { error } = await supabase.rpc("approve_submission", {
      p_submission_id: submission.id,
    });

    if (error) {
      setError(error.message);
      setWorking(null);
      return;
    }

    onApproved();
  }

  async function handleReject() {
    setWorking("reject");
    setError(null);

    const { error } = await supabase
      .from("patient_form_submissions")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", submission.id);

    if (error) {
      setError(error.message);
      setWorking(null);
      throw error; // relança para o ConfirmDialog saber que falhou
    }

    onRejected();
  }

  const createdAt = new Date(submission.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <User size={16} />
            </div>
            <div>
              <p className="font-medium text-gray-900">{submission.full_name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                {submission.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={12} />
                    {submission.phone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} />
                  {createdAt}
                </span>
              </div>
            </div>
          </div>

          <Badge variant="warning">Pendente</Badge>
        </div>

        {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConfirmRejectOpen(true)}
            disabled={working !== null}
          >
            <X size={14} />
            Rejeitar
          </Button>
          <Button size="sm" onClick={handleApprove} disabled={working !== null}>
            <Check size={14} />
            {working === "approve" ? "Aprovando..." : "Aprovar"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRejectOpen}
        onClose={() => setConfirmRejectOpen(false)}
        onConfirm={handleReject}
        title="Rejeitar esta submissão?"
        description={
          <>
            O convite não poderá ser reutilizado e o paciente <strong>não</strong>{" "}
            será cadastrado.
          </>
        }
        confirmLabel="Rejeitar"
        tone="danger"
      />
    </>
  );
}