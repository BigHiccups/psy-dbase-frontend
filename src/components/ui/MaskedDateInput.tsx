import { useLayoutEffect, useRef } from "react";
import { maskDateBR } from "../../lib/masks";

type Props = {
  value: string;                        // "dd/mm/aaaa"
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  placeholder?: string;
  className?: string;
};

// Identifica o segmento sob uma posição do cursor no texto "dd/mm/aaaa"
type Segment = "day" | "month" | "year" | null;

function getSegmentAt(text: string, cursor: number): Segment {
  // Texto tem formato "dd/mm/aaaa" (ou parcial)
  // Posições: 0-1 dia, 2 "/", 3-4 mês, 5 "/", 6-9 ano
  if (cursor <= 2) return "day";
  if (cursor <= 5) return "month";
  return "year";
}

// Extrai partes numéricas "dd", "mm", "aaaa" do texto (ou null se incompleto)
function parseParts(text: string): {
  day: number | null;
  month: number | null;
  year: number | null;
} {
  const m = text.match(/^(\d{0,2})\/?(\d{0,2})\/?(\d{0,4})$/);
  if (!m) return { day: null, month: null, year: null };
  const [, d, mo, y] = m;
  return {
    day: d ? Number(d) : null,
    month: mo ? Number(mo) : null,
    year: y ? Number(y) : null,
  };
}

// Formata partes de volta pra "dd/mm/aaaa" (com zeros à esquerda)
function formatParts(day: number, month: number, year: number): string {
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  const yyyy = String(year).padStart(4, "0");
  return `${dd}/${mm}/${yyyy}`;
}

// Último dia do mês informado (para clamp de dia)
function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Aplica incremento/decremento em um segmento, retornando o texto novo
// ou null se o campo estiver incompleto (não faz nada).
function adjustSegment(
  text: string,
  segment: Segment,
  delta: number
): string | null {
  if (!segment) return null;

  const { day, month, year } = parseParts(text);

  // Se o campo estiver incompleto no segmento que estamos editando, não faz nada
  if (day === null || month === null || year === null) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  if (segment === "day") {
    let newDay = day + delta;
    let newMonth = month;
    let newYear = year;

    if (newDay < 1) {
      // volta pro último dia do mês anterior
      newMonth -= 1;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
      newDay = lastDayOfMonth(newYear, newMonth);
    } else if (newDay > lastDayOfMonth(year, month)) {
      // passa pro dia 1 do próximo mês
      newDay = 1;
      newMonth += 1;
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
    }

    return formatParts(newDay, newMonth, newYear);
  }

  if (segment === "month") {
    let newMonth = month + delta;
    let newYear = year;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    // Se o dia não existe no novo mês, clampa pro último dia
    const lastDay = lastDayOfMonth(newYear, newMonth);
    const newDay = Math.min(day, lastDay);

    return formatParts(newDay, newMonth, newYear);
  }

  if (segment === "year") {
    const newYear = year + delta;
    if (newYear < 1900 || newYear > 2200) return null;

    // Se for 29/02 e o ano novo não for bissexto, clampa pra 28/02
    if (month === 2 && day === 29 && lastDayOfMonth(newYear, 2) < 29) {
      return formatParts(28, 2, newYear);
    }

    return formatParts(day, month, newYear);
  }

  return null;
}

// Mapeia o segmento pra uma posição de cursor padrão (onde o usuário
// deveria estar depois da edição com seta)
function cursorForSegment(segment: Segment): number {
  if (segment === "day") return 0;
  if (segment === "month") return 3;
  if (segment === "year") return 6;
  return 0;
}

// Input de data em formato brasileiro (dd/mm/aaaa) com máscara,
// preservando a posição do cursor ao editar no meio, e aceitando
// ↑/↓ pra incrementar/decrementar o segmento sob o cursor.
export function MaskedDateInput({
  value,
  onChange,
  disabled,
  readOnly,
  invalid,
  placeholder = "dd/mm/aaaa",
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorPosRef = useRef<number | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const cursorBefore = e.target.selectionStart ?? raw.length;

    const masked = maskDateBR(raw);

    // Conta quantos dígitos existem antes do cursor no texto bruto.
    const digitsBefore = raw.slice(0, cursorBefore).replace(/\D/g, "").length;

    // Encontra a posição equivalente no texto mascarado.
    let newPos = masked.length;
    let seen = 0;
    for (let i = 0; i < masked.length; i++) {
      if (/\d/.test(masked[i])) seen++;
      if (seen >= digitsBefore) {
        newPos = i + 1;
        break;
      }
    }

    cursorPosRef.current = newPos;
    onChange(masked);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    if (readOnly || disabled) return;

    const input = e.currentTarget;
    const cursor = input.selectionStart ?? 0;

    const segment = getSegmentAt(value, cursor);
    const delta = e.key === "ArrowUp" ? 1 : -1;

    const next = adjustSegment(value, segment, delta);
    if (next === null) return; // campo incompleto — não faz nada

    e.preventDefault();

    // Coloca o cursor no início do segmento editado
    cursorPosRef.current = cursorForSegment(segment);
    onChange(next);
  }

  // useLayoutEffect roda antes do paint — cursor é reposicionado sem "piscar"
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (cursorPosRef.current === null) return;
    if (document.activeElement !== input) return;

    const pos = Math.min(cursorPosRef.current, input.value.length);
    input.setSelectionRange(pos, pos);
    cursorPosRef.current = null;
  }, [value]);

  const base = `
    h-9 rounded-md border px-2 text-sm
    transition focus:outline-none focus:ring-2
    disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
    dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500
  `;

  const styles = invalid
    ? "border-red-400 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200"
    : "border-gray-300 bg-white text-gray-900 focus:border-brand-500 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      readOnly={readOnly}
      className={className ?? `${base} ${styles}`}
    />
  );
}