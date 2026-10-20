// Verifica se um vencimento cai numa data específica (YYYY-MM-DD)
export function billingHappensOnDate(
  starts_on: string,
  due_day: number,
  frequency: string,
  targetDate: string,
  due_month: number | null = null
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

  if (frequency === "yearly") {
    // Se due_month estiver definido, o mês do vencimento é ele (não o mês de starts_on)
    if (due_month !== null) {
      return targetM === due_month;
    }
    // Fallback (dados antigos sem due_month): usa o mês de starts_on
    return monthsDiff % 12 === 0;
  }

  return false;
}