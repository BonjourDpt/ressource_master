# Local setup

Step-by-step instructions to run Resource Master locally.

## Prerequisites

- **Node.js** **20**, **22**, or **24+** (LTS 20.x or 22.x is fine). Vitest 4 and other dev tooling in this repo do not support Node 18. Check: `node -v`
- **npm** (or yarn/pnpm). Check: `npm -v`
- **PostgreSQL** — either:
  - Local Postgres (e.g. [PostgreSQL downloads](https://www.postgresql.org/download/)), or
  - A hosted DB (e.g. [Neon](https://neon.tech), Supabase). You will need the connection string.

## 1. Install dependencies

```bash
npm install
```

## 2. Environment variables

Create a `.env` file in the project root (do not commit it; `.env*` is in `.gitignore`).

Copy the example and set your database URL:

```bash
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

Examples:

- **Local Postgres:**  
  `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/resource_master?schema=public"`

- **Neon / hosted:**  
  Use the connection string from your provider (often includes `?sslmode=require`).

## 3. Database setup

Generate the Prisma client, run migrations, and seed demo data:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

- **First run:** `prisma migrate dev` will create the database schema. You may be prompted for a migration name; you can accept the default or use e.g. `init` if creating the first migration manually.
- **Seed:** Inserts a few sample projects, resources, and bookings so you can use the planning view immediately.

## 4. Run the dev server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000). The root path redirects to `/planning`.

## 5. Run tests (optional)

```bash
npm test
```

Runs the Vitest suite once (`vitest run`). Use `npm run test:watch` for watch mode during development.

## 6. Verify

- Open [http://localhost:3000/planning](http://localhost:3000/planning) — you should see the planning grid and sample data.
- Visit `/projects` and `/resources` to manage entities.

## Troubleshooting

- **In development, a full-screen “Developer setup” message** — The app could not load the database (missing Prisma client, missing tables, wrong `DATABASE_URL`, or connection failure). Follow the on-screen steps; they mirror the cases below.
- **"Environment variable not found: DATABASE_URL"** — Ensure `.env` exists in the project root and contains `DATABASE_URL`.
- **Tables missing even though they exist in your host’s UI** — Your `DATABASE_URL` almost certainly points at a **different** database or branch than the one you opened (e.g. Neon vs Supabase, or another Neon branch). Align `.env` with that exact database, then run migrations if needed.
- **Prisma migrate fails (e.g. timeout on Neon)** — Retry once; if it persists, check network and DB availability.
- **Seed fails (e.g. unique constraint)** — Re-running `npm run prisma:seed` is idempotent (upserts). If you changed the seed data and hit conflicts, reset the DB with `npx prisma migrate reset` (drops data, reapplies migrations, runs seed).
- **`prisma generate` fails on Windows with `EPERM`** — Stop all Node processes (including other `npm run dev` windows), then run `npm run prisma:generate` again.
- **`npm test` fails with an engine / unsupported Node error** — Upgrade Node to **20**, **22**, or **24+** (see Prerequisites).
