"use client";

import type {
  PlanningMatrixGroup,
  PlanningMatrixRow,
  PlanningWeekCell,
  ProjectModel,
  ResourceModel,
} from "@/lib/planning-view-model";
import { EditableAllocationCell } from "./EditableAllocationCell";

function allocationCellKey(
  projectId: string | null,
  resourceId: string | null,
  weekStart: string,
): string {
  return `p:${projectId ?? "_"}|r:${resourceId ?? "_"}|w:${weekStart}`;
}

export interface AllocationCellProps {
  g: PlanningMatrixGroup;
  row: PlanningMatrixRow;
  cell: PlanningWeekCell;
  projects: ProjectModel[];
  resources: ResourceModel[];
  activeCellKey: string | null;
  onActiveCellKeyChange: (key: string | null) => void;
}

export function AllocationCell({
  g,
  row,
  cell,
  projects,
  resources,
  activeCellKey,
  onActiveCellKeyChange,
}: AllocationCellProps) {
  const projectId = g.mode === "project" ? g.groupId : row.secondaryId;
  const resourceId = g.mode === "resource" ? g.groupId : row.secondaryId;
  const cellKey = allocationCellKey(projectId, resourceId, cell.weekStart);
  const accentColor =
    g.mode === "resource" && row.secondaryId !== null ? row.secondaryColor ?? null : null;

  return (
    <EditableAllocationCell
      cellKey={cellKey}
      weekStart={cell.weekStart}
      booking={cell.booking}
      projectId={projectId}
      resourceId={resourceId}
      projectOptions={projects}
      resourceOptions={resources}
      isEditing={activeCellKey === cellKey}
      onBeginEdit={onActiveCellKeyChange}
      onEndEdit={() => onActiveCellKeyChange(null)}
      accentColor={accentColor}
    />
  );
}
