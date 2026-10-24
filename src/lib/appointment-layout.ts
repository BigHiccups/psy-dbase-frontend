import { timeToMinutes } from "./agenda-date";
import type { AppointmentWithRelations } from "../types";

export type AppointmentLayout = {
  appointment: AppointmentWithRelations;
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
  zIndex: number;
  isPrincipal: boolean;
  isHidden: boolean;
  stackId: number;
  stackIndex: number;
};

const MAX_VISIBLE_SUB_BLOCKS = 2;

function overlaps(
  a: AppointmentWithRelations,
  b: AppointmentWithRelations
): boolean {
  // PROTEÇÃO: Se não tiver hora, não calcula sobreposição (vai para o topo)
  if (!a.start_time || !b.start_time) return false;
  
  const aStart = timeToMinutes(a.start_time);
  const aEnd = aStart + (a.duration_min || 0);
  const bStart = timeToMinutes(b.start_time);
  const bEnd = bStart + (b.duration_min || 0);
  return aStart < bEnd && bStart < aEnd;
}

function groupOverlapping(
  appointments: AppointmentWithRelations[]
): AppointmentWithRelations[][] {
  const sorted = [...appointments].sort((a, b) => {
    const aStart = a.start_time ? timeToMinutes(a.start_time) : 0;
    const bStart = b.start_time ? timeToMinutes(b.start_time) : 0;
    if (aStart !== bStart) return aStart - bStart;
    return (b.duration_min || 0) - (a.duration_min || 0);
  });

  const groups: AppointmentWithRelations[][] = [];
  const assigned = new Set<string>();

  for (const appt of sorted) {
    if (assigned.has(appt.id)) continue;

    let merged = false;
    for (const group of groups) {
      const connects = group.some((g) => overlaps(g, appt));
      if (connects) {
        group.push(appt);
        assigned.add(appt.id);
        merged = true;
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

function sortGroup(
  group: AppointmentWithRelations[]
): AppointmentWithRelations[] {
  return [...group].sort((a, b) => {
    const aStart = a.start_time ? timeToMinutes(a.start_time) : 0;
    const bStart = b.start_time ? timeToMinutes(b.start_time) : 0;
    if (aStart !== bStart) return aStart - bStart;
    return (b.duration_min || 0) - (a.duration_min || 0);
  });
}

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
    const visibleSubBlocks = subBlocks.slice(0, MAX_VISIBLE_SUB_BLOCKS);
    const subBlockWidth = visibleSubBlocks.length > 0 ? 100 / visibleSubBlocks.length : 100;

    sorted.forEach((appt, idx) => {
      const startMin = appt.start_time ? timeToMinutes(appt.start_time) : 0;
      const top = ((startMin - startHour * 60) / 60) * hourHeight;
      const height = ((appt.duration_min || 20) / 60) * hourHeight;

      if (idx === 0) {
        result.push({
          appointment: appt, top, height, leftPercent: 0, widthPercent: 100,
          zIndex: 0, isPrincipal: true, isHidden: false, stackId: groupIdx, stackIndex: 0,
        });
      } else {
        const subIndex = idx - 1;
        const isVisible = subIndex < MAX_VISIBLE_SUB_BLOCKS;
        result.push({
          appointment: appt, top, height,
          leftPercent: isVisible ? subIndex * subBlockWidth : 0,
          widthPercent: isVisible ? subBlockWidth : 100,
          zIndex: idx, isPrincipal: false, isHidden: !isVisible, stackId: groupIdx, stackIndex: idx,
        });
      }
    });
  });

  return result;
}

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