import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Patient } from "../types";

export type BirthdayPatient = Patient & {
  birthday_day: number; // dia do mês (1-31)
  turns_age: number; // idade que completa este ano
};

export function useBirthdays() {
  const [birthdays, setBirthdays] = useState<BirthdayPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Busca pacientes ativos com birth_date preenchido
    // Filtra por mês via SQL: extract(month from birth_date) = currentMonth
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("status", "active")
      .not("birth_date", "is", null);

    if (error) {
      setError(error.message);
      setBirthdays([]);
      setLoading(false);
      return;
    }

    const result: BirthdayPatient[] = [];

    for (const p of (data ?? []) as Patient[]) {
      if (!p.birth_date) continue;
      const [y, m, d] = p.birth_date.split("-").map(Number);
      if (m !== currentMonth) continue;

      const birthYear = y;
      const turnsAge = currentYear - birthYear;

      result.push({
        ...p,
        birthday_day: d,
        turns_age: turnsAge,
      });
    }

    // Ordena por dia do mês
    result.sort((a, b) => a.birthday_day - b.birthday_day);

    setBirthdays(result);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return { birthdays, loading, error, reload: load };
}