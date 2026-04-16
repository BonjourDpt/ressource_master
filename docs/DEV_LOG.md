# Dev LOG (RSEDE / R&D funding)

**Append-only** development journal: record product-impacting work on this repo to support **RSEDE** and other **R&D subsidy / funding** applications. Entries are written from verifiable facts (files, outcomes) during **documentation-sync** (see [`../.cursor/skills/documentation-sync/SKILL.md`](../.cursor/skills/documentation-sync/SKILL.md)).

**Disclaimer:** this file is not legal, tax, or eligibility advice. Align wording with your organisation’s official RSEDE template.

**Repository:** [https://github.com/BonjourDpt/ressource_master.git](https://github.com/BonjourDpt/ressource_master.git) — history below reconstructed from `git log` on that remote’s default branch (`main`).

**Order:** **newest first**. Each new `###` entry goes **directly under this paragraph**, **before** any older entry (and **before** the optional `<!-- AGENT TEMPLATE -->` block at the end of the file).

### 2026-04-16 — Prisma: seed command in prisma.config.ts (package.json deprecation)

- **Date (UTC or local):** 2026-04-16
- **Operational summary:** Moved integrated DB seed from deprecated `package.json#prisma` to root **`prisma.config.ts`** (`schema`, `migrations.path`, `migrations.seed`) so `npx prisma generate` no longer warns about Prisma 7 removal; CI behavior unchanged.
- **Technical problem / uncertainty:** Prisma 6.19 deprecates `package.json#prisma` in favor of the config file; no Prisma major upgrade in this change.
- **Work performed:** [`prisma.config.ts`](../prisma.config.ts) (new); [`package.json`](../package.json) — removed `prisma` key; [`docs/SETUP.md`](SETUP.md), [`docs/FUTURE_IMPROVEMENTS.md`](FUTURE_IMPROVEMENTS.md); verified `npx prisma generate` and `npx prisma db seed` locally.
- **Result / status:** Implemented locally; `prisma generate` / `db seed` succeed without the deprecation line.
- **Links / traceability:** `*(to complete)*`

### 2026-04-16 — Docs: project-wide AI assistance since inception (maintainer note)

- **Date (UTC or local):** 2026-04-16
- **Operational summary:** Documented maintainer position that **RESOURCE PLANNER** development has used **AI coding assistance from project inception**, with human review; clarified that older commits may lack `Assisted-by` trailers; no Git history rewrite. Updated [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](AI_ASSISTED_CONTRIBUTIONS.md), [`docs/PRODUCT_ASSUMPTIONS.md`](PRODUCT_ASSUMPTIONS.md), [`README.md`](../README.md).
- **Technical problem / uncertainty:** Per-commit trailers vs global narrative for subsidy/readers.
- **Work performed:** [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](AI_ASSISTED_CONTRIBUTIONS.md) — **Project-wide note (historical)**; [`docs/PRODUCT_ASSUMPTIONS.md`](PRODUCT_ASSUMPTIONS.md) — **Development process**; [`README.md`](../README.md) — contributing blurb
- **Result / status:** Doc updates locally.
- **Links / traceability:** `*(to complete)*`

### 2026-04-16 — Default Assisted-by trailer: Cursor:unspecified (human-only via config)

- **Date (UTC or local):** 2026-04-16
- **Operational summary:** Changed **`prepare-commit-msg`** fallback from **`human-only`** to **`Cursor:unspecified`** so contributors need not type a line; human-only work uses **`git config ressource.assistedBy human-only`** or editing the message; docs/README/guardrails/rule updated.
- **Technical problem / uncertainty:** Default encodes “typical Cursor workflow”; accuracy for rare human-only commits relies on config or edit.
- **Work performed:**
  - [`.husky/prepare-commit-msg`](../.husky/prepare-commit-msg)
  - [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](AI_ASSISTED_CONTRIBUTIONS.md), [`docs/DEVELOPER_GUARDRAILS.md`](DEVELOPER_GUARDRAILS.md), [`README.md`](../README.md), [`.cursor/rules/ai-assisted-contributions.mdc`](../.cursor/rules/ai-assisted-contributions.mdc)
- **Result / status:** Implemented locally.
- **Links / traceability:** `*(to complete)*`

### 2026-04-16 — Assisted-by: git config ressource.assistedBy for session default

- **Date (UTC or local):** 2026-04-16
- **Operational summary:** Extended **`prepare-commit-msg`** resolution order: **`ASSISTED_BY`** → **`git config ressource.assistedBy`** → **`human-only`**; documented that full auto-detection of AI use is impossible; session **`git config`** as semi-automatic workflow.
- **Technical problem / uncertainty:** Accuracy still requires human toggling session config or env.
- **Work performed:**
  - [`.husky/prepare-commit-msg`](../.husky/prepare-commit-msg) — config fallback
  - [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](AI_ASSISTED_CONTRIBUTIONS.md), [`docs/DEVELOPER_GUARDRAILS.md`](DEVELOPER_GUARDRAILS.md), [`.cursor/rules/ai-assisted-contributions.mdc`](../.cursor/rules/ai-assisted-contributions.mdc)
- **Result / status:** Implemented locally.
- **Links / traceability:** `*(to complete)*`

### 2026-04-16 — Husky prepare-commit-msg: auto-append Assisted-by (ASSISTED_BY override)

- **Date (UTC or local):** 2026-04-16
- **Operational summary:** Added **[`.husky/prepare-commit-msg`](../.husky/prepare-commit-msg)** to append `Assisted-by: human-only` when missing; optional env **`ASSISTED_BY`** for AI-assisted commits; skips merge and `Merge ` / `Revert ` first lines; updated [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](AI_ASSISTED_CONTRIBUTIONS.md), [`docs/DEVELOPER_GUARDRAILS.md`](DEVELOPER_GUARDRAILS.md), [`README.md`](../README.md), Cursor rule, documentation-sync checklist.
- **Technical problem / uncertainty:** Default must satisfy CI without interactive prompts; contributors override per-commit via env.
- **Work performed:**
  - [`.husky/prepare-commit-msg`](../.husky/prepare-commit-msg) — new hook
  - [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](AI_ASSISTED_CONTRIBUTIONS.md), [`docs/DEVELOPER_GUARDRAILS.md`](DEVELOPER_GUARDRAILS.md), [`README.md`](../README.md), [`.cursor/rules/ai-assisted-contributions.mdc`](../.cursor/rules/ai-assisted-contributions.mdc), [`.cursor/skills/documentation-sync/SKILL.md`](../.cursor/skills/documentation-sync/SKILL.md)
- **Result / status:** Implemented locally.
- **Links / traceability:** `*(to complete)*`

### 2026-04-16 — AI contributions: document HEAD; Cursor rule asks A/B for Assisted-by

- **Date (UTC or local):** 2026-04-16
- **Operational summary:** Clarified what Git **`HEAD`** means for CI; updated [`.cursor/rules/ai-assisted-contributions.mdc`](../.cursor/rules/ai-assisted-contributions.mdc) so agents **ask the user to choose** human-only vs AI-assisted before suggesting a commit message; noted that auto-append needs a hook, not the chat agent alone.
- **Technical problem / uncertainty:** None beyond aligning contributor expectations with enforcement scope (`git log -1`).
- **Work performed:**
  - [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](AI_ASSISTED_CONTRIBUTIONS.md) — `HEAD` explanation in enforcement section
  - [`.cursor/rules/ai-assisted-contributions.mdc`](../.cursor/rules/ai-assisted-contributions.mdc) — mandatory A/B prompt before draft commit messages
- **Result / status:** Doc + rule updated locally.
- **Links / traceability:** `*(to complete)*`

### 2026-04-16 — AI-assisted contributions: Assisted-by policy, hooks, CI, documentation-sync ownership

- **Date (UTC or local):** 2026-04-16
- **Operational summary:** Adopted Linux-kernel–inspired AI contribution practices for this repo: human-only DCO certification, `Assisted-by` commit trailers, Husky **`commit-msg`** (warn-only), strict check on **`main`** CI `build`, shared [`scripts/check-assisted-by.mjs`](../scripts/check-assisted-by.mjs), contributor doc [`AI_ASSISTED_CONTRIBUTIONS.md`](AI_ASSISTED_CONTRIBUTIONS.md), Cursor rule `ai-assisted-contributions.mdc`, and documentation-sync skill updates for ongoing maintenance.
- **Technical problem / uncertainty:** Balance traceability (RSEDE / audit) with developer friction; warn locally vs fail in CI on `HEAD` only.
- **Work performed:**
  - [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](AI_ASSISTED_CONTRIBUTIONS.md) — policy, enforcement, edge cases
  - [`scripts/check-assisted-by.mjs`](../scripts/check-assisted-by.mjs) — message validation (strict / warn, merge/revert skip)
  - [`.husky/commit-msg`](../.husky/commit-msg) — local warn hook
  - [`.github/workflows/ci-deploy.yml`](../.github/workflows/ci-deploy.yml) — strict `Assisted-by` step after `setup-node`
  - [`docs/DEVELOPER_GUARDRAILS.md`](DEVELOPER_GUARDRAILS.md), [`README.md`](../README.md), [`package.json`](../package.json) — cross-links and `check:commit-msg` script
  - [`.cursor/rules/ai-assisted-contributions.mdc`](../.cursor/rules/ai-assisted-contributions.mdc), [`.cursor/skills/documentation-sync/SKILL.md`](../.cursor/skills/documentation-sync/SKILL.md) — agent rules and doc-sync triggers/checklist
- **Result / status:** Implemented locally; awaiting merge to `main` with a commit message that includes `Assisted-by:` for CI.
- **Links / traceability:** `*(to complete — commit SHA after merge)*`

### 2026-04-16 — RSEDE Dev LOG: English journal + documentation-sync integration

- **Date (UTC or local):** 2026-04-16
- **Operational summary:** Added `docs/DEV_LOG.md`, extended `.cursor/skills/documentation-sync/SKILL.md` with mandatory Dev LOG steps (RSEDE traceability), and switched log field labels to English. Prior stub entry consolidated into full repo history below.
- **Technical problem / uncertainty:** Keep subsidy-oriented traceability without inventing eligibility; align agent workflow with a single canonical log file.
- **Work performed:**
  - [`.cursor/skills/documentation-sync/SKILL.md`](../.cursor/skills/documentation-sync/SKILL.md) — Dev LOG section, checklist, step 11, output §8, English field definitions
  - [`DEV_LOG.md`](DEV_LOG.md) — preamble, historical entries backfilled from git, EOF template comment
- **Result / status:** Workspace changes (staged/uncommitted relative to `origin/main` at time of edit); complements commit `b229218` on `main`.
- **Links / traceability:** `main` @ `b229218e29044a1637a77540002b0dc693b22f51` (prior); working tree — Dev LOG skill + this file

### 2026-04-16 — CI/CD: deploy guards, health checks, Slack notifications

- **Date (UTC or local):** 2026-04-16
- **Operational summary:** Hardened GitHub Actions deploy workflow: `DEPLOY_WEBHOOK_URL` guard, updated `actions/checkout` and `actions/setup-node`, deployment documentation, `/api/health` (or equivalent) for post-deploy verification, concurrency/timeouts, richer logging, Slack failure and success notifications; added `.env.example` and Node version notes in docs; temporary CI experiments (type error, hosted DB override) added and reverted.
- **Technical problem / uncertainty:** Reliable deploy verification and operator visibility without leaking secrets in logs.
- **Work performed:**
  - [`.github/workflows/ci-deploy.yml`](../.github/workflows/ci-deploy.yml) — workflow iterations through `b229218`
  - [`docs/SETUP.md`](../docs/SETUP.md) / related CI docs — deployment and runner notes (commits `1d0aeef`, `6dadb36`, `b241afa`, `fd5eb8e`, etc.)
  - [`src/app/api/health/route.ts`](../src/app/api/health/route.ts) — introduced `6fadaef`, refined in follow-up CI commits
- **Result / status:** Merged to `main` through `b229218e29044a1637a77540002b0dc693b22f51`.
- **Links / traceability:** `d110d5f` … `b229218` (see git log 2026-04-16)

### 2026-04-15 — GitHub Actions CI, Husky pre-push, developer guardrails

- **Date (UTC or local):** 2026-04-15
- **Operational summary:** Introduced CI (GitHub Actions) with Node version management, pre-push hooks via Husky, and `docs/DEVELOPER_GUARDRAILS.md` plus README updates describing local and CI checks.
- **Technical problem / uncertainty:** Enforce quality gates before push and in CI without blocking legitimate workflows.
- **Work performed:**
  - [`.github/workflows/`](../.github/workflows/) — initial CI (`d32e80f`, deploy doc updates `97cd2e4`)
  - [`.husky/`](../.husky/) — pre-push (`ba36cb8`, refinements `b241afa`, `fd5eb8e`)
  - [`docs/DEVELOPER_GUARDRAILS.md`](../docs/DEVELOPER_GUARDRAILS.md) — `27dab43`
  - [`README.md`](../README.md) — guardrails pointer
- **Result / status:** Merged (`d32e80f`, `ba36cb8`, `27dab43`, `97cd2e4`).
- **Links / traceability:** `d32e80f08341b611f3c49a77338aff4e0acfb04b`, `ba36cb80de58de744b4531996fbd37faac9959fd`, `27dab43071c5678994c24a9d3fadd713f62ac6a9`, `97cd2e45dff446a02710b5c01a52d778b4c151d5`

### 2026-04-15 — Planning components: state management and testability refactors

- **Date (UTC or local):** 2026-04-15
- **Operational summary:** Refactored project and resource UI components for clearer state management and improved test coverage alignment after the reverted theme work.
- **Technical problem / uncertainty:** Reduce coupling and stabilize behavior for planning-related forms and lists.
- **Work performed:**
  - Planning / admin components under [`src/`](../src/) — `267240132aa1cd0bf9d8698f63b1c71e155a060f`
- **Result / status:** Merged.
- **Links / traceability:** `267240132aa1cd0bf9d8698f63b1c71e155a060f`

### 2026-04-15 — Light mode and theme pipeline (prototyped, then reverted)

- **Date (UTC or local):** 2026-04-15
- **Operational summary:** Implemented light mode and theme updates (`queueMicrotask` scheduling), bumped app version to 3.2.0; series reverted by follow-up commits the same day.
- **Technical problem / uncertainty:** Theme switching performance and flash-free updates across the design system.
- **Work performed:**
  - Theme-related `src` changes — `a177410`, `9da759f`, `4f1321d`
  - Reverts — `8fefbaa`, `b85efcd`, `201ee7b`, `1b9bd14`, `5a13909`
- **Result / status:** Reverted on `main`; no lasting light-mode release from this spike.
- **Links / traceability:** `a177410175ff447e944e0c1252585cd4cf01dbe0` … `5a139096bd81c98b5d95cfe9cbe70bc7b75546a9`

### 2026-04-14 — Product branding, Vitest upgrade, planning table polish

- **Date (UTC or local):** 2026-04-14
- **Operational summary:** Rebranded the app to **RESOURCE PLANNER** across UI and docs; bumped Vitest to 4.1.4 and adjusted TypeScript route imports; refined `PlanningTable` sticky header behavior (`border-separate`, header usability); updated Node/testing documentation; synced `package.json` and `src/lib/app-version.ts` labels; improved `AppBrandIcon` (Webkit mask).
- **Technical problem / uncertainty:** Sticky headers with separated borders in scrollable planning grids; toolchain compatibility after Vitest major bump.
- **Work performed:**
  - Branding — `2f0d193`, `22cc597`, `ad82f841`
  - [`src/components/.../PlanningTable`](../src/components/) — `d38671d`, `095b10f`
  - [`.cursor/skills/documentation-sync/SKILL.md`](../.cursor/skills/documentation-sync/SKILL.md) — semver bump process `2c67843`
  - [`package.json`](../package.json), [`src/lib/app-version.ts`](../src/lib/app-version.ts) — version sync
  - [`docs/SETUP.md`](../docs/SETUP.md) — `37665c5`
  - Vitest — `640884c`
  - [`AppBrandIcon`](../src/) — `0b7164c`
- **Result / status:** Merged.
- **Links / traceability:** `d38671dbfe7511e29af066cbb7dc2b87d38f5212` … `0b7164c90399a2f4fd34aef2c40f36d78a7d81ec`

### 2026-04-13 — Planning UX, tests, booking history, documentation-sync

- **Date (UTC or local):** 2026-04-13
- **Operational summary:** Major product and engineering pass: project config and tests; booking history APIs/UI and tests; **documentation-sync** Cursor skill and `documentation.mdc` rule; terminology consistency across UI and docs; **undo/redo** on planning mutations; **current ISO week** highlight and Help/CHEATSHEET updates; **resource row selection** in planning; note handling and styling in allocation cells; removed accent-color special cases from allocation cells; **persistent sticky** planning header; **total allocation summary** band on resource view; TDD doc updated for documentation-sync phase.
- **Technical problem / uncertainty:** Undo model consistency with view mode switches; sticky headers with many columns; test coverage for booking lifecycle and planning interactions.
- **Work performed:**
  - Config + tests — `4df3c53`; booking history — `e78d68d`; **documentation-sync** skill + rule — `d82a05f`, `2dd27e3`; terminology — `2e82de0`; **undo/redo** planning — `1bf4a10`; current-week highlight — `0673f2e`; Help + CHEATSHEET — `692ec9e`; TDD doc + sync — `452e675`; resource row selection — `d80ee16`; note refactor/style — `54b502d`, `43fe730`; allocation cell refactor — `c66afc2`; sticky planning header — `6f798f5`; resource totals band — `4121c1a`
  - Areas: [`src/app/`](../src/app/), [`src/components/`](../src/components/), [`prisma/`](../prisma/), [`.cursor/skills/documentation-sync/`](../.cursor/skills/documentation-sync/), [`.cursor/rules/documentation.mdc`](../.cursor/rules/documentation.mdc), [`docs/`](../docs/), tests
- **Result / status:** Merged.
- **Links / traceability:** `4df3c53eafab86e508fbd665f846e15fe538acf9` … `4121c1a8077b08367b3bfbaf23783b04f93f1a2b`

### 2026-04-10 — Developer setup errors, repo hygiene, TDD documentation

- **Date (UTC or local):** 2026-04-10
- **Operational summary:** User-visible handling for developer DB/setup failures; removed unused dev artifacts and tightened `.gitignore`; added and refined **TDD** workflow documentation in `.cursor/skills/tdd/`.
- **Technical problem / uncertainty:** Actionable errors when Prisma/DB prerequisites fail locally.
- **Work performed:**
  - [`src/lib/developer-db-setup.ts`](../src/lib/developer-db-setup.ts), [`src/app/layout.tsx`](../src/app/layout.tsx) — `cb5899a`
  - `.gitignore` and file removals — `be242a8`, `8313cb2`
  - [`.cursor/skills/tdd/SKILL.md`](../.cursor/skills/tdd/SKILL.md) — `19a3154`, `cee9192`
- **Result / status:** Merged.
- **Links / traceability:** `cb5899a24c599fc20e2ea40068c5abb5ed1a7766` … `cee919270ebc0805a7fad7d4bb9145d1ff61c1f7`

### 2026-03-28 — UI refresh (Stitch), help dialog, dev manifests, v3.2

- **Date (UTC or local):** 2026-03-28
- **Operational summary:** Iterative UI improvements (“Stitch”-driven passes); fixed help dialog rendering; updated `AppHeader`; documentation pass; added admin/resources routes to dev manifests; shipped **v3.2**.
- **Technical problem / uncertainty:** Help overlay rendering edge cases; cohesive dark-first layout across shell and planning.
- **Work performed:**
  - [`src/components/app-shell/`](../src/components/app-shell/), [`docs/`](../docs/) — `892a770`, `587bc44`, `cabce50` … `fe59f5d`
- **Result / status:** Merged; version `fe59f5d1631961aa30a219b713a169bd444e11a9`.
- **Links / traceability:** `c0d5b1f90c9e01e43e4b2e34d4d6b816bbdb583d` … `fe59f5d1631961aa30a219b713a169bd444e11a9`

### 2026-03-27 — Resource capacity, CSV import, planning filters, v2.x

- **Date (UTC or local):** 2026-03-27
- **Operational summary:** **Resource capacity** (front and back); **CSV import wizard** in admin; **v2.0**; filter planning to **active** resources/projects; refine “by project” and resource views; **v2.1**; UX fixes (popups, notes); broad polish commits.
- **Technical problem / uncertainty:** Import validation and mapping; filter correctness vs archived entities; note persistence in cells.
- **Work performed:**
  - [`prisma/schema.prisma`](../prisma/schema.prisma), admin/planning UI — `870596a` … `d2a99ad`
- **Result / status:** Merged through `d2a99adfd0176981b55128d9c92979b18dce6b20`.
- **Links / traceability:** `870596aee17692b924ec284dcccced2e715d04e8` … `d2a99adfd0176981b55128d9c92979b18dce6b20`

### 2026-03-20 — Editable planning grid and full-width shell

- **Date (UTC or local):** 2026-03-20
- **Operational summary:** **Direct in-cell editing** on the planning view; **full-width** menu/content layout; refreshed **+** control for adding resource/project; version bumps.
- **Technical problem / uncertainty:** Inline edit UX without breaking week/project grid navigation.
- **Work performed:**
  - Planning components, [`AppShell.tsx`](../src/components/app-shell/AppShell.tsx) — `7f6dc24` … `9ba0ba2`
- **Result / status:** Merged.
- **Links / traceability:** `7f6dc2450025f5f0c48407d9be8c879e04cea9a3` … `9ba0ba2568fba8a98fc1123dd9a57c74ccc33b66`

### 2026-03-19 — Timeline visualization, Prisma fixes, weekly totals, v1.1

- **Date (UTC or local):** 2026-03-19
- **Operational summary:** Reworked **timeline/planning** visualization by resource and project; **Prisma** fixes; **AppShell** updates; **weekly total allocation per resource**; version **v1.1** and related `next-env` typings churn.
- **Technical problem / uncertainty:** Correct aggregation of allocations across projects per resource-week; schema/query alignment.
- **Work performed:**
  - Planning/timeline UI, Prisma — `d0edcac` … `1dfbdf6`
- **Result / status:** Merged.
- **Links / traceability:** `d0edcacf13bb01b4126f2a279171fd474ccd01a5` … `1dfbdf65952d5abd17e773324714207b679fe193`

### 2026-03-17 — Application scaffolding and baseline UI

- **Date (UTC or local):** 2026-03-17
- **Operational summary:** **Project setup** (Next.js app, tooling, core structure) and a first **UI update** pass establishing the planning/shell baseline.
- **Technical problem / uncertainty:** Baseline architecture for server components, data layer, and weekly planning model.
- **Work performed:**
  - Repository scaffold beyond README — `72f2f390f7028c593a31987dbfdda7fd5da5cc72`, `9c9629dd951df081be2785a3f9b40917f2492d7a`
- **Result / status:** Merged.
- **Links / traceability:** `72f2f390f7028c593a31987dbfdda7fd5da5cc72`, `9c9629dd951df081be2785a3f9b40917f2492d7a`

### 2026-03-10 — Repository bootstrap

- **Date (UTC or local):** 2026-03-10
- **Operational summary:** **Initial commit** creating the repo with a starter [`README.md`](../README.md).
- **Technical problem / uncertainty:** — (seed repository only)
- **Work performed:**
  - [`README.md`](../README.md) — `2a0c982d6cfae8260d9aabd7b1b46f7a2dda19ed`
- **Result / status:** Root commit on `main` ancestry.
- **Links / traceability:** `2a0c982d6cfae8260d9aabd7b1b46f7a2dda19ed`

<!--

AGENT TEMPLATE (documentation-sync) — keep this block at the end of the file. Insert each new entry above this comment (directly under the **Order** paragraph after any newer entries).

### YYYY-MM-DD — short label

- **Date (UTC or local):** …
- **Operational summary:** …
- **Technical problem / uncertainty:** …
- **Work performed:**
  - …
- **Result / status:** …
- **Links / traceability:** … or *(to complete)*

-->
