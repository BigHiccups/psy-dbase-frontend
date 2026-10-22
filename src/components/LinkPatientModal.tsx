import { useEffect, useState } from "react";
import { UserCheck } from "lucide-react";
import { Modal, Button, Input, Spinner } from "./ui";
import { supabase } from "../lib/supabase";
import type { Patient } from "../types";

type Props = {
    open: boolean;
    onClose: () => void;
    onConfirm: (patientId: string) => Promise<void>;
};

export function LinkPatientModal({ open, onClose, onConfirm }: Props) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        (async () => {
            const { data } = await supabase
                .from("patients")
                .select("*")
                .eq("status", "active")
                .order("full_name");
            setPatients(data || []);
            setLoading(false);
        })();
    }, [open]);

    const filtered = patients.filter((p) =>
        p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (p.cpf && p.cpf.includes(search))
    );

    async function handleConfirm() {
        if (!selectedId) return;
        setSaving(true);
        await onConfirm(selectedId);
        setSaving(false);
    }

    return (
        <Modal open={open} onClose={onClose} title="Vincular a um paciente existente" size="md">
            <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-slate-400">
                    Selecione o paciente abaixo para transferir os horários importados do Google para o perfil dele.
                </p>

                <Input
                    placeholder="Buscar por nome ou CPF..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-slate-800">
                    {loading ? (
                        <div className="flex justify-center p-6"><Spinner /></div>
                    ) : filtered.length === 0 ? (
                        <p className="p-4 text-center text-sm text-gray-500">Nenhum paciente encontrado.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                            {filtered.map((p) => (
                                <li
                                    key={p.id}
                                    onClick={() => setSelectedId(p.id)}
                                    className={`flex cursor-pointer items-center gap-3 p-3 text-sm transition ${selectedId === p.id
                                            ? "bg-brand-50 dark:bg-brand-950/30"
                                            : "hover:bg-gray-50 dark:hover:bg-slate-800/50"
                                        }`}
                                >
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${selectedId === p.id ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500 dark:bg-slate-800"
                                        }`}>
                                        {selectedId === p.id ? <UserCheck size={14} /> : p.full_name[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{p.full_name}</p>
                                        {p.cpf && <p className="text-xs text-gray-500">{p.cpf}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-slate-800">
                    <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={!selectedId || saving}>
                        {saving ? "Vinculando..." : "Confirmar vínculo"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}