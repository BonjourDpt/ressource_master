"use client";

import type { Dispatch, SetStateAction } from "react";
import { toWeekStartKey } from "@/lib/weeks";
import type {
  PlanningEditingCell,
  PlanningMatrixGroup,
  ProjectModel,
  ResourceModel,
} from "@/lib/planning-view-model";
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
}

/** Minimum width per week column when scrolling (readability). */
const WEEK_COL_MIN_PX = 88;
const STICKY_COLS_PX = 336;

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
}: PlanningTableProps) {
  const tableMinPx = STICKY_COLS_PX + weekRange.length * WEEK_COL_MIN_PX;

  return (
    <div className="rm-scroll-x w-full min-w-0 overflow-x-auto">
      <table
        className="w-full min-w-full table-fixed border-collapse text-sm text-[var(--rm-fg)]"
        style={{ minWidth: `max(100%, ${tableMinPx}px)` }}
      >
        <colgroup>
          <col className="w-40" />
          <col className="w-44" />
          {weekRange.map((w) => (
            <col key={toWeekStartKey(w)} />
          ))}
        </colgroup>
        <TimelineHeader view={view} weekRange={weekRange} />
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
        />
      </table>
      {groupListEmpty && (
        <p className="py-12 text-center text-sm text-[var(--rm-muted-subtle)]">
          No {view === "project" ? "projects" : "resources"} yet.
        </p>
      )}
    </div>
  );
}
