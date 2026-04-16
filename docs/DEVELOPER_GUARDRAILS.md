# Developer guardrails (quality gates)

This document is a **living inventory** of how the project validates changes **before** they land on `main` and what exists **after** deployment. Update it whenever you add CI, git hooks, monitoring, or other gates so contributors know what is enforced automatically versus what they must run locally.

---

## Before changes reach `main`

These are the checks and conventions that exist **in this repository today**. A **pre-push** hook also runs `npm run check` locally (see [Git hooks (Husky)](#git-hooks-husky)).

### Git hooks (Husky)


| Hook                                                   | What runs                                                                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **pre-push** (`[.husky/pre-push](../.husky/pre-push)`) | `npm run check` — Prisma `generate`, `typecheck`, `lint`, and `next build`. Push is blocked if any step fails. |


Hooks are installed for contributors who run `npm install` (the `prepare` script runs `husky`). No commit-time hook is enabled by default; run `npm test` or `npm run check:watch` in your workflow when you need tests before sharing work.

### GitHub Actions

Both the `**build`** and `**deploy`** jobs use the GitHub-hosted `**ubuntu-latest**` runner.


| Workflow                                            | When it runs                 | What it runs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[CI-deploy](../.github/workflows/ci-deploy.yml)** | Every **push** to `**main`** | Job `**build`**: ephemeral Postgres 16 (`services.postgres`), job `DATABASE_URL` (no DB secrets), `npm ci`, `prisma generate`, `prisma migrate deploy`, `typecheck`, `lint`, `next build`. Node version follows `[.nvmrc](../.nvmrc)` via `actions/setup-node` with npm cache. Job `**deploy**` (after `build`, same runner): if Actions secret `**DEPLOY_WEBHOOK_URL**` is set, `curl` sends a **POST** request to trigger your host webhook; if unset, the step prints a skip message and **exits successfully** without calling the webhook (e.g. forks). The deploy job still **runs**—only the HTTP trigger is omitted. |


### Recommended local command sequence


| Command               | What it validates                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `npm run check`       | Prisma client generation (`prisma generate`), TypeScript (`tsc --noEmit`), ESLint (`eslint .`), and a production `next build`. |
| `npm run check:watch` | Same as `check`, then the Vitest suite (`vitest run`).                                                                         |


Run `check` (or at least `typecheck`, `lint`, and `build`) before opening a PR or merging to `main`. Run `check:watch` when you want tests included in that loop.

Individual scripts from `[package.json](../package.json)`:


| Script                            | Purpose                                                                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm run prisma:generate`         | Ensures `@prisma/client` matches the schema (also the first step of `check`).                                                |
| `npm run typecheck`               | TypeScript with **strict** mode (`tsconfig.json`); no emit.                                                                  |
| `npm run lint`                    | ESLint with `eslint-config-next` **Core Web Vitals** + **TypeScript** presets (`[eslint.config.mjs](../eslint.config.mjs)`). |
| `npm run build`                   | Next.js production build (catches many bundling and framework-level issues).                                                 |
| `npm test` / `npm run test:watch` | Vitest: `src/**/*.test.ts` in Node, `src/**/*.test.tsx` in jsdom (`[vitest.config.ts](../vitest.config.ts)`).                |


### Static analysis and types

- **TypeScript** — `strict: true` in `[tsconfig.json](../tsconfig.json)`.
- **ESLint** — Next.js–aligned rules (accessibility and TS-oriented defaults via `eslint-config-next`).

### Tests

- **Framework:** Vitest 4 with two projects (node + jsdom for React tests).
- **Scope:** Whatever is under `src/**/*.test.ts` and `src/**/*.test.tsx`; there is no coverage threshold enforced in config.

### Contributor workflows (Cursor)

These guide humans and agents; they are **not** enforced by `npm` or git:


| Location                                                                                      | Role                                                                    |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `[.cursor/rules/documentation.mdc](../.cursor/rules/documentation.mdc)`                       | When matched paths change, follow the documentation-sync workflow.      |
| `[.cursor/skills/documentation-sync/SKILL.md](../.cursor/skills/documentation-sync/SKILL.md)` | Full checklist: repo docs, Help dialog, cheatsheet, version bump rules. |
| `[.cursor/skills/tdd/SKILL.md](../.cursor/skills/tdd/SKILL.md)`                               | TDD workflow for feature work when using that skill.                    |


### Not in the repo yet

Use this subsection as a checklist when you add infrastructure. **Today:**

- **No CI on pull requests** — `[.github/workflows/ci-deploy.yml](../.github/workflows/ci-deploy.yml)` runs on pushes to `**main`** only, not on every PR (add a `pull_request` trigger if you want that).
- **No required-status documentation** — Branch protection, required reviewers, and merge queues live in your Git host; document them here when you set them up.

When you add an item, move it to the tables above and leave a one-line note under **Changelog** at the bottom of this file.

---

## After deployment

### Runtime behavior in the app


| Mechanism                | What it does                                                                                                                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Root layout DB probe** | `[src/app/layout.tsx](../src/app/layout.tsx)` runs a lightweight Prisma count on load. If the database is misconfigured or unreachable, users see a failure path instead of a broken shell.                                                   |
| **Development**          | Parsed errors render the full **Developer setup** UI (`[src/components/developer-setup-error.tsx](../src/components/developer-setup-error.tsx)`), with causes and commands (aligned with [README.md](../README.md) and [SETUP.md](SETUP.md)). |
| **Production**           | A short message points operators to server logs and `docs/SETUP.md`; see the `NODE_ENV === "production"` branch in the layout.                                                                                                                |
| **Error mapping**        | `[src/lib/developer-db-setup.ts](../src/lib/developer-db-setup.ts)` maps common Prisma codes (e.g. missing tables, connection failures) to actionable steps.                                                                                  |


### Application-level validation

- **Zod** and server-side patterns validate inputs for mutations and imports (see product code under `src/`). This is normal runtime validation, not a separate “deploy gate.”

### Not in the repo yet

- **Dedicated `/api/health` or liveness route** — Not present; add here if you introduce one.
- **E2E or smoke tests against production** — Not defined in this repo.
- **Monitoring / alerting** — External to the codebase; document provider and dashboards here if you adopt them.

---

## Changelog (guardrails only)


| Date       | Change                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-15 | Initial inventory: local `check` / `check:watch`, ESLint, TS strict, Vitest, layout DB probe, Cursor doc/TDD skills; noted missing CI and git hooks. |
| 2026-04-15 | Husky **pre-push** runs `npm run check` (Prisma generate, typecheck, lint, build); `prepare` script installs hooks on `npm install`.                 |
| 2026-04-15 | GitHub Actions **CI** on push to `main`: ephemeral Postgres, `prisma generate`, `migrate deploy`, typecheck, lint, build; Node from `.nvmrc`.        |
| 2026-04-15 | CI `**deploy` job**: after successful `build`, `POST` to `DEPLOY_WEBHOOK_URL` when set; no HTTP call when secret is empty (job still succeeds).      |
| 2026-04-16 | CI docs: both jobs on `**ubuntu-latest`**; clarify `**deploy`** always runs and only the webhook `**POST**` is conditional.                          |
| 2026-04-15 | CI workflow path: `[.github/workflows/ci-deploy.yml](../.github/workflows/ci-deploy.yml)` (was `ci.yml`).                                            |
| 2026-04-15 | README, SETUP, FUTURE_IMPROVEMENTS: point to `ci-deploy.yml`, deploy webhook, and maintainer-oriented CI summary.                                    |


---

## Related docs

- [SETUP.md](SETUP.md) — Local install, env, migrations, tests, troubleshooting.
- [PRODUCT_ASSUMPTIONS.md](PRODUCT_ASSUMPTIONS.md) — Security and deployment assumptions (e.g. internal use).

