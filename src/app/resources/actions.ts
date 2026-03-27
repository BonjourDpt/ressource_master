"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { resourceSchema, type ResourceFormData } from "@/lib/validations";
export async function createResource(data: ResourceFormData) {
  const parsed = resourceSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  const { name, role, team, capacity } = parsed.data;
  try {
    await db.resource.create({
      data: {
        name: name.trim(),
        role: role?.trim() || null,
        team: team?.trim() || null,
        capacity,
      },
    });
    revalidatePath("/resources");
    revalidatePath("/planning");
    return { ok: true as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create resource";
    return { ok: false as const, error: { _form: [msg] } };
  }
}

export async function updateResource(id: string, data: ResourceFormData) {
  const parsed = resourceSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  const { name, role, team, capacity } = parsed.data;
  try {
    await db.resource.update({
      where: { id },
      data: {
        name: name.trim(),
        role: role?.trim() || null,
        team: team?.trim() || null,
        capacity,
      },
    });
    revalidatePath("/resources");
    revalidatePath("/planning");
    return { ok: true as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update resource";
    return { ok: false as const, error: { _form: [msg] } };
  }
}

export async function deleteResource(id: string) {
  try {
    await db.resource.delete({ where: { id } });
    revalidatePath("/resources");
    revalidatePath("/planning");
    return { ok: true as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete resource";
    return { ok: false as const, error: { _form: [msg] } };
  }
}

export async function archiveResource(id: string) {
  try {
    await db.resource.update({ where: { id }, data: { status: "ARCHIVED" } });
    revalidatePath("/resources");
    revalidatePath("/planning");
    return { ok: true as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to archive resource";
    return { ok: false as const, error: { _form: [msg] } };
  }
}

export async function unarchiveResource(id: string) {
  try {
    await db.resource.update({ where: { id }, data: { status: "ACTIVE" } });
    revalidatePath("/resources");
    revalidatePath("/planning");
    return { ok: true as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to unarchive resource";
    return { ok: false as const, error: { _form: [msg] } };
  }
}
