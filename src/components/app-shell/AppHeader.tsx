"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";
import { HelpButton } from "./HelpDialog";

const navItems = [
  { href: "/planning", label: "Planning" },
  { href: "/projects", label: "Projects" },
  { href: "/resources", label: "Resources" },
  { href: "/admin", label: "Admin" },
] as const;

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--rm-border-subtle)]/20 bg-[var(--rm-bg)]">
      <div className="mx-auto flex h-14 max-w-[1800px] items-center gap-8 px-4 sm:px-5">
        <div className="flex shrink-0 items-baseline gap-2">
          <span className="text-sm font-bold tracking-tighter text-[var(--rm-primary-text)]">
            Resource Master
          </span>
        </div>

        <nav aria-label="Main" className="min-w-0 flex-1">
          <ul className="flex items-center gap-1 sm:gap-6">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname?.startsWith(item.href + "/");

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cx(
                      "block border-b-2 border-transparent pb-2.5 pt-2 text-sm transition-colors",
                      active
                        ? "border-[var(--rm-primary-text)] font-medium text-[var(--rm-fg)]"
                        : "text-[var(--rm-muted)] hover:text-[var(--rm-fg)]",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <HelpButton />
      </div>
    </header>
  );
}
