"use client";

import { cx } from "@/lib/cx";

export interface SegmentedTab<T extends string> {
  value: T;
  label: string;
}

interface SegmentedTabsProps<T extends string> {
  tabs: readonly SegmentedTab<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  /** Use primary tint for the active segment (e.g. planning view toggle). */
  accent?: boolean;
}

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  accent,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex h-8 items-center rounded-lg border border-[var(--rm-border)] bg-[var(--rm-surface)] p-0.5"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cx(
            "h-7 rounded-md px-3 text-xs font-medium transition-colors",
            value === tab.value
              ? accent
                ? "bg-[var(--rm-primary)]/15 text-[var(--rm-primary-text)]"
                : "bg-[var(--rm-surface-elevated)] text-[var(--rm-fg)]"
              : "text-[var(--rm-muted)] hover:text-[var(--rm-fg)]",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
