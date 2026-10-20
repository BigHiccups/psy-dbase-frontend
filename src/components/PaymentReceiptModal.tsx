import { useState, useRef } from "react";
import { UploadCloud, X, FileText } from "lucide-react";
import { Modal, Button } from "./ui";
import { supabase } from "../lib/supabase";
import type { Transaction } from "../types";

type Props = {
    open: boolean;
    transaction: Transaction | null;
    onClose: () => void;
    onConfirm: (fileUrl: string | null) => Promise<void>;
};

export function PaymentReceiptModal({ open, transaction, onClose, onConfirm }: Props) {
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!transaction) return null;
    const safeTransaction = transaction;

    async function handleConfirm() {
        setError(null);
        let finalUrl = safeTransaction.receipt_url;


        if (file) {
            setUploading(true);
            try {
                const { data: user } = await supabase.auth.getUser();
                if (!user.user) throw new Error("Sessão expirada.");

                const fileExt = file.name.split(".").pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${user.user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("receipts")
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Salva o caminho relativo (não a URL pública, pois o bucket é privado)
                finalUrl = filePath;
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro ao fazer upload.");
                setUploading(false);
                return;
            }
        }

        await onConfirm(finalUrl);
        setUploading(false);
        setFile(null);
    }

    return (
        <Modal open={open} onClose={onClose} title="Confirmar Pagamento" size="md">
            <div className="space-y-5">
                <div className="rounded-lg bg-brand-50 p-4 dark:bg-brand-950/30">
                    <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
                        {transaction.description}
                    </p>
                    <p className="text-xs text-brand-600 dark:text-brand-400">
                        A transação será marcada como Paga.
                    </p>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Anexar comprovante / nota fiscal (opcional)
                    </label>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />

                    {!file ? (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-6 text-sm text-gray-600 transition hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-brand-600 dark:hover:bg-brand-950/30"
                        >
                            <UploadCloud size={20} />
                            Clique para selecionar (PDF ou Imagem)
                        </button>
                    ) : (
                        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                            <div className="flex items-center gap-3">
                                <FileText size={20} className="text-brand-600" />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setFile(null)}
                                className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-slate-800">
                    <Button variant="secondary" onClick={onClose} disabled={uploading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={uploading}>
                        {uploading ? "Enviando..." : file ? "Salvar com anexo" : "Marcar como Pago"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}