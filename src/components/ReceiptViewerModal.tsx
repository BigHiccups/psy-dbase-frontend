import { useEffect, useState } from "react";
import { ExternalLink, FileText, Image as ImageIcon } from "lucide-react";
import { Modal, Button, Spinner } from "./ui";
import { supabase } from "../lib/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
  filePath: string | null;
  title?: string;
};

export function ReceiptViewerModal({ open, onClose, filePath, title = "Comprovante" }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !filePath) return;
    setLoading(true);
    setError(null);

    (async () => {
      const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(filePath, 60 * 60); // 1 hora

      if (error) {
        setError(error.message);
      } else {
        setSignedUrl(data.signedUrl);
      }
      setLoading(false);
    })();
  }, [open, filePath]);

  if (!open) return null;

  // Detecta a extensão pelo path (fallback) ou pela URL (se tiver token)
  const pathLower = filePath?.toLowerCase() ?? "";
  const isImage = pathLower.match(/\.(jpeg|jpg|gif|png|webp)$/) !== null;
  const isPdf = pathLower.endsWith(".pdf");

  return (
    <Modal open={open} onClose={onClose} title={title} size="xl">
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size={24} />
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center text-red-600 dark:text-red-400">
            <p>Erro ao carregar comprovante.</p>
            <p className="text-xs opacity-70">{error}</p>
          </div>
        ) : signedUrl ? (
          <div className="flex flex-col gap-4">
            {/* Container de visualização */}
            <div className="flex max-h-[65vh] w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-slate-800 dark:bg-slate-900/50">
              {isImage ? (
                <img
                  src={signedUrl}
                  alt="Comprovante"
                  className="max-h-[60vh] max-w-full object-contain drop-shadow-md"
                />
              ) : isPdf ? (
                <iframe
                  src={`${signedUrl}#toolbar=0`}
                  className="h-[60vh] w-full rounded-lg bg-white"
                  title="PDF Comprovante"
                />
              ) : (
                <div className="flex flex-col items-center py-10 text-gray-500">
                  <FileText size={48} className="mb-2 opacity-50" />
                  <p>Formato não suportado para visualização direta.</p>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                {isImage ? <ImageIcon size={16} /> : <FileText size={16} />}
                <span className="truncate max-w-[200px] sm:max-w-xs">
                  {filePath?.split("/").pop()}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={onClose}>
                  Fechar
                </Button>
                <Button onClick={() => window.open(signedUrl, "_blank")}>
                  <ExternalLink size={16} />
                  Abrir em nova aba
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}