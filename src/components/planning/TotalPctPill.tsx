"use client";

import { useMemo } from "react";

type CapacityTone = "neutral" | "warning" | "danger";

function getCapacityTone(pct: number): CapacityTone {
  if (pct <= 100) return "neutral";
  if (pct <= 120) return "warning";
  return "danger";
}

export function TotalPctPill({ pct }: { pct: number }) {
  const tone = useMemo(() => getCapacityTone(pct), [pct]);

  if (pct === 0) {
    return <span className="tabular-nums text-[12px] text-[var(--rm-muted-subtle)]">–</span>;
  }

  const classes =
    tone === "neutral"
      ? "inline-flex items-center rounded-full border border-[var(--rm-primary)]/25 bg-[var(--rm-primary)]/10 px-2 py-0.5 text-[12px] font-semibold text-[var(--rm-primary)]"
      : tone === "warning"
        ? "inline-flex items-center rounded-full border border-[var(--rm-warning)]/25 bg-[var(--rm-warning)]/10 px-2 py-0.5 text-[12px] font-semibold text-[var(--rm-warning)]"
        : "inline-flex items-center rounded-full border border-[var(--rm-danger)]/25 bg-[var(--rm-danger)]/10 px-2 py-0.5 text-[12px] font-semibold text-[var(--rm-danger)]";

  return (
    <span className={classes} title={`Total allocation: ${pct}%`}>
      {pct}%
    </span>
  );
}

