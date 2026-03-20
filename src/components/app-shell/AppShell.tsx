"use client";

import { AppHeader } from "./AppHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--rm-bg)] text-[var(--rm-fg)]">
      <AppHeader />

      <div className="mx-auto w-full max-w-[1800px] flex-1 px-4 py-6 sm:px-5">
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
