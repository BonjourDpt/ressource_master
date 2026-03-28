"use client";

type CapacityTone = "neutral" | "warning" | "danger";

function getCapacityTone(pct: number): CapacityTone {
  if (pct <= 100) return "neutral";
  if (pct <= 120) return "warning";
  return "danger";
}

export function TotalPctPill({ pct }: { pct: number }) {
  const tone = getCapacityTone(pct);

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
      title={`Total allocation: ${pct}%`}
    >
      {pct}%
    </span>
  );
}
