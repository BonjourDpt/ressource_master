export type Theme = "dark" | "light";

export const STORAGE_KEY = "rm-theme";
export const DEFAULT_THEME: Theme = "dark";

const ALLOWED: readonly Theme[] = ["dark", "light"];

function isTheme(value: string): value is Theme {
  return (ALLOWED as readonly string[]).includes(value);
}

/** Read persisted theme; invalid or missing values fall back to dark. */
export function getStoredTheme(): Theme {
  if (typeof localStorage === "undefined") return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isTheme(raw)) return raw;
  } catch {
    /* private mode / blocked storage */
  }
  return DEFAULT_THEME;
}

/** Apply theme to the document root (dark removes the attribute). */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  if (theme === "light") {
    document.documentElement.dataset.theme = "light";
  } else {
    delete document.documentElement.dataset.theme;
  }
}

export function readThemeFromDocument(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** Blocking inline script for layout <head> — applies stored light theme before first paint. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('rm-theme');if(t==='light')document.documentElement.dataset.theme='light';}catch(e){}})();`;

export function persistTheme(theme: Theme): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}
