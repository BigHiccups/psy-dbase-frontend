import { monthGridDates } from "../../lib/agenda-date";
import { MonthDayCell } from "./MonthDayCell";
import { billingHappensOnDate } from "../../lib/billings-date";
import type { AppointmentWithRelations } from "../../types";
import type { BillingWithProvider } from "../../hooks/useAllUpcomingBillings";

type Props = {
  monthStr: string;
  appointments: AppointmentWithRelations[];
  billings?: BillingWithProvider[];
  onDayClick: (date: string) => void;
  onCancelledClick: (date: string) => void;
  onBillingsClick?: (date: string, billings: BillingWithProvider[]) => void;
};

const WEEKDAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

export function MonthView({
  monthStr,
  appointments,
  billings = [],
  onDayClick,
  onCancelledClick,
  onBillingsClick,
}: Props) {
  const dates = monthGridDates(monthStr);

  return (
    // Adicionamos o w-full e overflow-hidden no container externo
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Cabeçalho fixo de 7 colunas */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-900/50">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[10px] font-medium text-gray-500 dark:text-slate-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid de dias: O Grid nativo força exatamente 7 colunas iguais */}
      <div className="grid grid-cols-7">
        {dates.map((dateStr, index) => {
          const dayBillings = billings.filter((b) =>
            billingHappensOnDate(b.starts_on, b.due_day, b.frequency, dateStr)
          );

          // Adiciona bordas verticais (direita) e horizontais (fundo)
          const isLastColumn = (index + 1) % 7 === 0;

          return (
            <div
              key={dateStr}
              className={`border-b border-gray-100 dark:border-slate-800 ${
                !isLastColumn ? "border-r" : ""
              }`}
            >
              <MonthDayCell
                date={dateStr}
                monthStr={monthStr}
                appointments={appointments}
                billings={dayBillings}
                onClick={() => onDayClick(dateStr)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}