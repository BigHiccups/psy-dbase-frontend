import {
  WEEKDAY_SHORT,
  MONTH_SHORT,
  isToday,
  parseDateString,
} from "../../lib/agenda-date";

type Props = {
  date: string; // YYYY-MM-DD
  // Se true, mostra o formato mais compacto (sem o mês)
  compact?: boolean;
  // Destaque visual (usado no DayView)
  large?: boolean;
};

export function DayHeader({ date, compact, large }: Props) {
  const d = parseDateString(date);
  const today = isToday(date);

  return (
    <div
      className={`flex flex-col items-center justify-center border-b border-gray-200 px-2 py-3 ${
        today ? "bg-brand-50/60" : ""
      }`}
    >
      <span
        className={`text-xs font-medium uppercase ${
          today ? "text-brand-700" : "text-gray-500"
        } ${large ? "text-sm" : ""}`}
      >
        {WEEKDAY_SHORT[d.getDay()]}
      </span>
      <span
        className={`mt-0.5 font-semibold ${
          large ? "text-2xl" : "text-lg"
        } ${today ? "text-brand-700" : "text-gray-900"}`}
      >
        {d.getDate()}
      </span>
      {!compact && (
        <span className="text-xs text-gray-400">
          {MONTH_SHORT[d.getMonth()]}
        </span>
      )}
    </div>
  );
}