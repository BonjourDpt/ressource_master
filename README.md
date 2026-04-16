# RESOURCE PLANNER

Internal web app to visualize and manage resource allocation across projects on a weekly basis.

## Overview

**RESOURCE PLANNER** answers a simple question: **who is on what project, and when?** It provides a weekly timeline (by project or by resource), CRUD for projects, resources, and bookings, and a minimalist dark UI suited for internal planning.

**Why it exists:** Lightweight alternative to heavy PPM tools for teams that need quick visibility and editing of who is assigned to which project each week — without timesheets, approvals, or permissions.

## Key features

- **Projects** — Create, edit, archive, restore, and delete projects (name, optional client, color from a fixed palette of ten swatches).
- **Resources** — Create, edit, archive, restore, and delete resources (name, optional role and team, weekly capacity in hours).
- **Bookings** — Assign a resource to a project for a given week with an allocation percentage (1–100%); create, edit, and delete inline from the planning grid. Attach optional notes to any booking.
- **Planning undo / redo** — After a successful save from the grid, reverse or re-apply the last allocation changes (**Undo** / **Redo** in the planning toolbar, or **Ctrl+Z** / **Ctrl+Y** / **Ctrl+Shift+Z**, and **⌘** equivalents on macOS). History is kept only for the current browser session and is cleared when you switch between *By project* and *By resource*.
- **Planning view** — Weekly grid with a sticky header row (name columns + week dates) while scrolling; toggle *By project* or *By resource*. In *By resource* mode, each resource block ends with a **Total allocation** band (summed % per week). Week navigation with This week button, single/multi-week arrows, and configurable span (4/8/12 weeks; **12** by default when `span` is not in the URL). Team filtering. URL-based state for shareable views.
- **Search & filter** — Search by name, client, role, or team on list pages. Filter by status (Active / Archived / All) and by team.
- **Over-allocation warnings** — Visual indicators when a resource exceeds 100% in a week.
- **CSV import** — Bulk import projects or resources from CSV/TSV files with automatic column mapping, preview, and upsert-by-name.
- **In-app help** — Cheatsheet accessible via the **?** button in the header, covering all features and keyboard shortcuts.
- **Toast notifications** — Non-blocking success/error feedback for all actions via Sonner.
- **No auth (v1)** — No login or permissions; internal use only.

## Tech stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4, custom dark-first design system (CSS variables), Geist font
- **Data:** Prisma ORM, PostgreSQL
- **Validation:** Zod
- **UI libraries:** Sonner (toasts), focus-trap-react (modal accessibility)
- **CSV:** PapaParse
- **Date logic:** Custom ISO-week utilities (`lib/weeks.ts`)
- **Tests:** Vitest 4 (`npm test`, `npm run test:watch`); see [docs/SETUP.md](docs/SETUP.md) for Node version requirements.

## Screens

| Screen | Purpose |
|--------|---------|
| **Planning** (`/planning`) | Weekly timeline grid with a sticky header row (name columns + week dates) while scrolling. Toggle by project or by resource. Inline editing of allocation percentages. Undo/redo for saved allocation changes. Notes on cells. Team filter, This week button, span selector. |
| **Projects** (`/projects`) | List with search, status filter (Active/Archived/All). Create/edit via modal. Archive/restore/delete with confirmation dialogs. |
| **Resources** (`/resources`) | List with search, status filter, team filter. Create/edit via modal with capacity field. Archive/restore/delete. |
| **Admin** (`/admin`) | CSV import wizard: upload, map columns, preview, and import. |

**Concepts:** A **booking** is a single assignment: one resource, one project, one week, one allocation percentage, and an optional note. One resource can have multiple bookings in the same week (different projects); over 100% is allowed but shown as a warning.

## Quick start

1. Use **Node.js 22** (same as CI). The repo pins it in **[`.nvmrc`](.nvmrc)**; use nvm, fnm, or another version manager so `node -v` matches. Then see **[docs/SETUP.md](docs/SETUP.md)** for install, env, database, and running the app.
2. After setup: `npm run dev` → open [http://localhost:3000](http://localhost:3000). Root redirects to `/planning`.
3. Click the **?** button in the header for the built-in cheatsheet, or read [CHEATSHEET.md](CHEATSHEET.md).

## Developer setup errors

If something is misconfigured, **`npm run dev` shows an in-browser “Developer setup” page (development only)** with the most likely causes and commands to run. Typical cases:

| What you see | What it usually means |
|--------------|------------------------|
| **Prisma Client has not been generated** | Run `npm run prisma:generate`, then restart the dev server. On Windows, stop other Node processes first if `prisma generate` fails with `EPERM` / “operation not permitted” when renaming the query engine. |
| **Database tables are missing or DATABASE_URL points at the wrong database** | The app is connected to a Postgres instance where the `Project` / `Resource` / `Booking` tables do not exist—often because **`.env` points at a different host or branch** than the database you checked in your provider UI (e.g. Neon *production* vs Supabase, or another Neon branch). Fix `DATABASE_URL`, then run `npm run prisma:migrate` (and optionally `npm run prisma:seed`) against that same database. |
| **Cannot reach the database** | Wrong URL, paused server (e.g. Neon asleep), or network/VPN issues. Confirm the connection string from your provider’s dashboard. |

Authoritative step-by-step setup, including migrations and seed, remains in **[docs/SETUP.md](docs/SETUP.md)**.

## Contributing and AI assistance

**Project stance:** Development here has used **AI coding assistance from the start**, alongside human ownership; see **[docs/AI_ASSISTED_CONTRIBUTIONS.md](docs/AI_ASSISTED_CONTRIBUTIONS.md)** for the full historical note and [`docs/PRODUCT_ASSUMPTIONS.md`](docs/PRODUCT_ASSUMPTIONS.md) (development process).

Commits must include a non-empty **`Assisted-by:`** line. **Husky** **`prepare-commit-msg`** fills it in using **`ASSISTED_BY`** (one commit), then **`git config ressource.assistedBy`**, then by default **`Cursor:unspecified`** so you do not need to type the line. **CI on `main`** enforces the rule on the pushed commit. Policy aligns with the Linux kernel’s [coding-assistants](https://github.com/torvalds/linux/blob/master/Documentation/process/coding-assistants.rst) guidance.

## Documentation

| Doc | Purpose |
|-----|---------|
| [.cursor/skills/](.cursor/skills/) | Cursor agent skills (workflows for contributors; each skill is a `SKILL.md` folder) |
| [docs/SETUP.md](docs/SETUP.md) | Install, env, migrations, seed, troubleshooting |
| [docs/DEVELOPER_GUARDRAILS.md](docs/DEVELOPER_GUARDRAILS.md) | Quality gates: Husky pre-push, GitHub Actions on `main`, runtime probes; full inventory |
| [docs/AI_ASSISTED_CONTRIBUTIONS.md](docs/AI_ASSISTED_CONTRIBUTIONS.md) | `Assisted-by` commit trailers, human vs agent responsibilities, hook/CI behavior |
| [.github/workflows/ci-deploy.yml](.github/workflows/ci-deploy.yml) | CI on push to `main`: `build` (strict **`Assisted-by`** on `HEAD`, then `npm ci` … `next build`) then `deploy` on `ubuntu-latest`; webhook `POST` when `DEPLOY_WEBHOOK_URL` is set; optional `DEPLOY_HEALTH_CHECK_URL` polls `GET /api/health` after deploy; optional `notify-success` / `notify-failure` + `SLACK_WEBHOOK_URL` for Slack alerts |
| [CHEATSHEET.md](CHEATSHEET.md) | End-user reference (mirrors in-app help) |
| [docs/ui-system.md](docs/ui-system.md) | Design tokens, layout, and component conventions |
| [docs/PRODUCT_ASSUMPTIONS.md](docs/PRODUCT_ASSUMPTIONS.md) | Domain model, weeks, lifecycle, security assumptions |
| [docs/FUTURE_IMPROVEMENTS.md](docs/FUTURE_IMPROVEMENTS.md) | Backlog ideas post-MVP |

## Project philosophy

- **MVP first** — Only what's needed for internal planning; no enterprise scope.
- **Simplicity** — Straightforward patterns, minimal abstractions, easy to change.
- **Internal tool** — No auth or permissions in v1; trust and access controlled outside the app.
