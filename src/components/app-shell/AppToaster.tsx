"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { readThemeFromStorage, resolveThemeForMount, type ThemeMode } from "@/lib/theme";

export function AppToaster() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = readThemeFromStorage(localStorage);
    const initial = resolveThemeForMount(stored);
    queueMicrotask(() => setTheme(initial));

    const onThemeChange = (e: Event) => {
      const detail = (e as CustomEvent<ThemeMode>).detail;
      if (detail === "light" || detail === "dark") {
        queueMicrotask(() => setTheme(detail));
      }
    };
    window.addEventListener("rm-theme-change", onThemeChange);
    return () => window.removeEventListener("rm-theme-change", onThemeChange);
  }, []);

  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--rm-surface-elevated)",
          border: "1px solid var(--rm-border)",
          color: "var(--rm-fg)",
        },
      }}
    />
  );
}
