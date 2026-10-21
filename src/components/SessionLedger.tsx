import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Badge, Spinner, EmptyState } from "./ui";
import { centsToCurrencyBRL } from "../lib/masks";
import { Paperclip, Calendar } from "lucide-react";

type Props = {
    subjectId: string;
    subjectType: "patient" | "provider";
};

type LedgerRow = {
    id: string;
    date: string;
    time: string;
    sessionNumber: number | null;
    status: string;
    paymentFormat: string;
    paymentStatus: "paid" | "pending" | "none";
    paymentDate: string | null;
    amount: number;
    receiptUrl: string | null;
};

// Helper para formatar data
function formatBR(iso: string): string {
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
}

export function SessionLedger({ subjectId, subjectType }: Props) {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<LedgerRow[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            setError(null);

            try {
                // 1. Busca os dados básicos do sujeito (para pegar o 'session_number_start' e 'payment_format')
                const table = subjectType === "patient" ? "patients" : "providers";
                const { data: subject, error: subErr } = await supabase
                    .from(table)
                    .select("session_number_start, payment_format")
                    .eq("id", subjectId)
                    .single();

                if (subErr) throw subErr;

                // 2. Busca os agendamentos (passando a buscar payment_format da transação)
                const { data: appts, error: apptErr } = await supabase
                    .from("appointments")
                    .select(`
            id, starts_on, start_time, status,
            transaction:transactions (id, paid_on, amount_cents, receipt_url, payment_format)
          `)
                    .eq(subjectType === "patient" ? "patient_id" : "provider_id", subjectId)
                    .neq("status", "cancelled")
                    .order("starts_on", { ascending: true })
                    .order("start_time", { ascending: true });

                if (apptErr) throw apptErr;

                // 3. Calcula o Nº da Sessão dinamicamente
                let currentSessionNum = subject?.session_number_start || 0;

                const ledgerData: LedgerRow[] = (appts || []).map((appt: any) => {
                    currentSessionNum += 1;

                    const tx = Array.isArray(appt.transaction) ? appt.transaction[0] : appt.transaction;

                    let pStatus = "none";
                    if (tx) {
                        pStatus = tx.paid_on ? "paid" : "pending";
                    }

                    // Lógica: Pega da transação, se não tiver pega do paciente
                    const effectiveFormat = tx?.payment_format || subject?.payment_format || "avulso";

                    return {
                        id: appt.id,
                        date: appt.starts_on,
                        time: appt.start_time.slice(0, 5),
                        sessionNumber: currentSessionNum,
                        status: appt.status,
                        paymentFormat: effectiveFormat,
                        paymentStatus: pStatus as any,
                        paymentDate: tx?.paid_on || null,
                        amount: tx?.amount_cents || 0,
                        receiptUrl: tx?.receipt_url || null,
                    };
                });

                setRows(ledgerData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro ao carregar extrato.");
            } finally {
                setLoading(false);
            }
        }

        if (subjectId) load();
    }, [subjectId, subjectType]);

    if (loading) {
        return <div className="p-8 flex justify-center"><Spinner size={24} /></div>;
    }

    if (error) {
        return <div className="p-4 text-sm text-red-600">{error}</div>;
    }

    if (rows.length === 0) {
        return <EmptyState icon={<Calendar size={20} />} title="Nenhum histórico" description="Ainda não há sessões registradas para este perfil." />;
    }

    // Cálculos de totalizadores
    const totalReceived = rows.filter(r => r.paymentStatus === "paid").reduce((acc, r) => acc + r.amount, 0);
    const totalAttended = rows.filter(r => r.status === "completed").length;

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-800/60 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Sessão</th>
                            <th className="px-4 py-3">Data</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Forma</th>
                            <th className="px-4 py-3">Pagamento</th>
                            <th className="px-4 py-3 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {rows.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">
                                    #{r.sessionNumber}
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-slate-400">
                                    {formatBR(r.date)} <span className="text-xs opacity-70">às {r.time}</span>
                                </td>
                                <td className="px-4 py-3">
                                    {r.status === "completed" && <Badge variant="success">Realizada</Badge>}
                                    {r.status === "no_show_justified" && <Badge variant="warning">Falta Justificada</Badge>}
                                    {r.status === "no_show_unjustified" && <Badge variant="danger">Falta Injustificada</Badge>}
                                    {r.status === "active" && <Badge variant="neutral">Agendada</Badge>}
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-slate-400 capitalize">
                                    {r.paymentFormat}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        {r.paymentStatus === "paid" ? (
                                            <Badge variant="success">Pago {r.paymentDate ? formatBR(r.paymentDate) : ""}</Badge>
                                        ) : r.paymentStatus === "pending" ? (
                                            <Badge variant="warning">Pendente</Badge>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                        {r.receiptUrl && (
                                            <button
                                                title="Ver comprovante"
                                                className="text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                                onClick={() => { /* O modal de visualização pode ser acoplado aqui depois */ }}
                                            >
                                                <Paperclip size={14} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-slate-100">
                                    {r.amount > 0 ? `R$ ${centsToCurrencyBRL(r.amount)}` : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-slate-800/50">
                        <tr>
                            <td colSpan={3} className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400">
                                Total de Atendimentos:
                            </td>
                            <td colSpan={2} className="px-4 py-3 font-semibold text-gray-900 dark:text-slate-100">
                                {totalAttended}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-slate-100">
                                R$ {centsToCurrencyBRL(totalReceived)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}