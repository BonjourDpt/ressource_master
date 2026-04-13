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

  const accentColor =
    g.mode === "resource" ? row.secondaryColor ?? null : null;

  const isEditing =
    editingCell?.rowId === row.id && editingCell?.weekId === cell.weekStart;

  return (
    <EditableAllocationCell
      rowId={row.id}
      weekStart={cell.weekStart}
      booking={cell.booking}
      projectId={projectId}
      resourceId={resourceId}
      isEditing={isEditing}
      onEditingCellChange={onEditingCellChange}
      onTabNavigate={onTabNavigate}
      accentColor={accentColor}
      onBookingHistoryCommit={onBookingHistoryCommit}
    />
  );
}
