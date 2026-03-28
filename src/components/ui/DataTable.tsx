import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

interface DataTableProps {
  children: ReactNode;
  className?: string;
}

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div className={cx("overflow-x-auto rounded-xl border border-[var(--rm-border)]/40", className)}>
      <table className="w-full min-w-[400px] text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-[var(--rm-border-subtle)] bg-[var(--rm-surface)]">
        {children}
      </tr>
    </thead>
  );
}

interface DataTableThProps {
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

export function DataTableTh({ children, align = "left", className }: DataTableThProps) {
  return (
    <th
      className={cx(
        "px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--rm-muted-subtle)]",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </th>
  );
}

interface DataTableRowProps {
  children: ReactNode;
  dimmed?: boolean;
  className?: string;
  /** Keyboard / click selection highlight (e.g. before pressing "e" to edit). */
  selected?: boolean;
  onClick?: () => void;
}

export function DataTableRow({ children, dimmed, className, selected, onClick }: DataTableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cx(
        "group border-b border-l-2 border-[var(--rm-border-subtle)]/60 border-l-transparent transition-colors last:border-0",
        !selected && "hover:bg-[var(--rm-surface)]/50",
        selected &&
          "border-l-[var(--rm-primary)]/35 bg-[var(--rm-primary)]/6 hover:bg-[var(--rm-primary)]/10",
        dimmed && "opacity-60",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  );
}

interface DataTableCellProps {
  children: ReactNode;
  align?: "left" | "right" | "center";
  muted?: boolean;
  className?: string;
}

export function DataTableCell({ children, align = "left", muted, className }: DataTableCellProps) {
  return (
    <td
      className={cx(
        "px-4 py-3",
        align === "right" && "text-right",
        align === "center" && "text-center",
        muted ? "text-[var(--rm-muted)]" : "text-[var(--rm-fg)]",
        className,
      )}
    >
      {children}
    </td>
  );
}
