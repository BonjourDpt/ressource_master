"use client";

import type { Dispatch, SetStateAction } from "react";
import type { BookingHistoryCommitEvent } from "@/lib/planning-booking-history";
import type {
  PlanningEditingCell,
  PlanningMatrixGroup,
  PlanningMatrixRow,
  PlanningWeekCell,
} from "@/lib/planning-view-model";
import { EditableAllocationCell } from "./EditableAllocationCell";

export interface AllocationCellProps {
  g: PlanningMatrixGroup;
  row: PlanningMatrixRow;
  cell: PlanningWeekCell;
  editingCell: PlanningEditingCell;
  onEditingCellChange: Dispatch<SetStateAction<PlanningEditingCell>>;
  onTabNavigate: (rowId: string, weekId: string, delta: number) => void;
  onBookingHistoryCommit?: (ev: BookingHistoryCommitEvent) => void;
}

export function AllocationCell({
  g,
  row,
  cell,
  editingCell,
  onEditingCellChange,
  onTabNavigate,
  onBookingHistoryCommit,
}: AllocationCellProps) {
  if (row.rowType !== "allocation") {
    return null;
  }

  const projectId = row.projectId;
  const resourceId = row.resourceId;
  const paired = projectId != null && resourceId != null;

  if (!paired) {
    return <div className="min-h-9" aria-hidden />;
  }

  const isEditing =
    editingCell?.rowId === row.id && editingCell?.weekId === cell.weekStart;
  const showOffMarker = g.mode === "project" && (cell.offPct ?? 0) > 0;

  return (
    <div className="relative min-h-9">
      <EditableAllocationCell
        rowId={row.id}
        weekStart={cell.weekStart}
        booking={cell.booking}
        projectId={projectId}
        resourceId={resourceId}
        isEditing={isEditing}
        onEditingCellChange={onEditingCellChange}
        onTabNavigate={onTabNavigate}
        onBookingHistoryCommit={onBookingHistoryCommit}
      />
      {showOffMarker && (
        <span
          className="pointer-events-none absolute right-1 top-1 rounded bg-[var(--rm-warning)]/10 px-1 font-mono text-[9px] font-semibold leading-4 text-[var(--rm-warning)]"
          title={`${cell.offPct}% OFF`}
          aria-label={`${cell.offPct}% OFF`}
        >
          OFF
        </span>
      )}
    </div>
  );
}
