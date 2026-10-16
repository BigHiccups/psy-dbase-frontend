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

// Input de data em formato brasileiro (dd/mm/aaaa) com máscara,
// preservando a posição do cursor ao editar no meio.
//
// Por que preservar o cursor: como o input é controlado, cada
// onChange re-renderiza com o valor mascarado. Sem reposicionar,
// o React joga o cursor pro final e o próximo dígito vai pro fim.
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
    // Vamos usar isso pra reposicionar o cursor no texto mascarado.
    const digitsBefore = raw.slice(0, cursorBefore).replace(/\D/g, "").length;

    // Encontra a posição equivalente no texto mascarado: avança até
    // ter passado `digitsBefore` dígitos.
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

  // useLayoutEffect roda antes do paint, então o cursor é reposicionado
  // sem "piscar".
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
    rounded-md border px-2 py-1.5 text-sm
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
      disabled={disabled}
      readOnly={readOnly}
      className={className ?? `${base} ${styles}`}
    />
  );
}