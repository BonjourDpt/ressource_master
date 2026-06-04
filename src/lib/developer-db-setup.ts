import { Prisma } from "@prisma/client";

export type DeveloperSetupFailure = {
  title: string;
  summary: string;
  causes: string[];
  steps: string[];
};

/**
 * Maps common local-setup failures to actionable copy. Returns null for unrelated errors.
 */
export function parseDeveloperDbSetupFailure(err: unknown): DeveloperSetupFailure | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2021") {
      const table =
        typeof err.meta === "object" && err.meta !== null && "table" in err.meta
          ? String((err.meta as { table?: unknown }).table)
          : null;

      return {
        title: "Database tables are missing or DATABASE_URL points at the wrong database",
        summary: table
          ? `Prisma reported that ${table} does not exist on the database you are connected to (code P2021).`
          : "Prisma reported a missing table (code P2021).",
        causes: [
          "Migrations were never applied to this database (the schema was never created here).",
          "DATABASE_URL in .env points at a different Postgres database or branch than the one you opened in your host’s console (e.g. Neon production vs another branch, or Neon vs Supabase).",
        ],
        steps: [
          "Open .env and confirm DATABASE_URL matches exactly the database where you expect tables like Project, Resource, and Booking.",
          "Run: npm run prisma:generate",
          "Run: npm run prisma:migrate",
          "Optional sample data: npm run prisma:seed",
          "Restart: npm run dev",
          "Full steps: docs/SETUP.md",
        ],
      };
    }

    if (err.code === "P1001") {
      return {
        title: "Cannot reach the database",
        summary: "Prisma could not connect to the server (code P1001).",
        causes: [
          "DATABASE_URL is wrong, or the database is paused/offline.",
          "Network, firewall, or VPN blocking the connection.",
        ],
        steps: [
          "Verify DATABASE_URL in .env (host, port, user, password, database name).",
          "If you use Neon: ensure the project is not asleep; use the connection string from the Neon dashboard for the intended branch.",
          "Retry after checking network/VPN.",
          "See docs/SETUP.md",
        ],
      };
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return {
      title: "Prisma could not initialize the database client",
      summary: err.message || "Check DATABASE_URL and database availability.",
      causes: ["Invalid or incomplete DATABASE_URL.", "Database server not accepting connections."],
      steps: [
        "Verify DATABASE_URL in .env matches your provider’s connection string.",
        "Run: npx prisma validate",
        "See docs/SETUP.md",
      ],
    };
  }

  if (err instanceof Error) {
    const msg = err.message;
    if (/did not initialize yet/i.test(msg) && /prisma generate/i.test(msg)) {
      return {
        title: "Prisma Client has not been generated",
        summary:
          "@prisma/client is installed but the generated client is missing or outdated.",
        causes: [
          "Dependencies were installed but postinstall did not run prisma generate.",
          "A running dev server may have locked Prisma engine files on Windows; stop Node, then regenerate.",
        ],
        steps: [
          "Stop all Node processes (or close other dev servers using this repo).",
          "Run: npm run prisma:generate",
          "Run: npm run dev",
          "See docs/SETUP.md",
        ],
      };
    }
  }

  return null;
}
