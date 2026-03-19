/**
 * Grouped planning matrix for the grid: one group per primary entity (resource or project),
 * sub-rows for each related project/resource line, and per-week allocation cells.
 */
import { getIsoMonday } from "@/lib/weeks";
import type { Booking, Project, Resource } from "@prisma/client";

export type PlanningViewMode = "project" | "resource";

export type BookingWithRelations = Booking & { project: Project; resource: Resource };

export type PlanningWeekCell = {
  weekStart: string;
  allocationPercent: number | null;
  booking: BookingWithRelations | null;
};

export type PlanningMatrixRow = {
  /** `null` = “open” line (add with only group id pre-filled). */
  secondaryId: string | null;
  secondaryLabel: string;
  /** Project accent when the secondary entity is a project (by-resource view). */
  secondaryColor?: string | null;
  weeks: PlanningWeekCell[];
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

const OPEN_LINE_LABEL = "—";

function emptyWeekCells(weekRange: Date[]): PlanningWeekCell[] {
  return weekRange.map((w) => ({
    weekStart: weekKey(w),
    allocationPercent: null,
    booking: null,
  }));
}

/** Builds grouped rows for both “By resource” and “By project” modes. */
export function buildPlanningMatrix(
  view: PlanningViewMode,
  projects: Project[],
  resources: Resource[],
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
          secondaryId: projectId,
          secondaryLabel: project?.name ?? projectId,
          secondaryColor: project?.color ?? null,
          weeks,
        });
      }

      rows.push({
        secondaryId: null,
        secondaryLabel: OPEN_LINE_LABEL,
        weeks: emptyWeekCells(weekRange),
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
        secondaryId: resourceId,
        secondaryLabel: resource?.name ?? resourceId,
        weeks,
      });
    }

    rows.push({
      secondaryId: null,
      secondaryLabel: OPEN_LINE_LABEL,
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
