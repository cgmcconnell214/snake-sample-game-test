export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "theme";

export function getStoredTheme(): ThemePreference {
  if (typeof localStorage === "undefined") return "system";
  const v = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

export function applyTheme(pref?: ThemePreference) {
  try {
    const choice = pref ?? getStoredTheme();
    const root = document.documentElement;
    const isDark =
      choice === "dark" ||
      (choice === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

    root.classList.toggle("dark", isDark);
  } catch (e) {
    // no-op in SSR or restricted environments
  }
}

export function setTheme(pref: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {}
  applyTheme(pref);
}
