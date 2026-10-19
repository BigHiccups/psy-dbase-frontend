
// Verifica se um vencimento cai numa data específica (YYYY-MM-DD)
export function billingHappensOnDate(
  starts_on: string,
  due_day: number,
  frequency: string,
  targetDate: string
): boolean {
  const [targetY, targetM, targetD] = targetDate.split("-").map(Number);
  const [startY, startM] = starts_on.split("-").map(Number);

  // 1. Não pode ser antes do início
  if (targetY < startY || (targetY === startY && targetM < startM)) {
    return false;
  }

  // 2. O dia do mês tem que bater (com tratamento para dias 29, 30, 31)
  const lastDayOfMonth = new Date(targetY, targetM, 0).getDate();
  const effectiveDueDay = Math.min(due_day, lastDayOfMonth);

  if (targetD !== effectiveDueDay) return false;

  // 3. Frequência
  if (frequency === "once") {
    return targetY === startY && targetM === startM && targetD === effectiveDueDay;
  }

  const monthsDiff = (targetY - startY) * 12 + (targetM - startM);

  if (frequency === "monthly") return true;
  if (frequency === "bimonthly") return monthsDiff % 2 === 0;
  if (frequency === "semiannual") return monthsDiff % 6 === 0;
  if (frequency === "yearly") return monthsDiff % 12 === 0;

  return false;
}