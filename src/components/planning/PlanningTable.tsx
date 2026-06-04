"use client";

import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { getCurrentWeekKey, toWeekStartKey } from "@/lib/weeks";
import type { BookingHistoryCommitEvent } from "@/lib/planning-booking-history";
import type {
  PlanningEditingCell,
  PlanningMatrixGroup,
  ProjectModel,
  ResourceModel,
} from "@/lib/planning-view-model";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlanningTableBody } from "./PlanningTableBody";
import { TimelineHeader, type PlanningViewMode } from "./TimelineHeader";

export interface PlanningTableProps {
  view: PlanningViewMode;
  weekRange: Date[];
  groups: PlanningMatrixGroup[];
  resWeekTotals: Map<string, number>;
  projects: ProjectModel[];
  resources: ResourceModel[];
  editingCell: PlanningEditingCell;
  onEditingCellChange: Dispatch<SetStateAction<PlanningEditingCell>>;
  onTabNavigate: (rowId: string, weekId: string, delta: number) => void;
  onAddAllocationRow: (groupId: string) => void;
  onDraftPairChange: (draftRowId: string, pairedEntityId: string) => void;
  groupListEmpty: boolean;
  selectedProjectId: string | null;
  onToggleProjectSelection: (projectId: string) => void;
  selectedResourceRowId: string | null;
  onToggleResourceRowSelection: (rowId: string) => void;
  onBookingHistoryCommit?: (ev: BookingHistoryCommitEvent) => void;
}

/** Minimum width per week column when scrolling (readability). */
const WEEK_COL_MIN_PX = 80;
const STICKY_COLS_PX = 352;

export function PlanningTable({
  view,
  weekRange,
  groups,
  resWeekTotals,
  projects,
  resources,
  editingCell,
  onEditingCellChange,
  onTabNavigate,
  onAddAllocationRow,
  onDraftPairChange,
  groupListEmpty,
  selectedProjectId,
  onToggleProjectSelection,
  selectedResourceRowId,
  onToggleResourceRowSelection,
  onBookingHistoryCommit,
}: PlanningTableProps) {
  const tableMinPx = STICKY_COLS_PX + weekRange.length * WEEK_COL_MIN_PX;
  const currentWeekKey = getCurrentWeekKey();
  const tableStyle = { minWidth: `max(100%, ${tableMinPx}px)` } as const;

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const syncScroll = useCallback(() => {
    if (headerScrollRef.current && bodyScrollRef.current) {
      headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
    }
  }, []);

  const colgroup = (
    <colgroup>
      <col className="w-48" />
      <col className="w-40" />
      {weekRange.map((w) => (
        <col key={toWeekStartKey(w)} />
      ))}
    </colgroup>
  );

  return (
    <div className="w-full min-w-0">
      {/* Sticky date header — sits outside the overflow-x-auto container so
          `sticky top-14` works relative to the window, not the scroll box.
          Horizontal position is kept in sync with the body via JS scrollLeft. */}
      <div
        ref={headerScrollRef}
        className="sticky top-14 z-30 overflow-hidden rounded-t-xl border border-b-0 border-[var(--rm-border)]/40"
      >
        <table
          className="w-full min-w-full table-fixed border-separate border-spacing-0 text-sm text-[var(--rm-fg)]"
          style={tableStyle}
        >
          {colgroup}
          <TimelineHeader view={view} weekRange={weekRange} currentWeekKey={currentWeekKey} />
        </table>
      </div>

      {/* Scrollable body — horizontal scrolling syncs the header above */}
      <div
        ref={bodyScrollRef}
        className="rm-scroll-x w-full min-w-0 overflow-x-auto rounded-b-xl border border-[var(--rm-border)]/40"
        onScroll={syncScroll}
      >
        <table
          className="w-full min-w-full table-fixed border-separate border-spacing-0 text-sm text-[var(--rm-fg)]"
          style={tableStyle}
        >
          {colgroup}
          <PlanningTableBody
            groups={groups}
            weekRange={weekRange}
            resWeekTotals={resWeekTotals}
            projects={projects}
            resources={resources}
            editingCell={editingCell}
            onEditingCellChange={onEditingCellChange}
            onTabNavigate={onTabNavigate}
            onAddAllocationRow={onAddAllocationRow}
            onDraftPairChange={onDraftPairChange}
            selectedProjectId={selectedProjectId}
            onToggleProjectSelection={onToggleProjectSelection}
            selectedResourceRowId={selectedResourceRowId}
            onToggleResourceRowSelection={onToggleResourceRowSelection}
            onBookingHistoryCommit={onBookingHistoryCommit}
            currentWeekKey={currentWeekKey}
          />
        </table>
        {groupListEmpty && (
          <EmptyState
            icon="calendar"
            title={view === "project" ? "No projects yet" : "No resources yet"}
            description={
              view === "project"
                ? "Create projects first, then allocate resources to them."
                : "Add team members first, then allocate them to projects."
            }
            action={
              <Link
                href={view === "project" ? "/projects" : "/resources"}
                className="inline-flex items-center justify-center rounded-lg bg-[var(--rm-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--rm-primary-hover)]"
              >
                Go to {view === "project" ? "Projects" : "Resources"}
              </Link>
            }
          />
        )}
        {!groupListEmpty && groups.length === 0 && (
          <EmptyState
            compact
            icon="search"
            title="No planning rows"
            description="No allocations match the current filters. Try adjusting your team or view settings."
          />
        )}
      </div>
    </div>
  );
}
