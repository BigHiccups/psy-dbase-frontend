import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "psy-dbase:theme";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const isDark = theme === "dark" || (theme === "system" && prefersDark);

  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  // Aplica sempre que o tema muda
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Se "system", escuta mudanças do SO
  useEffect(() => {
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme);
    window.localStorage.setItem(STORAGE_KEY, newTheme);
  }

  return { theme, setTheme };
}