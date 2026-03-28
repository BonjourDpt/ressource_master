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
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { Select } from "@/components/ui/Select";

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

  const ctrlBase = "h-8 rounded-lg border border-[var(--rm-border)] bg-[var(--rm-surface)] text-xs transition-colors";

  const teamSelectOptions = useMemo(
    () => [
      { value: "ALL", label: "All teams" },
      ...teams.map((t) => ({ value: t, label: t })),
    ],
    [teams],
  );

  const addGroupOptions = useMemo(
    () => [
      {
        value: "",
        label: view === "project" ? "Select a project…" : "Select a resource…",
      },
      ...unallocatedEntities.map((e) => ({ value: e.id, label: e.name })),
    ],
    [view, unallocatedEntities],
  );
  const navBtn = "flex h-8 w-8 items-center justify-center rounded-lg text-[var(--rm-muted)] transition-colors hover:bg-[var(--rm-surface-elevated)] hover:text-[var(--rm-fg)]";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--rm-fg)]">Planning</h1>

        <div className="flex flex-wrap items-center gap-3">
          <SegmentedTabs
            tabs={[
              { value: "project" as PlanningViewMode, label: "By project" },
              { value: "resource" as PlanningViewMode, label: "By resource" },
            ]}
            value={view}
            onChange={setView}
            ariaLabel="Group by"
            accent
          />

          {teams.length > 0 && (
            <div className="w-[11rem] min-w-[9rem]">
              <Select
                options={teamSelectOptions}
                value={teamFilter}
                onChange={setTeam}
                size="compact"
                aria-label="Filter by team"
              />
            </div>
          )}

          {/* Timeline navigation */}
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => shiftWeeks(-span)} className={navBtn} aria-label={`Previous ${span} weeks`} title={`Jump ${span} weeks back`}>««</button>
            <button type="button" onClick={() => shiftWeeks(-1)} className={navBtn} aria-label="Previous week">«</button>
            <button
              type="button"
              onClick={goToToday}
              className={`${ctrlBase} px-3 font-medium text-[var(--rm-fg)] hover:bg-[var(--rm-surface-elevated)]`}
            >
              Today
            </button>
            <button type="button" onClick={() => shiftWeeks(1)} className={navBtn} aria-label="Next week">»</button>
            <button type="button" onClick={() => shiftWeeks(span)} className={navBtn} aria-label={`Next ${span} weeks`} title={`Jump ${span} weeks forward`}>»»</button>
          </div>

          <span className="min-w-[8rem] text-center text-xs font-medium tabular-nums text-[var(--rm-muted)]">
            {formatWeekLabel(weekRange[0] ?? startWeek)} – {formatWeekLabel(weekRange[span - 1] ?? startWeek)}
          </span>

          <SegmentedTabs
            tabs={SPAN_OPTIONS.map((s) => ({ value: String(s), label: `${s}w` }))}
            value={String(span)}
            onChange={(v) => setSpan(Number(v))}
            ariaLabel="Week span"
          />
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-xs font-medium text-[var(--rm-muted)]">+ Add allocation</span>
          <div className="min-w-0 sm:max-w-xs sm:flex-1">
            <Select
              options={addGroupOptions}
              value=""
              onChange={(v) => {
                if (v) handleAddGroup(v);
              }}
              size="compact"
              aria-label={view === "project" ? "Add project to planning" : "Add resource to planning"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
