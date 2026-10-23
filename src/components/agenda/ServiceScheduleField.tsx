import { useEffect, useState, useRef } from "react";
import { WEEKDAYS } from "../../lib/weekdays";
import { MaskedDateInput } from "../ui/MaskedDateInput";
import { parseDateBR, formatDateBR } from "../../lib/masks";
import type { ScheduleInput, RecurrenceType } from "../../types";
import { Check, Palette } from "lucide-react";

// Cores organizadas
const COLORS = [
  { name: 'Padrão', hex: '' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Esmeralda', hex: '#10b981' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Lima', hex: '#84cc16' },
  { name: 'Amarelo', hex: '#eab308' },
  { name: 'Laranja', hex: '#f97316' },
  { name: 'Vermelho', hex: '#ef4444' },
  { name: 'Rosa', hex: '#f43f5e' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Roxo', hex: '#a855f7' },
  { name: 'Índigo', hex: '#6366f1' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Ciano', hex: '#06b6d4' },
  { name: 'Cinza', hex: '#64748b' },
  { name: 'Marrom', hex: '#78350f' },
];

type Props = {
  value: ScheduleInput;
  onChange: (value: ScheduleInput) => void;
  recurrenceType: RecurrenceType;
  onRecurrenceChange: (type: RecurrenceType) => void;
};

export function ServiceScheduleField({ value, onChange, recurrenceType, onRecurrenceChange }: Props) {
  const [dateText, setDateText] = useState("");
  const [hasTime, setHasTime] = useState(!!value.startTime);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Fecha o seletor de cores se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setIsColorPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isYearly = recurrenceType === "yearly";
  const isDateBased = ["monthly", "bimonthly", "quarterly", "semiannual", "yearly"].includes(recurrenceType);

  useEffect(() => {
    if (value.anchorDate) setDateText(formatDateBR(value.anchorDate));
    else setDateText("");
  }, [value.anchorDate]);

  useEffect(() => {
    if (isYearly && hasTime) {
      setHasTime(false);
      onChange({ ...value, startTime: null, durationMin: null });
    }
  }, [isYearly]);

  const handleDateChange = (maskedValue: string) => {
    setDateText(maskedValue);
    const iso = parseDateBR(maskedValue);
    if (iso) {
      const [y, m, d] = iso.split("-").map(Number);
      const weekday = new Date(y, m - 1, d).getDay();
      onChange({ ...value, anchorDate: iso, weekday });
    } else {
      onChange({ ...value, anchorDate: null });
    }
  };

  const handleTimeToggle = (checked: boolean) => {
    setHasTime(checked);
    if (checked) {
      onChange({ ...value, startTime: value.startTime || "14:00", durationMin: value.durationMin || 50 });
    } else {
      onChange({ ...value, startTime: null, durationMin: null });
    }
  };

  // Pega as 3 primeiras cores (Padrão, Teal, Esmeralda) para mostrar na tela
  const quickColors = COLORS.slice(0, 3);

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
      
      {/* SELETOR DE COR (Compacto) */}
      <div className="flex items-center gap-3 mb-2 relative" ref={colorPickerRef}>
        <label className="text-xs font-medium text-gray-600 dark:text-slate-300">
          Cor do serviço:
        </label>
        
        <div className="flex items-center gap-1.5">
          {/* Mostra as 3 cores rápidas */}
          {quickColors.map(c => {
            const isSelected = (c.hex === '' && !value.color) || (c.hex !== '' && value.color === c.hex);
            return (
              <button
                key={c.hex || 'default'}
                type="button"
                onClick={() => onChange({ ...value, color: c.hex || null })}
                className={`flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:scale-110 ${
                  isSelected ? 'ring-2 ring-brand-500 ring-offset-1 dark:ring-offset-slate-900' : ''
                } ${c.hex === '' ? 'border border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-800' : ''}`}
                style={c.hex ? { backgroundColor: c.hex } : {}}
                title={c.name}
              >
                {isSelected && <Check size={12} className={c.hex === '' ? "text-brand-600" : "text-white"} strokeWidth={3} />}
              </button>
            );
          })}

          {/* Botão para abrir o menu com todas as cores */}
          <button
            type="button"
            onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
            className={`ml-1 flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
              isColorPickerOpen 
                ? 'border-brand-500 bg-brand-50 text-brand-600 dark:border-brand-400 dark:bg-brand-950/50 dark:text-brand-400' 
                : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
            title="Mais cores"
          >
            <Palette size={12} />
          </button>
        </div>

        {/* Popover com todas as cores */}
        {isColorPickerOpen && (
          <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800 animate-in fade-in zoom-in-95 duration-100">
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map(c => {
                const isSelected = (c.hex === '' && !value.color) || (c.hex !== '' && value.color === c.hex);
                return (
                  <button
                    key={c.hex || 'default'}
                    type="button"
                    onClick={() => {
                      onChange({ ...value, color: c.hex || null });
                      setIsColorPickerOpen(false);
                    }}
                    className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110 ${
                      isSelected ? 'ring-2 ring-brand-500 ring-offset-1 dark:ring-offset-slate-800' : ''
                    } ${c.hex === '' ? 'border border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-700' : ''}`}
                    style={c.hex ? { backgroundColor: c.hex } : {}}
                    title={c.name}
                  >
                    {isSelected && <Check size={14} className={c.hex === '' ? "text-brand-600" : "text-white"} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Frequência
          </label>
          <select
            value={recurrenceType}
            onChange={(e) => onRecurrenceChange(e.target.value as RecurrenceType)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="weekly">Semanal</option>
            <option value="biweekly">Quinzenal</option>
            <option value="monthly">Mensal</option>
            <option value="bimonthly">Bimestral</option>
            <option value="quarterly">Trimestral</option>
            <option value="semiannual">Semestral</option>
            <option value="yearly">Anual</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Data de Início
          </label>
          <MaskedDateInput
            value={dateText}
            onChange={handleDateChange}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
        <label className={`flex items-center gap-2 cursor-pointer ${isYearly ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="checkbox"
            checked={hasTime && !isYearly}
            disabled={isYearly}
            onChange={(e) => handleTimeToggle(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Definir horário específico (sessão)
          </span>
        </label>
      </div>

      {hasTime && !isYearly && (
        <div className="flex items-end gap-3 pt-2">
          {!isDateBased && (
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">
                Dia da semana
              </label>
              <select
                value={value.weekday}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
              >
                {WEEKDAYS.map((w) => (
                  <option key={w.value} value={w.value}>{w.long}</option>
                ))}
              </select>
            </div>
          )}

          <div className={isDateBased ? "w-full flex gap-3" : "flex gap-3"}>
            <div className={isDateBased ? "flex-1" : ""}>
              <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Hora</label>
              <input
                type="time"
                value={value.startTime || ""}
                onChange={(e) => onChange({ ...value, startTime: e.target.value })}
                className={`rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${isDateBased ? 'w-full' : 'w-[110px]'}`}
              />
            </div>

            <div className={isDateBased ? "flex-1" : ""}>
              <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Duração</label>
              <div className="relative">
                <input
                  type="number"
                  min={15}
                  max={240}
                  step={5}
                  value={value.durationMin || 50}
                  onChange={(e) => onChange({ ...value, durationMin: Number(e.target.value) })}
                  className={`rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${isDateBased ? 'w-full' : 'w-[80px]'}`}
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  min
                </span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}