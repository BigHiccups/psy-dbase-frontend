import { useEffect, useRef, useState } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme, type Theme } from "../../hooks/useTheme";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const CurrentIcon =
    OPTIONS.find((o) => o.value === theme)?.icon ?? Monitor;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        title="Tema"
        aria-label="Alternar tema"
      >
        <CurrentIcon size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                    : "text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={14} />
                <span className="flex-1 text-left">{opt.label}</span>
                {isActive && <Check size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}