"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/planning", label: "Planning" },
  { href: "/projects", label: "Projects" },
  { href: "/resources", label: "Resources" },
] as const;

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-[var(--rm-bg)] text-[var(--rm-fg)]">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-56 shrink-0 sm:block">
          <div className="sticky top-6 space-y-4">
            <div className="px-3">
              <div className="text-sm font-semibold tracking-tight">
                Resource Master
              </div>
              <div className="text-xs text-[var(--rm-muted)]">MVP</div>
            </div>

            <nav className="rounded-2xl border border-[var(--rm-border)] bg-white/70 p-2 backdrop-blur dark:bg-black/20">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname?.startsWith(item.href + "/");

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={classNames(
                          "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-[var(--rm-surface)] text-[var(--rm-fg)]"
                            : "text-[var(--rm-muted)] hover:bg-[var(--rm-surface)] hover:text-[var(--rm-fg)]",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-6 flex items-center justify-between">
            <div className="sm:hidden">
              <div className="text-sm font-semibold tracking-tight">
                Resource Master
              </div>
              <div className="text-xs text-[var(--rm-muted)]">MVP</div>
            </div>

            <div className="hidden sm:block" />
          </header>

          <main className="rounded-3xl border border-[var(--rm-border)] bg-[var(--rm-card)] p-6 shadow-sm">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

