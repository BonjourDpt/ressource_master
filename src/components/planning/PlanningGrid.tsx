"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlanningTable } from "./PlanningTable";
import { addWeeks, formatWeekLabel, getWeekRange, toWeekStartKey } from "@/lib/weeks";
import {
  buildPlanningMatrix,
  mergeDraftRowsIntoGroups,
  resourceWeekTotals,
  type BookingWithRelations,
  type PlanningDraftAllocationLine,
  type PlanningEditingCell,
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

function newDraftId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `draft:${crypto.randomUUID()}`;
  }
  return `draft:${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

  const [editingCell, setEditingCell] = useState<PlanningEditingCell>(null);
  const [draftLines, setDraftLines] = useState<PlanningDraftAllocationLine[]>([]);

  const mergedGroups = useMemo(
    () => mergeDraftRowsIntoGroups(groups, draftLines, weekRange, projects, resources),
    [groups, draftLines, weekRange, projects, resources],
  );

  const focusOrder = useMemo(() => {
    const order: { rowId: string; weekId: string }[] = [];
    for (const g of mergedGroups) {
      for (const row of g.rows) {
        if (row.rowType !== "allocation") continue;
        if (!row.projectId || !row.resourceId) continue;
        for (const cell of row.weeks) {
          order.push({ rowId: row.id, weekId: cell.weekStart });
        }
      }
    }
    return order;
  }, [mergedGroups]);

  useEffect(() => {
    setEditingCell(null);
    setDraftLines([]);
  }, [view, startWeek.getTime(), span]);

  useEffect(() => {
    setDraftLines((prev) =>
      prev.filter((draft) => {
        const g = groups.find((x) => x.groupId === draft.groupId);
        if (!g || !draft.pairedEntityId) return true;
        const pid = g.mode === "project" ? g.groupId : draft.pairedEntityId;
        const rid = g.mode === "resource" ? g.groupId : draft.pairedEntityId;
        const serverHasLine = g.rows.some(
          (r) =>
            r.rowType === "allocation" &&
            r.projectId === pid &&
            r.resourceId === rid,
        );
        return !serverHasLine;
      }),
    );
  }, [groups]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const flat = mergedGroups.flatMap((g) =>
      g.rows.map((r) => ({
        groupId: g.groupId,
        rowId: r.id,
        rowType: r.rowType,
        projectId: r.projectId,
        resourceId: r.resourceId,
      })),
    );
    console.debug("[planning] rowType per row", flat);
  }, [mergedGroups]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.debug("[planning] editingCell", editingCell);
  }, [editingCell]);

  useEffect(() => {
    if (!editingCell) return;
    const rowExists = mergedGroups.some((g) =>
      g.rows.some((r) => r.id === editingCell.rowId),
    );
    if (!rowExists) setEditingCell(null);
  }, [mergedGroups, editingCell]);

  const onTabNavigate = useCallback(
    (rowId: string, weekId: string, delta: number) => {
      const idx = focusOrder.findIndex((x) => x.rowId === rowId && x.weekId === weekId);
      if (idx < 0) return;
      const next = focusOrder[idx + delta];
      setEditingCell(next ?? null);
    },
    [focusOrder],
  );

  const onAddAllocationRow = useCallback((groupId: string) => {
    setDraftLines((prev) => [...prev, { id: newDraftId(), groupId, pairedEntityId: null }]);
  }, []);

  const onDraftPairChange = useCallback(
    (draftRowId: string, pairedEntityId: string) => {
      setDraftLines((prev) =>
        prev.map((d) => (d.id === draftRowId ? { ...d, pairedEntityId } : d)),
      );
      const firstWk = weekRange[0] ? toWeekStartKey(weekRange[0]) : null;
      if (firstWk) {
        setEditingCell({ rowId: draftRowId, weekId: firstWk });
      }
    },
    [weekRange],
  );

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
        groups={mergedGroups}
        resWeekTotals={resWeekTotals}
        projects={projects}
        resources={resources}
        editingCell={editingCell}
        onEditingCellChange={setEditingCell}
        onTabNavigate={onTabNavigate}
        onAddAllocationRow={onAddAllocationRow}
        onDraftPairChange={onDraftPairChange}
        groupListEmpty={groupListEmpty}
      />
    </div>
  );
}
