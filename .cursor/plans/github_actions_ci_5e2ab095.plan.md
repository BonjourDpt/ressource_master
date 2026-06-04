---
name: GitHub Actions CI
overview: Add a minimal `ci.yml` that runs on every push to `main`, pins Node 22 everywhere (matching your docs’ LTS guidance), and uses only an ephemeral Postgres service—`DATABASE_URL` is set in the workflow YAML; no GitHub Secrets for the database.
todos:
  - id: add-nvmrc
    content: Add `.nvmrc` with Node 22 (or 20 if production host uses 20)
    status: completed
  - id: add-ci-yml
    content: "Create `.github/workflows/ci.yml`: push main, setup-node from `.nvmrc`, ephemeral Postgres service + inline DATABASE_URL (no DB secrets), prisma generate + migrate deploy + build (+ optional lint/typecheck)"
    status: completed
  - id: update-guardrails
    content: Update `docs/DEVELOPER_GUARDRAILS.md` to mention GitHub Actions on push to main
    status: completed
isProject: false
---

# GitHub Actions CI for `main`

## Node version: what to use

**Recommendation: Node 22.x (LTS)** as the single version for local dev, CI, and the production host.

- Your own setup guide already lists **20, 22, or 24+** and calls out LTS 20.x or 22.x as fine ([`docs/SETUP.md`](docs/SETUP.md)). There is no Dockerfile or hosting pin in-repo yet, so **22** is a reasonable default that is current LTS-minded and matches that doc.
- **`package.json` has `@types/node: ^20`**—that only types the Node API surface; it does not force the runtime. You can keep it or later align to `@types/node` 22 when you want types to match 22 exactly.
- **Action:** add a root [`.nvmrc`](.nvmrc) with `22` (or a full line like `22.14.0` if you want byte-for-byte reproducibility). Optionally add an `"engines": { "node": ">=22 <23" }` (or `22.x`) in [`package.json`](package.json) so `npm` warns on mismatch—only if you want enforcement; keep it minimal if you prefer just `.nvmrc` + CI.

If your real production image or host (e.g. Vercel project setting) is pinned to **20**, switch the single version to **20** instead—the workflow shape stays identical.

## Why `npm run build` needs `DATABASE_URL` in CI (no Secrets)

**Required for a real production build in this app: `DATABASE_URL`.**

- Prisma’s schema binds the datasource to `env("DATABASE_URL")` ([`prisma/schema.prisma`](prisma/schema.prisma)).
- The root layout imports `db` and runs `count()` queries during prerender/build ([`src/app/layout.tsx`](src/app/layout.tsx)); with `NODE_ENV=production` during `next build`, a failed DB setup surfaces as build-time behavior or errors. So CI must supply a **working** Postgres URL and **applied migrations**, not just a syntactically valid string.

**No `NEXT_PUBLIC_*` usage** showed up in `src/`; no extra public env vars are required for build from the current codebase.

**Chosen approach (only):** define `DATABASE_URL` in the workflow job `env:` and point it at the **GitHub Actions `services.postgres`** container (ephemeral, CI-only user/password). The connection string lives in the repo YAML; that is acceptable because it is not production data and the database is destroyed after the job. **Do not** configure a GitHub Actions secret for Neon or any hosted DB for this pipeline—production/staging URLs stay on your deploy host only, not in CI.

## CI workflow design (simple, production-like)

Create [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

- **Trigger:** `push` to `main` only (per your success criteria).
- **Runner:** `ubuntu-latest`.
- **Node:** `actions/setup-node@v4` with `node-version-file: '.nvmrc'` and `cache: 'npm'`.
- **Postgres:** `services.postgres` (e.g. `postgres:16`—align image major version with production when you know it) with healthcheck; job-level `DATABASE_URL` to `localhost:5432` matching the service env.
- **Steps (keep short):**
  1. `actions/checkout@v4`
  2. `npm ci`
  3. `npx prisma generate`
  4. `npx prisma migrate deploy` (applies existing migrations to the empty CI DB—correct for CI)
  5. `npm run build` (core deliverable)

**Optional but high value** (still one job): run `npm run typecheck` and `npm run lint` before `build` so CI catches failures your Husky pre-push also runs via `npm run check` ([`docs/DEVELOPER_GUARDRAILS.md`](docs/DEVELOPER_GUARDRAILS.md)). This stays “simple” and closer to what contributors already run locally.

**Tests:** `npm test` is fast and needs no DB for typical unit tests; add if you want CI to match `check:watch` depth—your call for “simple” vs coverage.

## Docs touch (small)

When implementing, add a short bullet under “Before changes reach `main`” in [`docs/DEVELOPER_GUARDRAILS.md`](docs/DEVELOPER_GUARDRAILS.md) stating that **push to `main` runs GitHub Actions** (build + listed steps), so the inventory matches reality (per project documentation expectations for CI changes).

## Success criteria mapping

| Criterion | How this satisfies it |
|-----------|----------------------|
| Catches build failures before deploy | `npm run build` on `main` with real Prisma + migrated schema |
| Close to production | Same Node pin, Linux runner, Postgres, `migrate deploy`, production Next build |
| Env safety | CI DB via service + job `env` only; production DB URLs never in this workflow |

```mermaid
flowchart LR
  pushMain[push_to_main]
  checkout[checkout]
  npmCi[npm_ci]
  prismaGen[prisma_generate]
  migrate[migrate_deploy]
  build[next_build]
  pushMain --> checkout --> npmCi --> prismaGen --> migrate --> build
```
