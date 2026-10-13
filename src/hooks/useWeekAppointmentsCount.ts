import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { startOfWeek, endOfWeek, toDateString } from "../lib/agenda-date";

export function useWeekAppointmentsCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const today = toDateString(new Date());
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    const { count: total, error } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .gte("starts_on", weekStart)
      .lte("starts_on", weekEnd)
      .neq("type", "due");

    if (error) {
      setError(error.message);
      setCount(0);
    } else {
      setCount(total ?? 0);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return { count, loading, error, reload: load };
}