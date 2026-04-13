import type { BookingFormData } from "@/lib/validations";

export type BookingHistoryCommitEvent =
  | { type: "create"; bookingId: string; payload: BookingFormData }
  | { type: "update"; bookingId: string; before: BookingFormData; after: BookingFormData }
  | { type: "delete"; payload: BookingFormData };

export function commitEventToHistoryEntry(ev: BookingHistoryCommitEvent): PlanningBookingHistoryEntry {
  switch (ev.type) {
    case "create":
      return { kind: "create", bookingId: ev.bookingId, payload: ev.payload };
    case "update":
      return { kind: "update", bookingId: ev.bookingId, before: ev.before, after: ev.after };
    case "delete":
      return { kind: "delete", payload: ev.payload, redoTargetId: null };
  }
}

export type PlanningBookingHistoryEntry =
  | { kind: "create"; bookingId: string; payload: BookingFormData }
  | { kind: "delete"; payload: BookingFormData; redoTargetId: string | null }
  | { kind: "update"; bookingId: string; before: BookingFormData; after: BookingFormData };

export type PlanningBookingHistoryStacks = {
  past: PlanningBookingHistoryEntry[];
  future: PlanningBookingHistoryEntry[];
};

export type BookingHistoryApi = {
  create: (
    data: BookingFormData,
  ) => Promise<{ ok: true; bookingId: string } | { ok: false; error: string }>;
  update: (id: string, data: BookingFormData) => Promise<{ ok: true } | { ok: false; error: string }>;
  delete: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
};

export function bookingHistoryEmpty(): PlanningBookingHistoryStacks {
  return { past: [], future: [] };
}

export function pushBookingHistoryCommit(
  stacks: PlanningBookingHistoryStacks,
  entry: PlanningBookingHistoryEntry,
): PlanningBookingHistoryStacks {
  return {
    past: [...stacks.past, entry],
    future: [],
  };
}

export function stacksAfterUndo(stacks: PlanningBookingHistoryStacks): {
  stacks: PlanningBookingHistoryStacks;
  entry: PlanningBookingHistoryEntry | null;
} {
  if (stacks.past.length === 0) {
    return { stacks, entry: null };
  }
  const entry = stacks.past[stacks.past.length - 1];
  return {
    stacks: {
      past: stacks.past.slice(0, -1),
      future: [entry, ...stacks.future],
    },
    entry,
  };
}

export function stacksAfterRedo(stacks: PlanningBookingHistoryStacks): {
  stacks: PlanningBookingHistoryStacks;
  entry: PlanningBookingHistoryEntry | null;
} {
  if (stacks.future.length === 0) {
    return { stacks, entry: null };
  }
  const entry = stacks.future[0];
  return {
    stacks: {
      past: [...stacks.past, entry],
      future: stacks.future.slice(1),
    },
    entry,
  };
}

export function bookingHistoryCanUndo(stacks: PlanningBookingHistoryStacks): boolean {
  return stacks.past.length > 0;
}

export function bookingHistoryCanRedo(stacks: PlanningBookingHistoryStacks): boolean {
  return stacks.future.length > 0;
}

export async function executeBookingHistoryUndo(
  entry: PlanningBookingHistoryEntry,
  api: BookingHistoryApi,
): Promise<boolean> {
  switch (entry.kind) {
    case "create": {
      const r = await api.delete(entry.bookingId);
      return r.ok;
    }
    case "delete": {
      const r = await api.create(entry.payload);
      if (r.ok) entry.redoTargetId = r.bookingId;
      return r.ok;
    }
    case "update": {
      const r = await api.update(entry.bookingId, entry.before);
      return r.ok;
    }
  }
}

export async function executeBookingHistoryRedo(
  entry: PlanningBookingHistoryEntry,
  api: BookingHistoryApi,
): Promise<boolean> {
  switch (entry.kind) {
    case "create": {
      const r = await api.create(entry.payload);
      if (r.ok) entry.bookingId = r.bookingId;
      return r.ok;
    }
    case "delete": {
      if (!entry.redoTargetId) return false;
      const r = await api.delete(entry.redoTargetId);
      if (r.ok) entry.redoTargetId = null;
      return r.ok;
    }
    case "update": {
      const r = await api.update(entry.bookingId, entry.after);
      return r.ok;
    }
  }
}
