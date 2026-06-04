import { beforeEach, describe, expect, it, vi } from "vitest";
import * as actions from "@/app/planning/actions";
import * as validations from "@/lib/validations";

const { dbMock, revalidatePathMock } = vi.hoisted(() => ({
  dbMock: {
    resourceTimeOff: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      delete: vi.fn(),
    },
  },
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: dbMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

type TimeOffFormData = {
  resourceId: string;
  weekStart: string;
  offPct: number;
};

type InvalidSchemaCase = {
  label: string;
  data: TimeOffFormData;
};

const { timeOffSchema } = validations as typeof validations & {
  timeOffSchema: {
    safeParse: (data: unknown) => { success: boolean };
  };
};

const { setResourceTimeOff, deleteResourceTimeOff } = actions as typeof actions & {
  setResourceTimeOff: (data: TimeOffFormData) => Promise<{ ok: boolean; timeOffId?: string }>;
  deleteResourceTimeOff: (id: string) => Promise<{ ok: boolean }>;
};

describe("timeOffSchema", () => {
  it("accepts resourceId, weekStart, and offPct from 1 to 100", () => {
    expect(
      timeOffSchema.safeParse({
        resourceId: "r1",
        weekStart: "2026-04-06",
        offPct: 1,
      }).success,
    ).toBe(true);

    expect(
      timeOffSchema.safeParse({
        resourceId: "r1",
        weekStart: "2026-04-06",
        offPct: 100,
      }).success,
    ).toBe(true);
  });

  const invalidSchemaCases: InvalidSchemaCase[] = [
    { label: "0%", data: { resourceId: "r1", weekStart: "2026-04-06", offPct: 0 } },
    { label: "101%", data: { resourceId: "r1", weekStart: "2026-04-06", offPct: 101 } },
    { label: "missing resource", data: { resourceId: "", weekStart: "2026-04-06", offPct: 50 } },
    { label: "missing week", data: { resourceId: "r1", weekStart: "", offPct: 50 } },
  ];

  it.each(invalidSchemaCases)("rejects $label", ({ data }: InvalidSchemaCase) => {
    expect(timeOffSchema.safeParse(data).success).toBe(false);
  });
});

describe("resource time off planning actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.resourceTimeOff.upsert.mockResolvedValue({ id: "off-1" });
    dbMock.resourceTimeOff.deleteMany.mockResolvedValue({ count: 1 });
    dbMock.resourceTimeOff.delete.mockResolvedValue({ id: "off-1" });
  });

  it("upserts time off by resourceId_weekStart and revalidates planning", async () => {
    const result = await setResourceTimeOff({
      resourceId: "r1",
      weekStart: "2026-04-06",
      offPct: 40,
    });

    expect(dbMock.resourceTimeOff.upsert).toHaveBeenCalledWith({
      where: {
        resourceId_weekStart: {
          resourceId: "r1",
          weekStart: new Date("2026-04-06"),
        },
      },
      update: { offPct: 40 },
      create: {
        resourceId: "r1",
        weekStart: new Date("2026-04-06"),
        offPct: 40,
      },
      select: { id: true },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/planning");
    expect(result).toEqual({ ok: true, timeOffId: "off-1" });
  });

  it.each([0, -1])("deletes the matching resource/week row when offPct is %i", async (offPct: number) => {
    const result = await setResourceTimeOff({
      resourceId: "r1",
      weekStart: "2026-04-06",
      offPct,
    });

    expect(dbMock.resourceTimeOff.deleteMany).toHaveBeenCalledWith({
      where: {
        resourceId: "r1",
        weekStart: new Date("2026-04-06"),
      },
    });
    expect(dbMock.resourceTimeOff.upsert).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/planning");
    expect(result).toEqual({ ok: true });
  });

  it("deletes time off by id and revalidates planning", async () => {
    const result = await deleteResourceTimeOff("off-1");

    expect(dbMock.resourceTimeOff.delete).toHaveBeenCalledWith({
      where: { id: "off-1" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/planning");
    expect(result).toEqual({ ok: true });
  });
});
