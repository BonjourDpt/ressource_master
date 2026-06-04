import { describe, expect, it } from "vitest";
import {
  buildPlanningMatrix,
  type BookingWithRelations,
  type ProjectModel,
  type ResourceModel,
} from "@/lib/planning-view-model";
import * as planningViewModel from "@/lib/planning-view-model";

type ResourceTimeOffModel = {
  id: string;
  resourceId: string;
  weekStart: Date;
  offPct: number;
};

type FuturePlanningWeekCell = {
  weekStart: string;
  allocationPercent: number | null;
  booking: BookingWithRelations | null;
  offPct?: number | null;
  timeOff?: ResourceTimeOffModel | null;
};

type FuturePlanningMatrixRow = {
  id: string;
  rowType: "allocation" | "add" | "summary" | "off";
  projectId?: string;
  resourceId?: string;
  secondaryLabel: string;
  weeks: FuturePlanningWeekCell[];
};

type FuturePlanningMatrixGroup = {
  mode: "project" | "resource";
  groupId: string;
  groupLabel: string;
  rows: FuturePlanningMatrixRow[];
};

type OverloadCase = {
  total: number;
  offPct: number | undefined;
  expected: boolean;
  label: string;
};

const { buildResourceTimeOffByWeek, isResourceWeekOverloaded } = planningViewModel as typeof planningViewModel & {
  buildResourceTimeOffByWeek: (
    timeOff: ResourceTimeOffModel[],
  ) => Map<string, { offPct: number; timeOff: ResourceTimeOffModel }>;
  isResourceWeekOverloaded: (totalAllocationPct: number, offPct?: number) => boolean;
};

const weekRange = [new Date("2026-04-06"), new Date("2026-04-13")];

const projects: ProjectModel[] = [
  { id: "p1", name: "Alpha", color: "#2563eb", client: null, status: "ACTIVE" },
];

const resources: ResourceModel[] = [
  { id: "r1", name: "Alice", role: null, team: null, capacity: 37.5, status: "ACTIVE" },
  { id: "r2", name: "Bob", role: null, team: null, capacity: 37.5, status: "ACTIVE" },
];

const booking: BookingWithRelations = {
  id: "b1",
  projectId: "p1",
  resourceId: "r1",
  weekStart: new Date("2026-04-06"),
  allocationPct: 80,
  note: null,
  project: projects[0],
  resource: resources[0],
};

const timeOff: ResourceTimeOffModel[] = [
  {
    id: "off-1",
    resourceId: "r1",
    weekStart: new Date("2026-04-06"),
    offPct: 20,
  },
];

const buildMatrixWithTimeOff = buildPlanningMatrix as unknown as (
  view: "project" | "resource",
  projects: ProjectModel[],
  resources: ResourceModel[],
  bookings: BookingWithRelations[],
  timeOff: ResourceTimeOffModel[],
  weekRange: Date[],
) => FuturePlanningMatrixGroup[];

describe("planning view model resource time off", () => {
  it('adds a dedicated "off" row to each by-resource group', () => {
    const [group] = buildMatrixWithTimeOff("resource", projects, resources, [booking], timeOff, weekRange);

    expect(group.rows.map((row) => row.rowType)).toEqual([
      "allocation",
      "off",
      "add",
      "summary",
    ]);

    const offRow = group.rows.find((row) => row.rowType === "off");
    expect(offRow).toMatchObject({
      id: "off:r1",
      rowType: "off",
      resourceId: "r1",
      secondaryLabel: "OFF",
    });
  });

  it("carries matching per-week OFF percentages and source entries on the OFF row", () => {
    const [group] = buildMatrixWithTimeOff("resource", projects, resources, [booking], timeOff, weekRange);
    const offRow = group.rows.find((row) => row.rowType === "off");

    expect(offRow?.weeks).toEqual([
      {
        weekStart: "2026-04-06",
        allocationPercent: null,
        booking: null,
        offPct: 20,
        timeOff: timeOff[0],
      },
      {
        weekStart: "2026-04-13",
        allocationPercent: null,
        booking: null,
        offPct: null,
        timeOff: null,
      },
    ]);
  });

  it("includes an empty OFF row for resources without time off so OFF can be edited independently of projects", () => {
    const groups = buildMatrixWithTimeOff("resource", projects, resources, [booking], timeOff, weekRange);
    const bobGroup = groups.find((group) => group.groupId === "r2");
    const offRow = bobGroup?.rows.find((row) => row.rowType === "off");

    expect(offRow).toMatchObject({
      id: "off:r2",
      rowType: "off",
      resourceId: "r2",
      secondaryLabel: "OFF",
    });
    expect(offRow?.weeks.map((week) => week.offPct)).toEqual([null, null]);
  });

  it("builds an OFF lookup keyed by resourceId and ISO weekStart", () => {
    expect(buildResourceTimeOffByWeek(timeOff)).toEqual(
      new Map([
        [
          "r1:2026-04-06",
          {
            offPct: 20,
            timeOff: timeOff[0],
          },
        ],
      ]),
    );
  });

  const overloadCases: OverloadCase[] = [
    { total: 80, offPct: 20, expected: false, label: "80 total with 20 OFF leaves exactly 80 available" },
    { total: 81, offPct: 20, expected: true, label: "81 total with 20 OFF exceeds 80 available" },
    { total: 100, offPct: undefined, expected: false, label: "missing OFF defaults availability to 100" },
    { total: 101, offPct: undefined, expected: true, label: "totals above 100 overload when no OFF exists" },
  ];

  it.each(overloadCases)("$label", ({ total, offPct, expected }: OverloadCase) => {
    expect(isResourceWeekOverloaded(total, offPct)).toBe(expected);
  });
});
