import { useState } from "react";
import {
  addDays,
  addWeeks,
  toDateString,
  toMonthString,
} from "../lib/agenda-date";

export type AgendaView = "day" | "week" | "month";

const STORAGE_KEY = "psy-dbase:agenda-view";

// Lê o modo salvo no localStorage (fallback: "week")
function getSavedView(): AgendaView {
  if (typeof window === "undefined") return "week";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "day" || saved === "week" || saved === "month") return saved;
  return "week";
}

export function useAgendaView() {
  const [view, setViewState] = useState<AgendaView>(getSavedView);
  const [date, setDate] = useState<string>(toDateString(new Date()));

  function setView(newView: AgendaView) {
    setViewState(newView);
    window.localStorage.setItem(STORAGE_KEY, newView);
  }

  function goPrevious() {
    if (view === "day") setDate(addDays(date, -1));
    else if (view === "week") setDate(addWeeks(date, -1));
    else setDate(addDays(date, -30)); // aproximação: mês anterior
  }

  function goNext() {
    if (view === "day") setDate(addDays(date, 1));
    else if (view === "week") setDate(addWeeks(date, 1));
    else setDate(addDays(date, 30));
  }

  function goToday() {
    setDate(toDateString(new Date()));
  }

  return {
    view,
    setView,
    date,
    setDate,
    goPrevious,
    goNext,
    goToday,
  };
}

// Retorna o range de datas que a view atual precisa carregar
// (facilita o uso do useAppointments)
export function getViewRange(view: AgendaView, date: string) {
  if (view === "day") return { from: date, to: date };
  if (view === "week") {
    // Chama os helpers de agenda-date
    // (movido para cá para centralizar)
    const d = new Date(date + "T00:00:00");
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    const from = toDateString(d);
    d.setDate(d.getDate() + 6);
    const to = toDateString(d);
    return { from, to };
  }
  // month
  const month = toMonthString(date);
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  // Estende para semanas completas (grade do mês)
  const dayFirst = first.getDay();
  const diffFirst = dayFirst === 0 ? -6 : 1 - dayFirst;
  first.setDate(first.getDate() + diffFirst);
  const dayLast = last.getDay();
  const diffLast = dayLast === 0 ? 0 : 7 - dayLast;
  last.setDate(last.getDate() + diffLast);
  return { from: toDateString(first), to: toDateString(last) };
}

