import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __rmPrisma: PrismaClient | undefined;
}

export const db =
  global.__rmPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") global.__rmPrisma = db;

