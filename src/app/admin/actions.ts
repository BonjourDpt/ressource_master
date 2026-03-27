"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function checkExistingNames(
  entityType: "resource" | "project",
  names: string[],
): Promise<string[]> {
  if (names.length === 0) return [];

  const trimmed = names.map((n) => n.trim()).filter(Boolean);

  if (entityType === "project") {
    const existing = await db.project.findMany({
      where: { name: { in: trimmed } },
      select: { name: true },
    });
    return existing.map((r) => r.name);
  }

  const existing = await db.resource.findMany({
    where: { name: { in: trimmed } },
    select: { name: true },
  });
  return existing.map((r) => r.name);
}

interface ImportResult {
  ok: true;
  created: number;
  updated: number;
  errors: string[];
}

interface ImportError {
  ok: false;
  error: string;
}

export async function importCsvData(
  entityType: "resource" | "project",
  rows: Record<string, string>[],
): Promise<ImportResult | ImportError> {
  if (rows.length === 0) {
    return { ok: false, error: "No rows to import" };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      let created = 0;
      let updated = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name = row.name?.trim();

        if (!name) {
          errors.push(`Row ${i + 1}: missing name, skipped`);
          continue;
        }

        try {
          if (entityType === "resource") {
            const existing = await tx.resource.findFirst({
              where: { name },
              select: { id: true },
            });

            const data: Record<string, unknown> = {};
            if (row.role !== undefined && row.role !== "") data.role = row.role.trim();
            if (row.team !== undefined && row.team !== "") data.team = row.team.trim();
            if (row.capacity !== undefined && row.capacity !== "") {
              const cap = parseFloat(row.capacity);
              if (!isNaN(cap) && cap >= 0 && cap <= 168) data.capacity = cap;
            }
            if (row.status === "ACTIVE" || row.status === "ARCHIVED") {
              data.status = row.status;
            }
            if (row.createdAt !== undefined && row.createdAt !== "") {
              const d = new Date(row.createdAt);
              if (!isNaN(d.getTime())) data.createdAt = d;
            }

            if (existing) {
              await tx.resource.update({
                where: { id: existing.id },
                data,
              });
              updated++;
            } else {
              await tx.resource.create({
                data: {
                  name,
                  role: (data.role as string) ?? null,
                  team: (data.team as string) ?? null,
                  capacity: (data.capacity as number) ?? 37.5,
                  status: (data.status as "ACTIVE" | "ARCHIVED") ?? "ACTIVE",
                  ...(data.createdAt ? { createdAt: data.createdAt as Date } : {}),
                },
              });
              created++;
            }
          } else {
            const data: Record<string, unknown> = {};
            if (row.client !== undefined && row.client !== "") data.client = row.client.trim();
            if (row.color !== undefined && row.color !== "") data.color = row.color.trim();
            if (row.status === "ACTIVE" || row.status === "ARCHIVED") {
              data.status = row.status;
            }
            if (row.createdAt !== undefined && row.createdAt !== "") {
              const d = new Date(row.createdAt);
              if (!isNaN(d.getTime())) data.createdAt = d;
            }

            const existing = await tx.project.findUnique({
              where: { name },
              select: { id: true },
            });

            if (existing) {
              await tx.project.update({
                where: { id: existing.id },
                data,
              });
              updated++;
            } else {
              await tx.project.create({
                data: {
                  name,
                  client: (data.client as string) ?? null,
                  color: (data.color as string) ?? null,
                  status: (data.status as "ACTIVE" | "ARCHIVED") ?? "ACTIVE",
                  ...(data.createdAt ? { createdAt: data.createdAt as Date } : {}),
                },
              });
              created++;
            }
          }
        } catch (e) {
          errors.push(
            `Row ${i + 1} ("${name}"): ${e instanceof Error ? e.message : "unknown error"}`,
          );
        }
      }

      return { created, updated, errors };
    });

    revalidatePath("/resources");
    revalidatePath("/projects");
    revalidatePath("/planning");

    return { ok: true, ...result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Import failed",
    };
  }
}
