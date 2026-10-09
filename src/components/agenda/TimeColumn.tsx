// =========================================================
// Coluna de horários (fixa à esquerda da grade)
// Mostra 07:00, 08:00, ..., 22:00
// Cada hora ocupa uma altura fixa (HOUR_HEIGHT)
// =========================================================

export const HOUR_HEIGHT = 60; // px por hora
export const START_HOUR = 7;
export const END_HOUR = 22;

type Props = {
  // Compensa o cabeçalho de dias (mesma altura do DayHeader)
  headerHeight: number;
};

export function TimeColumn({ headerHeight }: Props) {
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i
  );

  return (
    <div className="flex w-16 shrink-0 flex-col border-r border-gray-200 bg-gray-50/50">
      {/* Espaço correspondente ao cabeçalho de dias */}
      <div
        className="border-b border-gray-200"
        style={{ height: headerHeight }}
      />

      {/* Horários */}
      {hours.map((h) => (
        <div
          key={h}
          className="relative"
          style={{ height: HOUR_HEIGHT }}
        >
          <span className="absolute -top-2 right-2 text-xs text-gray-400">
            {String(h).padStart(2, "0")}:00
          </span>
        </div>
      ))}
    </div>
  );
}