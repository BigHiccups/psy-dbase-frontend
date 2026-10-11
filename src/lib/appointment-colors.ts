import type { AppointmentType } from "../types";

export const TYPE_STYLES: Record<
  AppointmentType,
  {
    bg: string;
    border: string;
    text: string;
    dot: string;
    label: string;
  }
> = {
  session: {
    bg: "bg-brand-100 dark:bg-brand-900/50",
    border: "border-brand-400 dark:border-brand-500",
    text: "text-brand-900 dark:text-brand-100",
    dot: "bg-brand-500 dark:bg-brand-400",
    label: "Sessão",
  },
  personal: {
    bg: "bg-gray-200 dark:bg-slate-700",
    border: "border-gray-400 dark:border-slate-500",
    text: "text-gray-800 dark:text-slate-100",
    dot: "bg-gray-500 dark:bg-slate-400",
    label: "Pessoal",
  },
  blocked: {
    bg: "bg-gray-100 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.05)_4px,rgba(0,0,0,0.05)_8px)] dark:bg-slate-800 dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.05)_4px,rgba(255,255,255,0.05)_8px)]",
    border: "border-gray-300 dark:border-slate-600",
    text: "text-gray-600 dark:text-slate-300",
    dot: "bg-gray-400 dark:bg-slate-500",
    label: "Bloqueio",
  },
  due: {
    bg: "bg-amber-100 dark:bg-amber-900/40",
    border: "border-amber-400 dark:border-amber-600",
    text: "text-amber-900 dark:text-amber-100",
    dot: "bg-amber-500 dark:bg-amber-400",
    label: "Vencimento",
  },
};