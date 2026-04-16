import { PrismaClient } from "@prisma/client";

declare global {
  var __rmPrisma: PrismaClient | undefined;
}

/** True on common managed hosts; unset in GitHub Actions CI so build stays green. */
function isHostedAppRuntime(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.RAILWAY_ENVIRONMENT ||
      process.env.RENDER,
  );
}

/** Temporary: invalid URL on hosted runtime only — forces /api/health 503 after deploy. Revert after test. */
const hostedDbBreakUrl = isHostedAppRuntime()
  ? "postgresql://invalid:invalid@127.0.0.1:59999/nope?schema=public"
  : undefined;

export const db =
  global.__rmPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(hostedDbBreakUrl
      ? { datasources: { db: { url: hostedDbBreakUrl } } }
      : {}),
  });

if (process.env.NODE_ENV !== "production") global.__rmPrisma = db;

