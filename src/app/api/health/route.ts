import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckStatus = "ok" | "error";

type HealthChecks = {
  app: "ok";
  database: CheckStatus;
};

type HealthResponseOk = {
  status: "ok";
  timestamp: string;
  checks: HealthChecks & { database: "ok" };
};

type HealthResponseDegraded = {
  status: "degraded";
  timestamp: string;
  checks: HealthChecks & { database: "error" };
  error: string;
};

const noStore = { "Cache-Control": "no-store" } as const;

function logDbCheckFailure(err: unknown): void {
  if (err && typeof err === "object" && "name" in err) {
    const name = String((err as { name?: unknown }).name);
    const code =
      "code" in err ? String((err as { code?: unknown }).code) : undefined;
    console.error("[health] database check failed", { name, code });
    return;
  }
  console.error("[health] database check failed", { name: "UnknownError" });
}

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const body: HealthResponseOk = {
      status: "ok",
      timestamp,
      checks: { app: "ok", database: "ok" },
    };
    return NextResponse.json(body, { status: 200, headers: noStore });
  } catch (err) {
    logDbCheckFailure(err);
    const body: HealthResponseDegraded = {
      status: "degraded",
      timestamp,
      checks: { app: "ok", database: "error" },
      error: "Database check failed",
    };
    return NextResponse.json(body, { status: 503, headers: noStore });
  }
}
