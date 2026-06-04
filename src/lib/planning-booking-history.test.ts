import { describe, expect, it, vi } from "vitest";
import type { BookingFormData } from "@/lib/validations";
import {
  bookingHistoryCanRedo,
  bookingHistoryCanUndo,
  bookingHistoryEmpty,
  executeBookingHistoryRedo,
  executeBookingHistoryUndo,
  pushBookingHistoryCommit,
  stacksAfterRedo,
  stacksAfterUndo,
} from "@/lib/planning-booking-history";

const samplePayload = (): BookingFormData => ({
  projectId: "p1",
  resourceId: "r1",
  weekStart: "2026-04-06",
  allocationPct: 50,
  note: "",
});

describe("booking history stacks", () => {
  it("pushCommit appends to past and clears future", () => {
    const e1 = { kind: "create" as const, bookingId: "b1", payload: samplePayload() };
    const e2 = { kind: "create" as const, bookingId: "b2", payload: samplePayload() };
    let s = bookingHistoryEmpty();
    s = pushBookingHistoryCommit(s, e1);
    s = stacksAfterUndo(s).stacks;
    expect(s.future.length).toBe(1);
    s = pushBookingHistoryCommit(s, e2);
    expect(s.past.map((e) => (e as { bookingId?: string }).bookingId)).toEqual(["b2"]);
    expect(s.future).toEqual([]);
  });

  it("stacksAfterUndo moves tip from past to front of future", () => {
    const e1 = { kind: "create" as const, bookingId: "b1", payload: samplePayload() };
    const e2 = { kind: "create" as const, bookingId: "b2", payload: samplePayload() };
    let s = bookingHistoryEmpty();
    s = pushBookingHistoryCommit(s, e1);
    s = pushBookingHistoryCommit(s, e2);
    const u = stacksAfterUndo(s);
    expect(u.entry?.kind).toBe("create");
    expect(u.stacks.past).toEqual([e1]);
    expect(u.stacks.future).toEqual([e2]);
  });

  it("stacksAfterRedo moves front of future back to past", () => {
    const e1 = { kind: "create" as const, bookingId: "b1", payload: samplePayload() };
    const e2 = { kind: "create" as const, bookingId: "b2", payload: { ...samplePayload() } };
    let s = bookingHistoryEmpty();
    s = pushBookingHistoryCommit(s, e1);
    s = pushBookingHistoryCommit(s, e2);
    s = stacksAfterUndo(s).stacks;
    const r = stacksAfterRedo(s);
    expect(r.entry).toBe(e2);
    expect(r.stacks.past).toEqual([e1, e2]);
    expect(r.stacks.future).toEqual([]);
  });

  it("canUndo / canRedo reflect stack lengths", () => {
    const e1 = { kind: "create" as const, bookingId: "b1", payload: samplePayload() };
    let s = bookingHistoryEmpty();
    expect(bookingHistoryCanUndo(s)).toBe(false);
    expect(bookingHistoryCanRedo(s)).toBe(false);
    s = pushBookingHistoryCommit(s, e1);
    expect(bookingHistoryCanUndo(s)).toBe(true);
    s = stacksAfterUndo(s).stacks;
    expect(bookingHistoryCanRedo(s)).toBe(true);
  });
});

describe("booking history execution", () => {
  it("undo create deletes booking id", async () => {
    const payload = samplePayload();
    const entry = { kind: "create" as const, bookingId: "bid-new", payload };
    const del = vi.fn().mockResolvedValue({ ok: true as const });
    await executeBookingHistoryUndo(entry, { create: vi.fn(), update: vi.fn(), delete: del });
    expect(del).toHaveBeenCalledWith("bid-new");
  });

  it("redo create recreates and updates bookingId on entry", async () => {
    const payload = samplePayload();
    const entry = { kind: "create" as const, bookingId: "old", payload };
    const create = vi.fn().mockResolvedValue({ ok: true as const, bookingId: "fresh-id" });
    await executeBookingHistoryRedo(entry, { create, update: vi.fn(), delete: vi.fn() });
    expect(create).toHaveBeenCalledWith(payload);
    expect(entry.bookingId).toBe("fresh-id");
  });

  it("undo delete creates row and sets redoTargetId", async () => {
    const payload = samplePayload();
    const entry = { kind: "delete" as const, payload, redoTargetId: null };
    const create = vi.fn().mockResolvedValue({ ok: true as const, bookingId: "restored" });
    await executeBookingHistoryUndo(entry, { create, update: vi.fn(), delete: vi.fn() });
    expect(create).toHaveBeenCalledWith(payload);
    expect(entry.redoTargetId).toBe("restored");
  });

  it("redo delete removes redoTargetId booking", async () => {
    const payload = samplePayload();
    const entry = { kind: "delete" as const, payload, redoTargetId: "rid" };
    const del = vi.fn().mockResolvedValue({ ok: true as const });
    await executeBookingHistoryRedo(entry, { create: vi.fn(), update: vi.fn(), delete: del });
    expect(del).toHaveBeenCalledWith("rid");
  });

  it("undo update applies before snapshot", async () => {
    const before = samplePayload();
    const after = { ...samplePayload(), allocationPct: 80 };
    const entry = { kind: "update" as const, bookingId: "u1", before, after };
    const update = vi.fn().mockResolvedValue({ ok: true as const });
    await executeBookingHistoryUndo(entry, { create: vi.fn(), update, delete: vi.fn() });
    expect(update).toHaveBeenCalledWith("u1", before);
  });

  it("redo update applies after snapshot", async () => {
    const before = samplePayload();
    const after = { ...samplePayload(), allocationPct: 80 };
    const entry = { kind: "update" as const, bookingId: "u1", before, after };
    const update = vi.fn().mockResolvedValue({ ok: true as const });
    await executeBookingHistoryRedo(entry, { create: vi.fn(), update, delete: vi.fn() });
    expect(update).toHaveBeenCalledWith("u1", after);
  });
});
