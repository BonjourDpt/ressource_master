"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyThemeToDocument,
  readThemeFromStorage,
  resolveThemeForMount,
  writeThemeToStorage,
  type ThemeMode,
} from "@/lib/theme";
import { cx } from "@/lib/cx";

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = readThemeFromStorage(localStorage);
    const initial = resolveThemeForMount(stored);
    queueMicrotask(() => {
      setTheme(initial);
      applyThemeToDocument(initial);
    });
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      writeThemeToStorage(localStorage, next);
      applyThemeToDocument(next);
      // Defer so listeners (e.g. AppToaster) do not setState during this update.
      queueMicrotask(() => {
        window.dispatchEvent(new CustomEvent("rm-theme-change", { detail: next }));
      });
      return next;
    });
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className={cx(
        "shrink-0 rounded-md p-1.5 text-[var(--rm-muted)] transition-colors",
        "hover:bg-[var(--rm-surface-elevated)] hover:text-[var(--rm-fg)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rm-primary)]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rm-bg)]",
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
