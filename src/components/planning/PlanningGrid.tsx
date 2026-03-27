"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlanningTable } from "./PlanningTable";
import { addWeeks, formatWeekLabel, getIsoMonday, getWeekRange, toWeekStartKey } from "@/lib/weeks";
import {
  buildPlanningMatrix,
  filterActiveGroups,
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

const SPAN_OPTIONS = [4, 8, 12] as const;

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
  const teamFilter = searchParams.get("team") ?? "ALL";
  const weekRange = useMemo(() => getWeekRange(startWeek, span), [startWeek, span]);

  const teams = useMemo(() => {
    const set = new Set<string>();
    for (const r of resources) {
      if (r.team) set.add(r.team);
    }
    return [...set].sort();
  }, [resources]);

  const filteredResources = useMemo(() => {
    if (teamFilter === "ALL") return resources;
    return resources.filter((r) => r.team === teamFilter);
  }, [resources, teamFilter]);

  const filteredBookings = useMemo(() => {
    if (teamFilter === "ALL") return bookings;
    const ids = new Set(filteredResources.map((r) => r.id));
    return bookings.filter((b) => ids.has(b.resourceId));
  }, [bookings, filteredResources, teamFilter]);

  const allGroups = useMemo(
    () => buildPlanningMatrix(view, projects, filteredResources, filteredBookings, weekRange),
    [view, projects, filteredResources, filteredBookings, weekRange],
  );

  const resWeekTotals = useMemo(() => resourceWeekTotals(filteredBookings), [filteredBookings]);

  const [editingCell, setEditingCell] = useState<PlanningEditingCell>(null);
  const [draftLines, setDraftLines] = useState<PlanningDraftAllocationLine[]>([]);
  const [pinnedGroupIds, setPinnedGroupIds] = useState<Set<string>>(new Set());

  const groups = useMemo(
    () => filterActiveGroups(allGroups, pinnedGroupIds),
    [allGroups, pinnedGroupIds],
  );

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
    setPinnedGroupIds(new Set());
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

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null) p.delete(k);
        else p.set(k, v);
      }
      router.push(`/planning?${p.toString()}`);
    },
    [router, searchParams],
  );

  const setView = (v: PlanningViewMode) => pushParams({ view: v });

  const shiftWeeks = (delta: number) => {
    const newStart = addWeeks(startWeek, delta);
    pushParams({ weekStart: newStart.toISOString().slice(0, 10) });
  };

  const goToToday = () => {
    pushParams({ weekStart: getIsoMonday(new Date()).toISOString().slice(0, 10) });
  };

  const setSpan = (s: number) => pushParams({ span: String(s) });

  const setTeam = (t: string) => pushParams({ team: t === "ALL" ? null : t });

  const visibleGroupIds = useMemo(() => new Set(groups.map((g) => g.groupId)), [groups]);

  const unallocatedEntities = useMemo(() => {
    if (view === "project") {
      return projects.filter((p) => !visibleGroupIds.has(p.id));
    }
    return filteredResources.filter((r) => !visibleGroupIds.has(r.id));
  }, [view, projects, filteredResources, visibleGroupIds]);

  const handleAddGroup = useCallback(
    (entityId: string) => {
      setPinnedGroupIds((prev) => new Set([...prev, entityId]));
    },
    [],
  );

  const groupListEmpty = view === "project" ? projects.length === 0 : filteredResources.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-lg font-medium tracking-tight text-[var(--rm-fg)]">Planning</h1>

        <div className="flex flex-wrap items-center gap-4">
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

          {teams.length > 0 && (
            <select
              value={teamFilter}
              onChange={(e) => setTeam(e.target.value)}
              className="rounded-lg border border-[var(--rm-border)] bg-[var(--rm-surface)] px-2 py-1 text-xs text-[var(--rm-fg)] outline-none transition-colors focus:border-[var(--rm-primary)]"
              aria-label="Filter by team"
            >
              <option value="ALL">All teams</option>
              {teams.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1 text-sm text-[var(--rm-muted)]">
            <button
              type="button"
              onClick={() => shiftWeeks(-span)}
              className="rounded px-1 py-1 transition-colors hover:bg-[var(--rm-surface)] hover:text-[var(--rm-fg)]"
              aria-label={`Previous ${span} weeks`}
              title={`Jump ${span} weeks back`}
            >
              ««
            </button>
            <button
              type="button"
              onClick={() => shiftWeeks(-1)}
              className="rounded px-1 py-1 transition-colors hover:bg-[var(--rm-surface)] hover:text-[var(--rm-fg)]"
              aria-label="Previous week"
            >
              «
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg border border-[var(--rm-border)] px-2 py-0.5 text-xs font-medium transition-colors hover:bg-[var(--rm-surface)] hover:text-[var(--rm-fg)]"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => shiftWeeks(1)}
              className="rounded px-1 py-1 transition-colors hover:bg-[var(--rm-surface)] hover:text-[var(--rm-fg)]"
              aria-label="Next week"
            >
              »
            </button>
            <button
              type="button"
              onClick={() => shiftWeeks(span)}
              className="rounded px-1 py-1 transition-colors hover:bg-[var(--rm-surface)] hover:text-[var(--rm-fg)]"
              aria-label={`Next ${span} weeks`}
              title={`Jump ${span} weeks forward`}
            >
              »»
            </button>
          </div>

          <span className="min-w-[8rem] text-center text-xs tabular-nums text-[var(--rm-muted)] sm:text-sm">
            {formatWeekLabel(weekRange[0] ?? startWeek)} – {formatWeekLabel(weekRange[span - 1] ?? startWeek)}
          </span>

          <div className="flex items-center gap-0.5">
            {SPAN_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpan(s)}
                className={cx(
                  "rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                  span === s
                    ? "bg-[var(--rm-surface-elevated)] text-[var(--rm-fg)]"
                    : "text-[var(--rm-muted)] hover:text-[var(--rm-fg)]",
                )}
              >
                {s}w
              </button>
            ))}
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

      {unallocatedEntities.length > 0 && (
        <div className="flex items-center gap-3">
          <label
            htmlFor="add-group-select"
            className="text-xs text-[var(--rm-muted)]"
          >
            + Add allocation
          </label>
          <select
            id="add-group-select"
            value=""
            onChange={(e) => {
              if (e.target.value) handleAddGroup(e.target.value);
            }}
            className="rounded-lg border border-[var(--rm-border)] bg-[var(--rm-surface)] px-3 py-2 text-sm text-[var(--rm-fg)] outline-none transition-colors focus:border-[var(--rm-primary)]"
          >
            <option value="">
              {view === "project" ? "Select a project..." : "Select a resource..."}
            </option>
            {unallocatedEntities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
