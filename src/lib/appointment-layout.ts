import { timeToMinutes } from "./agenda-date";
import type { AppointmentWithRelations } from "../types";

export type AppointmentLayout = {
  appointment: AppointmentWithRelations;
  // Posicionamento vertical (em px, baseado em HOUR_HEIGHT)
  top: number;
  height: number;
  // Posicionamento horizontal (em %)
  leftPercent: number;
  widthPercent: number;
  // Z-index
  zIndex: number;
  // Se é o "principal" (não é sub-bloco)
  isPrincipal: boolean;
  // Se está oculto pelo limite de sub-blocos
  isHidden: boolean;
  // ID do grupo de sobreposição (para agrupar e contar ocultos)
  stackId: number;
  // Índice do sub-bloco dentro do grupo (0 = principal)
  stackIndex: number;
};

// Limite de sub-blocos visíveis por grupo
const MAX_VISIBLE_SUB_BLOCKS = 2;

// Detecta se dois appointments se sobrepõem no tempo
function overlaps(
  a: AppointmentWithRelations,
  b: AppointmentWithRelations
): boolean {
  const aStart = timeToMinutes(a.start_time);
  const aEnd = aStart + a.duration_min;
  const bStart = timeToMinutes(b.start_time);
  const bEnd = bStart + b.duration_min;
  return aStart < bEnd && bStart < aEnd;
}

// Agrupa appointments por sobreposição transitiva
// Retorna array de grupos; cada grupo é um array de appointments
function groupOverlapping(
  appointments: AppointmentWithRelations[]
): AppointmentWithRelations[][] {
  const sorted = [...appointments].sort((a, b) => {
    const aStart = timeToMinutes(a.start_time);
    const bStart = timeToMinutes(b.start_time);
    if (aStart !== bStart) return aStart - bStart;
    // Empate no start: o mais longo primeiro
    return b.duration_min - a.duration_min;
  });

  const groups: AppointmentWithRelations[][] = [];
  const assigned = new Set<string>();

  for (const appt of sorted) {
    if (assigned.has(appt.id)) continue;

    // Busca o grupo onde este appointment se conecta
    let merged = false;
    for (const group of groups) {
      const connects = group.some((g) => overlaps(g, appt));
      if (connects) {
        // Se já se conecta a outro grupo, precisa fundir
        group.push(appt);
        assigned.add(appt.id);
        merged = true;

        // Funde grupos que agora se conectam
        for (let i = groups.length - 1; i >= 0; i--) {
          if (groups[i] === group) continue;
          const shouldMerge = groups[i].some((g) =>
            group.some((h) => overlaps(g, h))
          );
          if (shouldMerge) {
            group.push(...groups[i]);
            groups.splice(i, 1);
          }
        }
        break;
      }
    }

    if (!merged) {
      groups.push([appt]);
      assigned.add(appt.id);
    }
  }

  return groups;
}

// Ordena um grupo para determinar quem é o principal e quem são sub-blocos
function sortGroup(
  group: AppointmentWithRelations[]
): AppointmentWithRelations[] {
  return [...group].sort((a, b) => {
    const aStart = timeToMinutes(a.start_time);
    const bStart = timeToMinutes(b.start_time);
    if (aStart !== bStart) return aStart - bStart;
    // Empate: o mais longo primeiro (vira principal)
    return b.duration_min - a.duration_min;
  });
}

// Calcula o layout completo
// hourHeight: altura de 1 hora em px (ex: 60)
// startHour: hora inicial da grade (ex: 7)
export function computeLayout(
  appointments: AppointmentWithRelations[],
  hourHeight: number,
  startHour: number
): AppointmentLayout[] {
  const groups = groupOverlapping(appointments);
  const result: AppointmentLayout[] = [];

  groups.forEach((group, groupIdx) => {
    const sorted = sortGroup(group);
    const subBlocks = sorted.slice(1);

    // Conta quantos sub-blocos ficam visíveis
    const visibleSubBlocks = subBlocks.slice(0, MAX_VISIBLE_SUB_BLOCKS);

    // Calcula a largura de cada sub-bloco visível
    const subBlockWidth =
      visibleSubBlocks.length > 0 ? 100 / visibleSubBlocks.length : 100;

    sorted.forEach((appt, idx) => {
      const startMin = timeToMinutes(appt.start_time);
      const top = ((startMin - startHour * 60) / 60) * hourHeight;
      const height = (appt.duration_min / 60) * hourHeight;

      if (idx === 0) {
        // Principal: 100% de largura, z-index baixo
        result.push({
          appointment: appt,
          top,
          height,
          leftPercent: 0,
          widthPercent: 100,
          zIndex: 0,
          isPrincipal: true,
          isHidden: false,
          stackId: groupIdx,
          stackIndex: 0,
        });
      } else {
        const subIndex = idx - 1;
        const isVisible = subIndex < MAX_VISIBLE_SUB_BLOCKS;

        result.push({
          appointment: appt,
          top,
          height,
          leftPercent: isVisible ? subIndex * subBlockWidth : 0,
          widthPercent: isVisible ? subBlockWidth : 100,
          zIndex: idx,
          isPrincipal: false,
          isHidden: !isVisible,
          stackId: groupIdx,
          stackIndex: idx,
        });
      }
    });

    // Se há sub-blocos ocultos, ainda precisamos de um "grupo" para o +N
    // (feito na renderização, não aqui)
    // void hiddenCount;
  });

  return result;
}

// Conta sub-blocos ocultos por stackId
export function countHiddenByStack(
  layouts: AppointmentLayout[]
): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const l of layouts) {
    if (l.isHidden) {
      counts[l.stackId] = (counts[l.stackId] ?? 0) + 1;
    }
  }
  return counts;
}