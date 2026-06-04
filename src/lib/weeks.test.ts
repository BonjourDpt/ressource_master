import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentWeekKey, isCurrentWeek } from "@/lib/weeks";

afterEach(() => {
  vi.useRealTimers();
});

describe("isCurrentWeek", () => {
  it("returns true for today's Monday when called mid-week", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z")); // Wednesday
    expect(isCurrentWeek(new Date("2026-04-13T00:00:00Z"))).toBe(true);
  });

  it("returns false for last week's Monday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z"));
    expect(isCurrentWeek(new Date("2026-04-06T00:00:00Z"))).toBe(false);
  });

  it("returns false for next week's Monday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z"));
    expect(isCurrentWeek(new Date("2026-04-20T00:00:00Z"))).toBe(false);
  });

  it("returns true when today itself is a Monday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T00:00:00Z"));
    expect(isCurrentWeek(new Date("2026-04-13T00:00:00Z"))).toBe(true);
  });

  it("returns true for the Monday of a week whose Sunday is today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-19T23:59:59Z")); // Sunday belongs to week Apr 13
    expect(isCurrentWeek(new Date("2026-04-13T00:00:00Z"))).toBe(true);
  });

  it("returns false for a Monday two weeks in the future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T00:00:00Z"));
    expect(isCurrentWeek(new Date("2026-04-27T00:00:00Z"))).toBe(false);
  });

  it("handles year-boundary week correctly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-30T12:00:00Z")); // Wednesday; week starts Dec 28
    expect(isCurrentWeek(new Date("2026-12-28T00:00:00Z"))).toBe(true);
    expect(isCurrentWeek(new Date("2027-01-04T00:00:00Z"))).toBe(false);
  });
});

describe("getCurrentWeekKey", () => {
  it("returns a string in YYYY-MM-DD format", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z"));
    expect(getCurrentWeekKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns the Monday of the current week for a mid-week date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z")); // Wednesday → Monday Apr 13
    expect(getCurrentWeekKey()).toBe("2026-04-13");
  });

  it("returns the same day when today is already a Monday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T00:00:00Z"));
    expect(getCurrentWeekKey()).toBe("2026-04-13");
  });

  it("returns the correct Monday when today is a Sunday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-19T23:59:59Z")); // Sunday → Monday Apr 13
    expect(getCurrentWeekKey()).toBe("2026-04-13");
  });
});
