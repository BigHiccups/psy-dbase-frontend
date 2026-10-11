export const HOUR_HEIGHT = 60;
export const START_HOUR = 7;
export const END_HOUR = 22;

type Props = {
  headerHeight: number;
};

export function TimeColumn({ headerHeight }: Props) {
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i
  );

  return (
    <div className="flex w-16 shrink-0 flex-col border-r border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-900">
      <div
        className="border-b border-gray-200 dark:border-slate-800"
        style={{ height: headerHeight }}
      />

      {hours.map((h) => (
        <div
          key={h}
          className="relative"
          style={{ height: HOUR_HEIGHT }}
        >
          <span className="absolute -top-2 right-2 text-xs font-medium text-gray-500 dark:text-slate-300">
            {String(h).padStart(2, "0")}:00
          </span>
        </div>
      ))}
    </div>
  );
}