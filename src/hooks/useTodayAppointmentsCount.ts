import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { toDateString } from "../lib/agenda-date";

export function useTodayAppointmentsCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const today = toDateString(new Date());

    const { count: total, error } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("starts_on", today)
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