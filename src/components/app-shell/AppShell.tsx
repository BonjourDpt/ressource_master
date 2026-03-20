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
              <div className="text-sm font-semibold tracking-tight text-[var(--rm-fg)]">
                Resource Master
              </div>
              <div className="text-xs text-[var(--rm-muted)]">v1.3</div>
            </div>

            <nav className="rounded-lg border border-[var(--rm-border)] bg-[var(--rm-surface)] p-2">
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
                          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-[var(--rm-bg)] text-[var(--rm-fg)]"
                            : "text-[var(--rm-muted)] hover:bg-[var(--rm-bg)] hover:text-[var(--rm-fg)]",
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
              <div className="text-sm font-semibold tracking-tight text-[var(--rm-fg)]">
                Resource Master
              </div>
              <div className="text-xs text-[var(--rm-muted)]">v1.3</div>
            </div>

            <div className="hidden sm:block" />
          </header>

          <main className="rounded-lg border border-[var(--rm-border)] bg-[var(--rm-surface)] p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
