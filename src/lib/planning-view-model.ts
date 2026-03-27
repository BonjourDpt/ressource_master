/**
 * Grouped planning matrix for the grid: one group per primary entity (resource or project),
 * sub-rows for each related project/resource line, and per-week allocation cells.
 */
import { getIsoMonday } from "@/lib/weeks";

export type PlanningViewMode = "project" | "resource";

export type PlanningRowType = "allocation" | "add" | "summary";

/** At most one active inline editor in the planning grid. */
export type PlanningEditingCell = { rowId: string; weekId: string } | null;

// Minimal model types used by the planning UI.
// We intentionally avoid importing `Project` / `Resource` from `@prisma/client`
// because the generated type exports can be inconsistent in the editor.
export type ProjectModel = {
  id: string;
  name: string;
  color: string | null;
  client: string | null;
};

export type ResourceModel = {
  id: string;
  name: string;
  role: string | null;
  team: string | null;
  capacity: number;
};

export type BookingModel = {
  id: string;
  projectId: string;
  resourceId: string;
  weekStart: Date;
  allocationPct: number;
  note: string | null;
};

export type BookingWithRelations = BookingModel & {
  project: ProjectModel;
  resource: ResourceModel;
};

export type PlanningWeekCell = {
  weekStart: string;
  allocationPercent: number | null;
  booking: BookingWithRelations | null;
};

export type PlanningMatrixRow = {
  /** Stable within the session; server rows use deterministic ids, drafts use `draft:` prefix. */
  id: string;
  rowType: PlanningRowType;
  /** For allocation rows: project + resource for this line (both set when paired). */
  projectId?: string;
  resourceId?: string;
  /** Human-readable secondary column (resource name or project name). */
  secondaryLabel: string;
  /** Project accent when the secondary entity is a project (by-resource view). */
  secondaryColor?: string | null;
  weeks: PlanningWeekCell[];
  /** Non-null allocation percents by ISO week key (spec / debugging). */
  allocations?: Record<string, number>;
};

export type PlanningMatrixGroup = {
  /** Which display mode produced this group (`resource` = by resource, `project` = by project). */
  mode: PlanningViewMode;
  groupId: string;
  groupLabel: string;
  /** Set when the group is a project (by-project view). */
  groupColor?: string | null;
  rows: PlanningMatrixRow[];
};

function weekKey(d: Date): string {
  return getIsoMonday(d).toISOString().slice(0, 10);
}

function bookingLookupKey(resourceId: string, projectId: string, wk: string): string {
  return `${resourceId}\0${projectId}\0${wk}`;
}

function buildBookingMap(bookings: BookingWithRelations[]): Map<string, BookingWithRelations> {
  const map = new Map<string, BookingWithRelations>();
  for (const b of bookings) {
    const wk = weekKey(b.weekStart);
    map.set(bookingLookupKey(b.resourceId, b.projectId, wk), b);
  }
  return map;
}

/** Sum allocation per resource per week (for over-allocation in by-resource view). */
export function resourceWeekTotals(
  bookings: BookingWithRelations[]
): Map<string, number> {
  const m = new Map<string, number>();
  for (const b of bookings) {
    const k = `${b.resourceId}:${weekKey(b.weekStart)}`;
    m.set(k, (m.get(k) ?? 0) + b.allocationPct);
  }
  return m;
}

function emptyWeekCells(weekRange: Date[]): PlanningWeekCell[] {
  return weekRange.map((w) => ({
    weekStart: weekKey(w),
    allocationPercent: null,
    booking: null,
  }));
}

function allocationsFromWeeks(weeks: PlanningWeekCell[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const w of weeks) {
    if (w.allocationPercent != null) out[w.weekStart] = w.allocationPercent;
  }
  return out;
}

/** Builds grouped rows for both “By resource” and “By project” modes. */
export function buildPlanningMatrix(
  view: PlanningViewMode,
  projects: ProjectModel[],
  resources: ResourceModel[],
  bookings: BookingWithRelations[],
  weekRange: Date[]
): PlanningMatrixGroup[] {
  const byProject = new Map(projects.map((p) => [p.id, p]));
  const byResource = new Map(resources.map((r) => [r.id, r]));
  const bookingMap = buildBookingMap(bookings);

  if (view === "resource") {
    return resources.map((resource) => {
      const projectIds = new Set<string>();
      for (const b of bookings) {
        if (b.resourceId === resource.id) projectIds.add(b.projectId);
      }
      const sortedProjectIds = [...projectIds].sort((a, b) => {
        const na = byProject.get(a)?.name ?? a;
        const nb = byProject.get(b)?.name ?? b;
        return na.localeCompare(nb);
      });

      const rows: PlanningMatrixRow[] = [];
      for (const projectId of sortedProjectIds) {
        const project = byProject.get(projectId);
        const weeks: PlanningWeekCell[] = weekRange.map((w) => {
          const ws = weekKey(w);
          const booking =
            bookingMap.get(bookingLookupKey(resource.id, projectId, ws)) ?? null;
          return {
            weekStart: ws,
            allocationPercent: booking?.allocationPct ?? null,
            booking,
          };
        });
        rows.push({
          id: `a:${resource.id}:${projectId}`,
          rowType: "allocation",
          projectId,
          resourceId: resource.id,
          secondaryLabel: project?.name ?? projectId,
          secondaryColor: project?.color ?? null,
          weeks,
          allocations: allocationsFromWeeks(weeks),
        });
      }

      rows.push({
        id: `add:${resource.id}`,
        rowType: "add",
        secondaryLabel: "",
        weeks: emptyWeekCells(weekRange),
      });

      rows.push({
        id: `sum:${resource.id}`,
        rowType: "summary",
        secondaryLabel: "Total",
        weeks: [],
      });

      return {
        mode: "resource",
        groupId: resource.id,
        groupLabel: resource.name,
        rows,
      };
    });
  }

  return projects.map((project) => {
    const resourceIds = new Set<string>();
    for (const b of bookings) {
      if (b.projectId === project.id) resourceIds.add(b.resourceId);
    }
    const sortedResourceIds = [...resourceIds].sort((a, b) => {
      const na = byResource.get(a)?.name ?? a;
      const nb = byResource.get(b)?.name ?? b;
      return na.localeCompare(nb);
    });

    const rows: PlanningMatrixRow[] = [];
    for (const resourceId of sortedResourceIds) {
      const resource = byResource.get(resourceId);
      const weeks: PlanningWeekCell[] = weekRange.map((w) => {
        const ws = weekKey(w);
        const booking =
          bookingMap.get(bookingLookupKey(resourceId, project.id, ws)) ?? null;
        return {
          weekStart: ws,
          allocationPercent: booking?.allocationPct ?? null,
          booking,
        };
      });
      rows.push({
        id: `a:${project.id}:${resourceId}`,
        rowType: "allocation",
        projectId: project.id,
        resourceId,
        secondaryLabel: resource?.name ?? resourceId,
        weeks,
        allocations: allocationsFromWeeks(weeks),
      });
    }

    rows.push({
      id: `add:${project.id}`,
      rowType: "add",
      secondaryLabel: "",
      weeks: emptyWeekCells(weekRange),
    });

    return {
      mode: "project",
      groupId: project.id,
      groupLabel: project.name,
      groupColor: project.color,
      rows,
    };
  });
}

/** Client-side draft line: user picked the secondary entity (resource or project) for this group. */
export type PlanningDraftAllocationLine = {
  id: string;
  groupId: string;
  pairedEntityId: string | null;
};

/**
 * Inserts draft allocation rows before each group’s `add` row (and before `summary` in resource mode).
 */
export function mergeDraftRowsIntoGroups(
  groups: PlanningMatrixGroup[],
  drafts: PlanningDraftAllocationLine[],
  weekRange: Date[],
  projects: ProjectModel[],
  resources: ResourceModel[],
): PlanningMatrixGroup[] {
  const byProject = new Map(projects.map((p) => [p.id, p]));
  const byResource = new Map(resources.map((r) => [r.id, r]));

  return groups.map((g) => {
    const groupDrafts = drafts.filter((d) => d.groupId === g.groupId);
    const allocationRows = g.rows.filter((r) => r.rowType === "allocation");
    const addRow = g.rows.find((r) => r.rowType === "add");
    const summaryRow = g.rows.find((r) => r.rowType === "summary");

    const draftMatrixRows: PlanningMatrixRow[] = groupDrafts.map((draft) => {
      const weeks = emptyWeekCells(weekRange);
      if (g.mode === "project") {
        const resourceId = draft.pairedEntityId;
        const resource = resourceId ? byResource.get(resourceId) : undefined;
        return {
          id: draft.id,
          rowType: "allocation",
          projectId: g.groupId,
          resourceId: resourceId ?? undefined,
          secondaryLabel: resource?.name ?? "Select resource",
          weeks,
          allocations: {},
        };
      }
      const projectId = draft.pairedEntityId;
      const project = projectId ? byProject.get(projectId) : undefined;
      return {
        id: draft.id,
        rowType: "allocation",
        projectId: projectId ?? undefined,
        resourceId: g.groupId,
        secondaryLabel: project?.name ?? "Select project",
        secondaryColor: project?.color ?? null,
        weeks,
        allocations: {},
      };
    });

    const tail = [addRow, summaryRow].filter((r): r is PlanningMatrixRow => r != null);

    return {
      ...g,
      rows: [...allocationRows, ...draftMatrixRows, ...tail],
    };
  });
}
