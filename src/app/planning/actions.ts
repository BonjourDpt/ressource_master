"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { bookingSchema, type BookingFormData } from "@/lib/validations";

export async function createBooking(data: BookingFormData) {
  const parsed = bookingSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  const { projectId, resourceId, weekStart, allocationPct, note } = parsed.data;
  const weekDate = new Date(weekStart);
  try {
    await db.booking.create({
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
