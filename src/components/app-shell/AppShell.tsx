"use client";

import { AppHeader } from "./AppHeader";
import { StatusBar } from "./StatusBar";

export interface AppShellProps {
  children: React.ReactNode;
  resourceCount?: number;
  projectCount?: number;
}

export function AppShell({ children, resourceCount, projectCount }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--rm-bg)] text-[var(--rm-fg)]">
      <AppHeader />
      <div className="mx-auto w-full max-w-[1800px] flex-1 px-4 py-6 sm:px-5">
        <main className="min-w-0 pb-10">{children}</main>
      </div>
      <StatusBar resourceCount={resourceCount} projectCount={projectCount} />
    </div>
  );
}
