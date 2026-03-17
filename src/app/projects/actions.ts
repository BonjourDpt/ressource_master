"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { projectSchema, type ProjectFormData } from "@/lib/validations";
export async function createProject(data: ProjectFormData) {
  const parsed = projectSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  const { name, client, color } = parsed.data;
  try {
    await db.project.create({
      data: {
        name: name.trim(),
        client: client?.trim() || null,
        color: color?.trim() || null,
      },
    });
    revalidatePath("/projects");
    revalidatePath("/planning");
    return { ok: true as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create project";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return { ok: false as const, error: { name: ["A project with this name already exists"] } };
    }
    return { ok: false as const, error: { _form: [msg] } };
  }
}

export async function updateProject(id: string, data: ProjectFormData) {
  const parsed = projectSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  const { name, client, color } = parsed.data;
  try {
    await db.project.update({
      where: { id },
      data: {
        name: name.trim(),
        client: client?.trim() || null,
        color: color?.trim() || null,
      },
    });
    revalidatePath("/projects");
    revalidatePath("/planning");
    return { ok: true as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update project";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return { ok: false as const, error: { name: ["A project with this name already exists"] } };
    }
    return { ok: false as const, error: { _form: [msg] } };
  }
}

export async function deleteProject(id: string) {
  try {
    await db.project.delete({ where: { id } });
    revalidatePath("/projects");
    revalidatePath("/planning");
    return { ok: true as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete project";
    return { ok: false as const, error: { _form: [msg] } };
  }
}
