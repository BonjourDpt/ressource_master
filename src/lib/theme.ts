export const THEME_STORAGE_KEY = "rm-theme";

/** Inline `beforeInteractive` script: apply stored theme before first paint (avoids flash). */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY,
)},t=localStorage.getItem(k),m=t==="light"||t==="dark"?t:"dark";document.documentElement.dataset.theme=m;document.documentElement.style.colorScheme=m==="light"?"light":"dark";}catch(e){document.documentElement.dataset.theme="dark";document.documentElement.style.colorScheme="dark";}})();`;

export type ThemeMode = "light" | "dark";

export function parseThemeMode(raw: string | null): ThemeMode | null {
  if (raw === "light" || raw === "dark") return raw;
  return null;
}

export function readThemeFromStorage(storage: Pick<Storage, "getItem">): ThemeMode | null {
  return parseThemeMode(storage.getItem(THEME_STORAGE_KEY));
}

export function writeThemeToStorage(storage: Pick<Storage, "setItem">, mode: ThemeMode): void {
  storage.setItem(THEME_STORAGE_KEY, mode);
}

export function resolveThemeForMount(stored: ThemeMode | null): ThemeMode {
  return stored ?? "dark";
}

/** Applies theme to `document.documentElement` (data-theme + color-scheme). */
export function applyThemeToDocument(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
}
