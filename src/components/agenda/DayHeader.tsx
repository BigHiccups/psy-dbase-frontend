import { isoWeekday, WEEKDAY_SHORT, isToday, parseDateString } from "../../lib/agenda-date";
import { DayBillingsBadge } from "./DayBillingsBadge";

type Props = {
  date: string;
  large?: boolean;
  billingsCount?: number;
  onBillingsClick?: () => void;
};

export function DayHeader({ date, large, billingsCount = 0, onBillingsClick }: Props) {
  const d = parseDateString(date);
  const jsDay = d.getDay();
  const iso = isoWeekday(jsDay);
  const today = isToday(date);
  const isWeekend = jsDay === 0 || jsDay === 6;

  if (large) {
    return (
      <div
        className={`flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-slate-800 ${
          today ? "bg-brand-50/40 dark:bg-brand-950/20" : ""
        }`}
      >
        <div className="flex items-baseline gap-2">
          <span
            className={`text-sm font-medium ${
              today
                ? "text-brand-700 dark:text-brand-400"
                : isWeekend
                  ? "text-gray-400 dark:text-slate-500"
                  : "text-gray-700 dark:text-slate-300"
            }`}
          >
            {WEEKDAY_SHORT[iso]}
          </span>
          <span
            className={`text-2xl font-semibold ${
              today
                ? "text-brand-700 dark:text-brand-400"
                : "text-gray-900 dark:text-slate-100"
            }`}
          >
            {d.getDate()}
          </span>
          <span className="text-xs text-gray-500 dark:text-slate-400">
            {d.toLocaleDateString("pt-BR", { month: "long" })}
          </span>
        </div>

        {billingsCount > 0 && onBillingsClick && (
          <DayBillingsBadge count={billingsCount} onClick={onBillingsClick} />
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center py-2 ${
        today ? "bg-brand-50/40 dark:bg-brand-950/20" : ""
      }`}
    >
      <span
        className={`text-[10px] font-medium uppercase ${
          today
            ? "text-brand-700 dark:text-brand-400"
            : isWeekend
              ? "text-gray-400 dark:text-slate-500"
              : "text-gray-500 dark:text-slate-400"
        }`}
      >
        {WEEKDAY_SHORT[iso]}
      </span>
      <div className="flex items-center gap-1">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
            today
              ? "bg-brand-600 text-white"
              : "text-gray-900 dark:text-slate-100"
          }`}
        >
          {d.getDate()}
        </span>
      </div>
      {billingsCount > 0 && onBillingsClick && (
        <div className="mt-0.5">
          <DayBillingsBadge count={billingsCount} onClick={onBillingsClick} />
        </div>
      )}
    </div>
  );
}