# Local setup

Step-by-step instructions to run RESOURCE PLANNER locally.

## Prerequisites

- **Node.js 22** — Same major version as CI and [`package.json`](../package.json) `engines.node`. The repo pins **`22`** in **[`.nvmrc`](../.nvmrc)**; use nvm, fnm, Volta, or another tool so `node -v` reports v22.x. (`package.json` warns if the major does not match.)
- **npm** — Check: `npm -v`. Yarn/pnpm are not validated in CI; npm matches Actions.
- **PostgreSQL** — either:
  - Local Postgres (e.g. [PostgreSQL downloads](https://www.postgresql.org/download/)), or
  - A hosted DB (e.g. [Neon](https://neon.tech), Supabase). You will need the connection string.

## 1. Install dependencies

For a **clean install** that matches CI (uses `package-lock.json` exactly):

```bash
npm ci
```

After pulling dependency changes from git, prefer `npm ci` again. For **day-to-day** work when you intentionally change dependencies, `npm install` is fine.

### Production install (operators)

On the server or build image, prefer **`npm ci`** after checkout so installs match the lockfile (same as [CI-deploy](../.github/workflows/ci-deploy.yml)). If you use **`npm ci --omit=dev`**, remember that **`prisma`** (the CLI) is a **devDependency** here: run migrations or `prisma generate` only in an environment that still has the Prisma CLI available (e.g. full `npm ci` in the build stage, or a dedicated migrate step with dev deps).

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

### Application vs GitHub Actions secrets

Do not mix these up:

| Kind | Where | Purpose |
|------|--------|---------|
| **Application** | Production host, preview hosts, local `.env` | **`DATABASE_URL`** is required for the running app and for Prisma against your real database. |
| **GitHub Actions** | Repository **Secrets** | **`DEPLOY_WEBHOOK_URL`**, **`DEPLOY_HEALTH_CHECK_URL`**, **`SLACK_WEBHOOK_URL`** — used only by the workflow (deploy trigger, post-deploy health poll, optional Slack success and failure notifications). They are not Next.js env vars. |

**Production checklist:** Set **`DATABASE_URL`** on the host to the same database you run migrations against. There are no **`NEXT_PUBLIC_*`** variables required by the codebase today (v1). No auth secrets are used until you add auth.

Full workflow behavior: [docs/DEVELOPER_GUARDRAILS.md](DEVELOPER_GUARDRAILS.md).

### When `DATABASE_URL` must be set (build vs runtime)

The Prisma schema uses `env("DATABASE_URL")`. Align with CI by having the variable available wherever you run Prisma or `next build`.

| Phase | `DATABASE_URL` | Notes |
|--------|----------------|-------|
| **`prisma generate`** | Must be **set** | The URL does not need to be reachable for a successful generate, but the variable must exist. |
| **`prisma migrate deploy`** | Set and **reachable** | Applies migrations to the target database (CI uses ephemeral Postgres; production uses your real URL). |
| **`next build`** | Set (recommended) | CI exports `DATABASE_URL` for the whole build job. Use the same on your production build environment to avoid surprises; RSC routes use Prisma. |
| **Runtime** (`next start`, serverless) | **Required** | All live database access. |

**`NODE_ENV`** is set by Next/Node — not something you add to `.env` for normal use.

## 3. Database setup

Generate the Prisma client, run migrations, and seed demo data:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

- **First run:** `prisma migrate dev` will create the database schema. You may be prompted for a migration name; you can accept the default or use e.g. `init` if creating the first migration manually.
- **Seed:** Inserts a few sample projects, resources, and bookings so you can use the planning view immediately. The seed command is set in **[`prisma.config.ts`](../prisma.config.ts)** (`migrations.seed`), not in `package.json` (deprecated from Prisma 7 onward).

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
- **`npm test` fails with an engine / unsupported Node error** — Use **Node 22** (see Prerequisites and `.nvmrc`).

## CI and deploy (maintainers)

Pushes to **`main`** run **[`.github/workflows/ci-deploy.yml`](../.github/workflows/ci-deploy.yml)** on GitHub Actions (GitHub-hosted **`ubuntu-latest`**): **`build`** (ephemeral Postgres in CI, same steps as a full check + `next build`) then **`deploy`**. The deploy job always runs after a green build; it **`POST`s** the repository secret **`DEPLOY_WEBHOOK_URL`** only when that secret is set—otherwise the workflow succeeds without calling the webhook (e.g. forks). After a successful deploy webhook, if **`DEPLOY_HEALTH_CHECK_URL`** is set to your public **`GET /api/health`** URL, the workflow retries that endpoint until HTTP **200** (or fails the job); if unset, that step is skipped. When **`build`** and **`deploy`** both succeed, job **`notify-success`** runs and **`POST`s** a Slack Incoming Webhook payload if **`SLACK_WEBHOOK_URL`** is set (workflow name, repository, branch, full commit SHA, workflow run URL; if that secret is unset, the step logs and succeeds without notifying). When **`build`** or **`deploy`** fails, job **`notify-failure`** runs and **`POST`s** a Slack Incoming Webhook payload if **`SLACK_WEBHOOK_URL`** is set (full commit SHA, branch, workflow run log link; best-effort **Jobs** API enrichment for the failed **step** and a **failed job** log link; if that secret is unset, the step logs and succeeds without notifying). Details and changelog: **[docs/DEVELOPER_GUARDRAILS.md](DEVELOPER_GUARDRAILS.md)**.
