"use client";

import { isResourceWeekOverloaded } from "@/lib/planning-view-model";

type CapacityTone = "neutral" | "warning" | "danger";

function getCapacityTone(pct: number, offPct = 0): CapacityTone {
  if (!isResourceWeekOverloaded(pct, offPct)) return "neutral";
  if (pct <= Math.max(0, 100 - offPct) + 20) return "warning";
  return "danger";
}

export function TotalPctPill({ pct, offPct = 0 }: { pct: number; offPct?: number }) {
  const tone = getCapacityTone(pct, offPct);

  if (pct === 0) {
    return <span className="text-xs tabular-nums text-[var(--rm-muted-subtle)]">–</span>;
  }

  const toneClass =
    tone === "neutral"
      ? "text-[var(--rm-muted)]"
      : tone === "warning"
        ? "text-[var(--rm-warning)]"
        : "text-[var(--rm-danger)]";

  return (
    <span
      className={`font-mono text-xs font-medium tabular-nums ${toneClass}`}
      title={
        offPct > 0
          ? `Total allocation: ${pct}% (${100 - offPct}% available after OFF)`
          : `Total allocation: ${pct}%`
      }
    >
      {pct}%
    </span>
  );
}
