import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type IconName = "folder" | "users" | "calendar" | "search";

function Icon({ name, size }: { name: IconName; size: number }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "folder":
      return (
        <svg {...props}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
  }
}

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: string;
  action?: ReactNode;
  /** Compact variant for filtered/search-miss states inside an existing layout. */
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div className={cx("flex flex-col items-center justify-center text-center", compact ? "py-10" : "py-16")}>
      <div className={cx("text-[var(--rm-muted-subtle)]", compact ? "mb-3" : "mb-4")}>
        <Icon name={icon} size={compact ? 32 : 48} />
      </div>
      <h2 className={cx("font-medium text-[var(--rm-fg)]", compact ? "text-sm" : "text-base")}>{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-[var(--rm-muted)]">{description}</p>
      {action && <div className={cx(compact ? "mt-4" : "mt-6")}>{action}</div>}
    </div>
  );
}
