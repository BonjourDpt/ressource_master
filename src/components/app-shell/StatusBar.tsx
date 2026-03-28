"use client";

export interface StatusBarProps {
  resourceCount?: number;
  projectCount?: number;
}

export function StatusBar({ resourceCount, projectCount }: StatusBarProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 flex h-8 items-center border-t border-[var(--rm-border-subtle)]/20 bg-[var(--rm-bg)] px-4 font-mono text-[10px] uppercase tracking-widest">
      <span className="text-[var(--rm-primary-text)]">{resourceCount ?? 0} resources</span>
      <span className="mx-3 text-[var(--rm-muted-subtle)]">&middot;</span>
      <span className="text-[var(--rm-muted)]">{projectCount ?? 0} projects</span>
    </footer>
  );
}
