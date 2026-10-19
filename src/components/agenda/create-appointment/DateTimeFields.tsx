import { Input } from "../../ui";

type Props = {
  startTime: string;
  duration: number;
  onStartTimeChange: (v: string) => void;
  onDurationChange: (v: number) => void;
  hideDuration?: boolean;
};

export function DateTimeFields({
  startTime,
  duration,
  onStartTimeChange,
  onDurationChange,
  hideDuration = false,
}: Props) {
  return (
    <div className={`grid gap-4 ${hideDuration ? "" : "sm:grid-cols-2"}`}>
      <Input
        label="Horário de início"
        type="time"
        value={startTime}
        onChange={(e) => onStartTimeChange(e.target.value)}
        required
      />
      {!hideDuration && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Duração
          </label>
          <select
            value={duration}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value={30}>30 minutos</option>
            <option value={50}>50 minutos</option>
            <option value={60}>60 minutos</option>
            <option value={90}>90 minutos</option>
            <option value={120}>120 minutos</option>
          </select>
        </div>
      )}
    </div>
  );
}