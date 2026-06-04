"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  bookingSchema,
  timeOffSchema,
  type BookingFormData,
  type TimeOffFormData,
} from "@/lib/validations";

const timeOffDeleteSchema = timeOffSchema.pick({ resourceId: true, weekStart: true });

export async function createBooking(data: BookingFormData) {
  const parsed = bookingSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  const { projectId, resourceId, weekStart, allocationPct, note } = parsed.data;
  const weekDate = new Date(weekStart);
  try {
    const created = await db.booking.create({
      data: {
        projectId,
        resourceId,
        weekStart: weekDate,
        allocationPct,
        note: note?.trim() || null,
      },
      select: { id: true },
    });
    revalidatePath("/planning");
    return { ok: true as const, bookingId: created.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create booking";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return {
        ok: false as const,
        error: { _form: ["This resource is already assigned to this project for this week."] },
      };
    }
    return { ok: false as const, error: { _form: [msg] } };
  }
}

export async function updateBooking(id: string, data: BookingFormData) {
  const parsed = bookingSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  const { projectId, resourceId, weekStart, allocationPct, note } = parsed.data;
  const weekDate = new Date(weekStart);
  try {
    await db.booking.update({
      where: { id },
      data: {
        projectId,
        resourceId,
        weekStart: weekDate,
        allocationPct,
        note: note?.trim() || null,
      },
    });
    revalidatePath("/planning");
    return { ok: true as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update booking";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return {
        ok: false as const,
        error: { _form: ["This resource is already assigned to this project for this week."] },
      };
    }
    return { ok: false as const, error: { _form: [msg] } };
  }
}

export async function deleteBooking(id: string) {
  try {
    await db.booking.delete({ where: { id } });
    revalidatePath("/planning");
    return { ok: true as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete booking";
    return { ok: false as const, error: { _form: [msg] } };
  }
}

export async function setResourceTimeOff(data: TimeOffFormData) {
  if (Number(data.offPct) <= 0) {
    const parsed = timeOffDeleteSchema.safeParse(data);
    if (!parsed.success) {
      return { ok: false as const, error: parsed.error.flatten().fieldErrors };
    }
    const { resourceId, weekStart } = parsed.data;
    try {
      await db.resourceTimeOff.deleteMany({
        where: {
          resourceId,
          weekStart: new Date(weekStart),
        },
      });
      revalidatePath("/planning");
      return { ok: true as const };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete time off";
      return { ok: false as const, error: { _form: [msg] } };
    }
  }

  const parsed = timeOffSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const { resourceId, weekStart, offPct } = parsed.data;
  const weekDate = new Date(weekStart);
  try {
    const saved = await db.resourceTimeOff.upsert({
      where: {
        resourceId_weekStart: {
          resourceId,
          weekStart: weekDate,
        },
      },
      update: { offPct },
      create: {
        resourceId,
        weekStart: weekDate,
        offPct,
      },
      select: { id: true },
    });
    revalidatePath("/planning");
    return { ok: true as const, timeOffId: saved.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save time off";
    return { ok: false as const, error: { _form: [msg] } };
  }
}

export async function deleteResourceTimeOff(id: string) {
  try {
    await db.resourceTimeOff.delete({ where: { id } });
    revalidatePath("/planning");
    return { ok: true as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete time off";
    return { ok: false as const, error: { _form: [msg] } };
  }
}
