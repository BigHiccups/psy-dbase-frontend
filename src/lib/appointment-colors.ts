import type { AppointmentType } from "../types";

// Mapeamento de cores por tipo de appointment
// Usado nos blocos da agenda (fundo + borda + texto)
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
    bg: "bg-brand-100",
    border: "border-brand-400",
    text: "text-brand-900",
    dot: "bg-brand-500",
    label: "Sessão",
  },
  personal: {
    bg: "bg-gray-200",
    border: "border-gray-400",
    text: "text-gray-800",
    dot: "bg-gray-500",
    label: "Pessoal",
  },
  blocked: {
    bg: "bg-gray-100 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.05)_4px,rgba(0,0,0,0.05)_8px)]",
    border: "border-gray-300",
    text: "text-gray-600",
    dot: "bg-gray-400",
    label: "Bloqueio",
  },
  due: {
    bg: "bg-amber-100",
    border: "border-amber-400",
    text: "text-amber-900",
    dot: "bg-amber-500",
    label: "Vencimento",
  },
};