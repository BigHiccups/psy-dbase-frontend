import { useEffect, useState } from "react";
import { PauseCircle, Calendar, Repeat, AlertTriangle } from "lucide-react";
import { Input } from "../../ui";
import { MaskedDateInput } from "../../ui/MaskedDateInput";
import { isValidDateBR, parseDateBR, formatDateBR } from "../../../lib/masks";
import { addDays } from "../../../lib/agenda-date";
import { supabase } from "../../../lib/supabase";

export type BlockMode = "range_single_day" | "all_day_single" | "multi_day";

type Props = {
    mode: BlockMode;
    onModeChange: (mode: BlockMode) => void;
    date: string;
    startTime: string;
    endTime: string;
    onStartTimeChange: (v: string) => void;
    onEndTimeChange: (v: string) => void;
    multiFromText: string;
    multiToText: string;
    onMultiFromChange: (v: string) => void;
    onMultiToChange: (v: string) => void;
};

type ImpactedItem = {
    id: string;
    date: string;
    subjectName: string;
    startTime: string;
    type: string;
};

export function BlockFields({
    mode,
    onModeChange,
    date,
    startTime,
    endTime,
    onStartTimeChange,
    onEndTimeChange,
    multiFromText,
    multiToText,
    onMultiFromChange,
    onMultiToChange,
}: Props) {
    const [impacted, setImpacted] = useState<ImpactedItem[]>([]);

    function countBlocks(): number {
        if (mode === "range_single_day" || mode === "all_day_single") return 1;
        const from = parseDateBR(multiFromText);
        const to = parseDateBR(multiToText);
        if (!from || !to || to < from) return 0;
        let count = 0;
        let cur = from;
        while (cur <= to && count < 400) {
            count++;
            cur = addDays(cur, 1);
        }
        return count;
    }

    const blockCount = countBlocks();

    // =========================================================
    // Busca de agendamentos impactados (direto do banco pela data)
    // =========================================================
    useEffect(() => {
        async function fetchImpacted() {
            let startDate = date;
            let endDate = date;
            if (mode === "multi_day") {
                const fromIso = parseDateBR(multiFromText);
                const toIso = parseDateBR(multiToText);
                if (!fromIso || !toIso || toIso < fromIso) {
                    setImpacted([]);
                    return;
                }
                startDate = fromIso;
                endDate = toIso;
            }

            const checkStart = mode === "all_day_single" ? "07:00" : startTime;
            const checkEnd = mode === "all_day_single" ? "23:59" : endTime;

            if (!checkStart || !checkEnd || checkEnd <= checkStart) {
                setImpacted([]);
                return;
            }

            // Converte "HH:MM" para minutos
            const timeToMins = (t: string) => {
                const [h, m] = t.split(":").map(Number);
                return (h || 0) * 60 + (m || 0);
            };

            const startMin = timeToMins(checkStart);
            const endMin = timeToMins(checkEnd);

            // Busca TODOS os agendamentos ativos do período (sem filtrar hora no banco)
            const { data, error } = await supabase
                .from("appointments")
                .select(
                    "id, starts_on, start_time, type, patient:patients!patient_id(full_name), provider:providers!provider_id(display_name)"
                )
                .eq("status", "active")
                .in("type", ["session", "personal"])
                .gte("starts_on", startDate)
                .lte("starts_on", endDate)
                .order("starts_on")
                .order("start_time");

            if (error || !data) {
                console.error("Erro na busca de impactados:", error);
                setImpacted([]);
                return;
            }

            // Filtra pelo horário no JS
            const filtered = data
                .filter((row) => {
                    // Pega só "HH:MM" da string "HH:MM:SS"
                    const startTimeStr = (row.start_time as string).slice(0, 5);
                    const rMin = timeToMins(startTimeStr);

                    // O agendamento colide se ele começa antes do fim do bloqueio 
                    // E termina depois do início (mesmo que ele comece antes).
                    // Como não temos a duração na query, assumimos 50min padrão pra checar colisão.
                    // Se o bloqueio é 11:00-15:00 e ele começa 12:00, 12:00 >= 11:00 e 12:00 < 15:00 -> colide.
                    return rMin >= startMin && rMin < endMin;
                })
                .map((row) => {
                    const patRel = Array.isArray(row.patient)
                        ? row.patient[0]
                        : row.patient;
                    const provRel = Array.isArray(row.provider)
                        ? row.provider[0]
                        : row.provider;
                    return {
                        id: row.id,
                        date: row.starts_on,
                        subjectName:
                            patRel?.full_name ?? provRel?.display_name ?? "Agendamento",
                        startTime: (row.start_time as string).slice(0, 5),
                        type: row.type,
                    };
                });

            setImpacted(filtered);
        }

        fetchImpacted();
    }, [mode, date, multiFromText, multiToText, startTime, endTime]);

    // =========================================================
    // Resumo
    // =========================================================
    function getSummary(): string {
        if (mode === "range_single_day") {
            if (!startTime || !endTime) return "Preencha horário de início e fim.";
            return `Vai criar 1 bloco em ${formatDateBR(date)} das ${startTime} às ${endTime}.`;
        }
        if (mode === "all_day_single") {
            return `Vai criar 1 bloco em ${formatDateBR(date)} das 07:00 às 23:59 (dia inteiro).`;
        }
        const from = parseDateBR(multiFromText);
        const to = parseDateBR(multiToText);
        if (!from || !to) return "Preencha o período.";
        if (to < from) return "Data final deve ser posterior à inicial.";
        return `Vai criar ${blockCount} ${blockCount === 1 ? "bloco" : "blocos"
            } (1 por dia, das ${startTime} às ${endTime}).`;
    }

    return (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="mb-1 flex items-center gap-2">
                <PauseCircle size={14} className="text-brand-600 dark:text-brand-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    Modo de bloqueio
                </span>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-3 gap-2">
                <ModeButton
                    selected={mode === "range_single_day"}
                    onClick={() => onModeChange("range_single_day")}
                    icon={<Calendar size={14} />}
                    label="Range num dia"
                />
                <ModeButton
                    selected={mode === "all_day_single"}
                    onClick={() => onModeChange("all_day_single")}
                    icon={<Calendar size={14} />}
                    label="Dia inteiro"
                />
                <ModeButton
                    selected={mode === "multi_day"}
                    onClick={() => onModeChange("multi_day")}
                    icon={<Repeat size={14} />}
                    label="Vários dias"
                />
            </div>

            {/* Modo 1 */}
            {mode === "range_single_day" && (
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                            Data
                        </label>
                        <div className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                            {formatDateBR(date)}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Início"
                            type="time"
                            value={startTime}
                            onChange={(e) => onStartTimeChange(e.target.value)}
                        />
                        <Input
                            label="Fim"
                            type="time"
                            value={endTime}
                            onChange={(e) => onEndTimeChange(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Modo 2 */}
            {mode === "all_day_single" && (
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                        Data
                    </label>
                    <div className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        {formatDateBR(date)}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                        Bloqueio das 07:00 às 23:59.
                    </p>
                </div>
            )}

            {/* Modo 3 */}
            {mode === "multi_day" && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                                De
                            </label>
                            <MaskedDateInput
                                value={multiFromText}
                                onChange={onMultiFromChange}
                                invalid={
                                    multiFromText.length > 0 && !isValidDateBR(multiFromText)
                                }
                                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                                Até
                            </label>
                            <MaskedDateInput
                                value={multiToText}
                                onChange={onMultiToChange}
                                invalid={multiToText.length > 0 && !isValidDateBR(multiToText)}
                                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Hora início (cada dia)"
                            type="time"
                            value={startTime}
                            onChange={(e) => onStartTimeChange(e.target.value)}
                        />
                        <Input
                            label="Hora fim (cada dia)"
                            type="time"
                            value={endTime}
                            onChange={(e) => onEndTimeChange(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Resumo */}
            <div className="rounded-md bg-white px-3 py-2 text-xs text-gray-700 dark:bg-slate-900 dark:text-slate-300">
                {getSummary()}
            </div>

            {/* Lista de Agendamentos Impactados */}
            {impacted.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
                    <div className="mb-2 flex items-center gap-2">
                        <AlertTriangle
                            size={14}
                            className="text-red-600 dark:text-red-400"
                        />
                        <span className="text-xs font-medium text-red-800 dark:text-red-200">
                            Atenção: {impacted.length} agendamento
                            {impacted.length > 1 ? "s" : ""} ativo
                            {impacted.length > 1 ? "s" : ""} será
                            {impacted.length > 1 ? "o" : ""} bloqueado
                            {impacted.length > 1 ? "s" : ""}:
                        </span>
                    </div>
                    <ul className="max-h-32 space-y-1 overflow-y-auto pr-1 text-xs text-red-700 dark:text-red-300">
                        {impacted.map((imp) => (
                            <li key={imp.id} className="flex justify-between">
                                <span>{formatDateBR(imp.date)}</span>
                                <span className="ml-2 truncate font-medium">
                                    {imp.subjectName}
                                </span>
                                <span className="ml-2">{imp.startTime}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function ModeButton({
    selected,
    onClick,
    icon,
    label,
}: {
    selected: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-medium transition ${selected
                ? "border-brand-300 bg-brand-50 text-brand-900 dark:border-brand-700 dark:bg-brand-950/40 dark:text-brand-200"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}