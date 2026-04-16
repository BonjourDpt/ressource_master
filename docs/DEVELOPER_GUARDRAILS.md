# Developer guardrails (quality gates)

This document is a **living inventory** of how the project validates changes **before** they land on `main` and what exists **after** deployment. Update it whenever you add CI, git hooks, monitoring, or other gates so contributors know what is enforced automatically versus what they must run locally.

---

## Before changes reach `main`

These are the checks and conventions that exist **in this repository today**. A **pre-push** hook runs `npm run check:prepush` locally (see [Git hooks (Husky)](#git-hooks-husky)); run `npm run check` yourself before merging when you want a local production build too.

### Git hooks (Husky)


| Hook                                                     | What runs                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **pre-push** (`[.husky/pre-push](../.husky/pre-push)`)   | `npm run check:prepush` — Prisma `generate`, `typecheck`, and `lint` (no `next build`). Push is blocked if any step fails; **`next build`** still runs on **[CI-deploy](../.github/workflows/ci-deploy.yml)** for pushes to `main`.                                       |
| **prepare-commit-msg** (`[.husky/prepare-commit-msg](../.husky/prepare-commit-msg)`) | **Auto-appends** `Assisted-by: human-only` when the message has no `Assisted-by:` line yet (skips merge and `Merge ` / `Revert ` first lines). Override with env **`ASSISTED_BY`** for AI-assisted commits (see [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](AI_ASSISTED_CONTRIBUTIONS.md)). |
| **commit-msg** (`[.husky/commit-msg](../.husky/commit-msg)`) | Runs [`scripts/check-assisted-by.mjs`](../scripts/check-assisted-by.mjs) in **warn-only** mode: reminds you if the commit message lacks a non-empty `Assisted-by:` trailer (see [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](AI_ASSISTED_CONTRIBUTIONS.md)). Does **not** block the commit locally. |


Hooks are installed for contributors who run **`npm install`** or **`npm ci`** (the `prepare` script runs `husky`). For parity with CI on a fresh clone, use **`npm ci`**. **CI on `main`** enforces the same `Assisted-by` rule in **strict** mode during the `build` job (push fails if the head commit message is invalid). Run `npm test` or `npm run check:watch` in your workflow when you need tests before sharing work.

When a push is blocked, the hook prints **`PUSH BLOCKED`** to **stderr** after the failing command. Git then shows `error: failed to push some refs to '…'` (non-zero exit) even though the problem is local checks, not the remote—scroll up for `eslint` / `tsc` / Prisma errors, or run `npm run check:prepush` to reproduce.

### Environment variables (application vs CI)

- **Application (Next.js / Prisma):** Today the codebase requires **`DATABASE_URL`** for runtime and for Prisma CLI commands; there are no **`NEXT_PUBLIC_*`** or auth secrets in v1. See **[SETUP.md — Environment variables](SETUP.md#2-environment-variables)** for a production checklist and a **build vs runtime** table for `DATABASE_URL`.
- **GitHub Actions only:** Repository secrets **`DEPLOY_WEBHOOK_URL`**, **`DEPLOY_HEALTH_CHECK_URL`**, and **`SLACK_WEBHOOK_URL`** are **not** application env vars; they configure the workflow (deploy webhook, health poll, optional Slack on success and on failure).

### GitHub Actions

The `**build**`, `**deploy**`, `**notify-success**`, and `**notify-failure**` jobs use the GitHub-hosted `**ubuntu-latest**` runner.


| Workflow                                            | When it runs                 | What it runs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[CI-deploy](../.github/workflows/ci-deploy.yml)** | Every **push** to `**main`** | Job `**build`**: ephemeral Postgres 16 (`services.postgres`), job `DATABASE_URL` (no DB secrets), `npm ci`, `prisma generate`, `prisma migrate deploy`, `typecheck`, `lint`, `next build`. Node version follows `[.nvmrc](../.nvmrc)` via `actions/setup-node` with npm cache. Job `**deploy**` (after `build`, same runner): if Actions secret `**DEPLOY_WEBHOOK_URL**` is set, `curl` sends a **POST** request to trigger your host webhook; if unset, the step prints a skip message and **exits successfully** without calling the webhook (e.g. forks). The deploy job still **runs**—only the HTTP trigger is omitted. When the webhook ran and secret `**DEPLOY_HEALTH_CHECK_URL**` is set to the full public URL of **`GET /api/health`** (e.g. `https://your-host.example.com/api/health`), a follow-up step **retries** that URL until HTTP **200** or **fails the job** after repeated attempts (spacing between tries is defined in the workflow). If the health URL secret is unset, health verification is **skipped** after a successful webhook. Job `**notify-success**` (after `build` and `deploy`, same runner): runs **only** when both jobs succeed (`if: success()`). If Actions secret `**SLACK_WEBHOOK_URL**` is set, it **POST**s a Block Kit payload with workflow name, repository, branch, **full** commit SHA, and the **workflow run** log URL; if unset, the step logs that the secret is missing and **exits successfully** without calling Slack. Job `**notify-failure**` (after `build` and `deploy`, same runner): runs **only** when the workflow is in a failed state (`if: failure()`). Uses `permissions: actions: read` so the job can call the GitHub **Jobs** API (best-effort) to enrich Slack with the first failed **step** and a **failed job** log link; if that call fails or is non-200, notification still succeeds with **full** commit SHA, branch, coarse **failed job** (`build` vs `deploy` from `needs.*.result`), and the **workflow run** log URL. If Actions secret `**SLACK_WEBHOOK_URL**` (Slack Incoming Webhook) is set, it **POST**s a Block Kit payload; if unset, the step logs that the secret is missing and **exits successfully** without calling Slack. |

After `actions/setup-node`, job **`build`** runs a **strict** check that **`HEAD`** includes a non-empty **`Assisted-by:`** line ([`scripts/check-assisted-by.mjs`](../scripts/check-assisted-by.mjs)); see [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](AI_ASSISTED_CONTRIBUTIONS.md).

### Recommended local command sequence


| Command               | What it validates                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `npm run check`        | Prisma client generation (`prisma generate`), TypeScript (`tsc --noEmit`), ESLint (`eslint .`), and a production `next build`. |
| `npm run check:prepush` | Same as `check` but **without** `next build` — used by the Husky **pre-push** hook for a faster gate.                            |
| `npm run check:watch`  | Same as `check`, then the Vitest suite (`vitest run`).                                                                         |


Run `check` (or at least `typecheck`, `lint`, and `build`) before opening a PR or merging to `main`. Run `check:watch` when you want tests included in that loop.

Individual scripts from `[package.json](../package.json)`:


| Script                            | Purpose                                                                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm run prisma:generate`         | Ensures `@prisma/client` matches the schema (first step of `check` and `check:prepush`).                                      |
| `npm run typecheck`               | TypeScript with **strict** mode (`tsconfig.json`); no emit.                                                                  |
| `npm run lint`                    | ESLint with `eslint-config-next` **Core Web Vitals** + **TypeScript** presets (`[eslint.config.mjs](../eslint.config.mjs)`). |
| `npm run build`                   | Next.js production build (catches many bundling and framework-level issues).                                                 |
| `npm test` / `npm run test:watch` | Vitest: `src/**/*.test.ts` in Node, `src/**/*.test.tsx` in jsdom (`[vitest.config.ts](../vitest.config.ts)`).                |
| `npm run check:commit-msg`       | Pass a commit message file after `--`, e.g. `npm run check:commit-msg -- .git/COMMIT_EDITMSG` (optional `--strict`). Hooks and CI invoke [`scripts/check-assisted-by.mjs`](../scripts/check-assisted-by.mjs) directly. |


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
| `[.cursor/rules/ai-assisted-contributions.mdc](../.cursor/rules/ai-assisted-contributions.mdc)` | AI attribution: no `Signed-off-by` from agents; `Assisted-by` commit trailers; sync docs when policy changes. |
| `[.cursor/skills/documentation-sync/SKILL.md](../.cursor/skills/documentation-sync/SKILL.md)` | Full checklist: repo docs, Help dialog, cheatsheet, version bump rules. |
| `[.cursor/skills/tdd/SKILL.md](../.cursor/skills/tdd/SKILL.md)`                               | TDD workflow for feature work when using that skill.                    |
| [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](AI_ASSISTED_CONTRIBUTIONS.md)                           | Human/agent responsibilities, `Assisted-by` format, hook/CI behavior.   |


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

### Health / readiness (production)

- **`GET /api/health`** — Implemented in [`src/app/api/health/route.ts`](../src/app/api/health/route.ts). Responds with **`Cache-Control: no-store`**. Returns **200** and `status: "ok"` when the app and database (Prisma `SELECT 1`) are reachable; **503** and `status: "degraded"` when the database check fails (generic `error` message in JSON only—no raw exception details). Always **`dynamic = "force-dynamic"`** and **`runtime = "nodejs"`**.

### Not in the repo yet

- **E2E or smoke tests against production** — Not defined in this repo.
- **Monitoring / alerting** — Mostly external to the codebase. **Optional:** CI can post a Slack message when `build` and `deploy` succeed and on failure when **`SLACK_WEBHOOK_URL`** is set (see [GitHub Actions](#github-actions) table). Document other providers and dashboards here if you adopt them.

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
| 2026-04-16 | **`GET /api/health`**: liveness + DB readiness; CI deploy may poll `DEPLOY_HEALTH_CHECK_URL` after webhook (retries).                                |
| 2026-04-16 | Husky **pre-push** runs `npm run check:prepush` (generate, typecheck, lint only); full `next build` remains on CI for `main`.                         |
| 2026-04-16 | Pre-push hook prints **`PUSH BLOCKED`** on failure and a success line when checks pass; docs note Git’s `failed to push some refs` vs hook failures.   |
| 2026-04-16 | CI **`notify-success`** job: after green `build` and `deploy`, optional Slack via **`SLACK_WEBHOOK_URL`** (`if: success()`; skipped with success when unset). |
| 2026-04-16 | CI **`notify-failure`** job: on workflow failure, optional Slack via Actions secret **`SLACK_WEBHOOK_URL`** (skipped with success when unset).            |
| 2026-04-16 | **`notify-failure`**: `actions: read`; best-effort Jobs API for failed **step** + job log link; fallback **full** SHA, branch, failed job heuristic, run URL. |
| 2026-04-16 | **Env alignment:** Node **22** in `package.json` `engines` and `.nvmrc`; [SETUP.md](SETUP.md) documents **`npm ci`**, application vs CI secrets, and **`DATABASE_URL`** at build vs runtime; [`.env.example`](../.env.example) lists required and reserved keys. |
| 2026-04-16 | **AI-assisted contributions:** [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](AI_ASSISTED_CONTRIBUTIONS.md), Husky **`commit-msg`** (warn), CI **`build`** strict `Assisted-by` check ([`scripts/check-assisted-by.mjs`](../scripts/check-assisted-by.mjs)), Cursor rule `ai-assisted-contributions.mdc`; documentation-sync owns ongoing updates. |
| 2026-04-16 | Husky **`prepare-commit-msg`**: auto-append `Assisted-by` (default `human-only`, override **`ASSISTED_BY`**); see [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](AI_ASSISTED_CONTRIBUTIONS.md). |


---

## Related docs

- [SETUP.md](SETUP.md) — Local install, env, migrations, tests, troubleshooting.
- [PRODUCT_ASSUMPTIONS.md](PRODUCT_ASSUMPTIONS.md) — Security and deployment assumptions (e.g. internal use).

