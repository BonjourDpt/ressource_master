"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlanningTable } from "./PlanningTable";
import { addWeeks, formatWeekLabel, getWeekRange } from "@/lib/weeks";
import {
  buildPlanningMatrix,
  resourceWeekTotals,
  type BookingWithRelations,
  type ProjectModel,
  type ResourceModel,
} from "@/lib/planning-view-model";
import type { PlanningViewMode } from "./TimelineHeader";
import { cx } from "@/lib/cx";

interface PlanningGridProps {
  projects: ProjectModel[];
  resources: ResourceModel[];
  bookings: BookingWithRelations[];
  startWeek: Date;
  span: number;
}

export function PlanningGrid({
  projects,
  resources,
  bookings,
  startWeek,
  span,
}: PlanningGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = (searchParams.get("view") as PlanningViewMode) || "project";
  const weekRange = useMemo(() => getWeekRange(startWeek, span), [startWeek, span]);

  const groups = useMemo(
    () => buildPlanningMatrix(view, projects, resources, bookings, weekRange),
    [view, projects, resources, bookings, weekRange],
  );

  const resWeekTotals = useMemo(() => resourceWeekTotals(bookings), [bookings]);

  const [activeCellKey, setActiveCellKey] = useState<string | null>(null);

  useEffect(() => {
    setActiveCellKey(null);
  }, [view, startWeek.getTime(), span]);

  const setView = (v: PlanningViewMode) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("view", v);
    router.push(`/planning?${p.toString()}`);
  };

  const shiftWeeks = (delta: number) => {
    const newStart = addWeeks(startWeek, delta);
    const p = new URLSearchParams(searchParams.toString());
    p.set("weekStart", newStart.toISOString().slice(0, 10));
    router.push(`/planning?${p.toString()}`);
  };

  const groupListEmpty = view === "project" ? projects.length === 0 : resources.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-lg font-medium tracking-tight text-[var(--rm-fg)]">Planning</h1>

        <div className="flex flex-wrap items-center gap-6">
          <div role="tablist" aria-label="Group by" className="flex items-center gap-4 text-sm">
            <button
              type="button"
              role="tab"
              aria-selected={view === "project"}
              onClick={() => setView("project")}
              className={cx(
                "border-b-2 border-transparent pb-0.5 transition-colors",
                view === "project"
                  ? "border-[var(--rm-fg)] font-medium text-[var(--rm-fg)]"
                  : "text-[var(--rm-muted)] hover:text-[var(--rm-fg)]",
              )}
            >
              By project
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "resource"}
              onClick={() => setView("resource")}
              className={cx(
                "border-b-2 border-transparent pb-0.5 transition-colors",
                view === "resource"
                  ? "border-[var(--rm-fg)] font-medium text-[var(--rm-fg)]"
                  : "text-[var(--rm-muted)] hover:text-[var(--rm-fg)]",
              )}
            >
              By resource
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--rm-muted)]">
            <button
              type="button"
              onClick={() => shiftWeeks(-1)}
              className="rounded px-1.5 py-1 transition-colors hover:bg-[var(--rm-surface)] hover:text-[var(--rm-fg)]"
              aria-label="Previous week"
            >
              ←
            </button>
            <span className="min-w-[8.5rem] text-center text-xs tabular-nums sm:text-sm">
              {formatWeekLabel(weekRange[0] ?? startWeek)} –{" "}
              {formatWeekLabel(weekRange[span - 1] ?? startWeek)}
            </span>
            <button
              type="button"
              onClick={() => shiftWeeks(1)}
              className="rounded px-1.5 py-1 transition-colors hover:bg-[var(--rm-surface)] hover:text-[var(--rm-fg)]"
              aria-label="Next week"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <PlanningTable
        view={view}
        weekRange={weekRange}
        groups={groups}
        resWeekTotals={resWeekTotals}
        projects={projects}
        resources={resources}
        activeCellKey={activeCellKey}
        onActiveCellKeyChange={setActiveCellKey}
        groupListEmpty={groupListEmpty}
      />
    </div>
  );
}
