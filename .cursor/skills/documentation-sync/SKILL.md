---
name: documentation-sync
description: Runs a mandatory documentation impact check for every product change, updates repo docs and in-app user docs to match behavior, proposes a semver bump from Conventional Commits–style impact (with explicit user confirmation), removes obsolete copy, and reports gaps. Use when implementing or changing features, UI, APIs, schema, env, scripts, settings, navigation, labels, help text, or removing functionality — and before marking any such task complete.
---

# Documentation sync (RESOURCE PLANNER)

Treat documentation as **part of the same deliverable** as code. Do not mark a task complete until this flow is executed and any required doc updates are applied (or explicitly deferred with a tracked TODO list).

## Trigger conditions

Run **automatically** when the task touches any of:

- Routes, pages, layouts, or app shell (`src/app/`, `src/components/app-shell/`)
- Features, workflows, validation, or copy users see (forms, modals, toasts, empty states, filters, tables, buttons, nav labels)
- APIs, server actions, `src/lib/`, Prisma schema/migrations/seed
- Env vars, scripts, Docker, CI, or local setup behavior
- Architecture, data model, security, or operational assumptions

**Always run** a documentation impact check **before** declaring the task finished.

## Project map (where docs live)

**Repository (developer / project):**

- `README.md` — overview, features, screens, quick start pointers
- `CHEATSHEET.md` — end-user reference (should stay aligned with in-app help)
- `docs/SETUP.md` — install, env, DB, migrations, troubleshooting
- `docs/ui-system.md` — layout, tokens, component conventions
- `docs/PRODUCT_ASSUMPTIONS.md` — domain model, lifecycle, assumptions
- `docs/FUTURE_IMPROVEMENTS.md` — backlog (only if a planned item is implemented or invalidated)
- `prisma/schema.prisma`, `package.json` scripts — often need SETUP or README cross-checks

**In-app (end-user):**

- `src/components/app-shell/HelpDialog.tsx` — primary help / cheatsheet UI (`?` in header)
- `package.json` — `"version"` (semver `MAJOR.MINOR.PATCH`); keep aligned with the in-app label when you bump
- `src/lib/app-version.ts` — `APP_VERSION_LABEL` shown in the Help dialog title; **must** be updated as part of every documentation-sync pass (after user confirms the bump; see **Webapp version** below)
- Other UX copy: scan changed files for user-visible strings (toasts, placeholders, `aria-label`, confirmation dialogs)

If the codebase gains new doc surfaces (CMS, MDX routes, seeded DB articles), extend this map in your assessment.

## Webapp version (mandatory)

After every product-impacting task, **estimate the semver impact** of the change set, map it using [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) rules, and **only then** bump the webapp version — **never** change `package.json` or `src/lib/app-version.ts` until the user has **explicitly confirmed** the proposed bump.

### How to estimate impact (Conventional Commits → SemVer)

Treat the work as if it were summarized by commit message(s):

| If the change is equivalent to… | SemVer bump |
| --- | --- |
| **`BREAKING CHANGE`** (footer or `!` after type/scope before `:`) or a removed/renamed **public** API, contract, env, or user workflow that existing users must adapt to | **MAJOR** |
| A **`feat`** — new user-visible capability, new route/screen, new field or behavior that extends the product without breaking existing usage | **MINOR** |
| A **`fix`**, **`perf`**, or non-breaking **`refactor`** that corrects behavior without new capabilities | **PATCH** |
| **`docs`**, **`style`**, **`test`**, **`chore`**, **`ci`**, **`build`** with **no** user-visible, API, schema, or setup behavior change | **PATCH** (often `0.0.x` churn); if **literally** no shipped behavior or docs that matter to users changed, you may propose **no version change** and ask the user to confirm *no bump* |

If multiple units apply, use the **highest** bump (e.g. one `feat` + one breaking change → **MAJOR**).

### What to read and set

1. Read current `package.json` `"version"` and `APP_VERSION_LABEL` in `src/lib/app-version.ts`.
2. Propose the next semver (e.g. `3.2.1` → `3.3.0` for MINOR) and a matching label (prefer `vMAJOR.MINOR.PATCH` for `APP_VERSION_LABEL`, or match the project’s existing label style if it deliberately differs — but **do not** leave `package.json` and `APP_VERSION_LABEL` contradicting each other after the bump without calling it out).

### Explicit user confirmation (required)

1. **Present** a short table or bullets: conventional-commit-style classification (e.g. “equivalent to `feat:` …”, “no `BREAKING CHANGE`”), proposed bump (**PATCH** / **MINOR** / **MAJOR** or no bump), current vs proposed version, and 1–2 lines of reasoning tied to actual files/behavior changed.
2. **Ask** a direct yes/no (or “confirm PATCH / MINOR / MAJOR / none”) question; **stop** the version + doc-closeout until the user answers.
3. **After confirmation only** — apply `package.json` and `src/lib/app-version.ts` (and any other single source of truth if the repo adds one).

If the user adjusts the bump level, follow their choice and still keep both version surfaces consistent.

## Step-by-step behavior

1. **Analyze the change** — What behavior changed for developers, admins, or end users?
2. **Decide impact** — Does anything documented (repo or in-app) now lie, omit a new capability, or describe removed UI?
3. **Classify targets:**
   - **Technical** — setup, architecture, API/schema, env, scripts, assumptions
   - **User-facing** — Help dialog, CHEATSHEET, README feature bullets if user-visible
4. **Locate exact sources** — List concrete files/modules (paths above + any touched feature folders).
5. **Diff docs vs behavior** — Names, routes, shortcuts, limits, defaults, and error messages must match the implementation.
6. **Edit** — Update, add, or remove sections; keep technical docs implementation-aware and user docs task-oriented. No vague placeholders unless the user explicitly asked for them.
7. **Obsolete content** — Remove or rewrite anything that references deleted or renamed behavior.
8. **Visual / screenshot docs** — If the repo references screenshots or GIFs, flag them as potentially stale (do not invent new assets unless requested).
9. **Gaps** — If structure or product intent is unclear, do not guess; output a TODO list with exact file locations and suggested wording.
10. **Webapp version** — Run **Webapp version (mandatory)** above: estimate PATCH / MINOR / MAJOR from Conventional Commits rules, propose numbers, **request explicit user confirmation**, then update `package.json` and `src/lib/app-version.ts` only after they confirm (or confirm no bump).
11. **Closing report** — Use the output template below in the task summary.

## Documentation checklist

Copy and use mentally or literally:

- [ ] **README** — Feature list, screens table, stack, links still true?
- [ ] **CHEATSHEET.md** — Matches Help dialog and actual UI labels/workflows?
- [ ] **docs/SETUP.md** — Env vars, commands, migrations, troubleshooting still valid?
- [ ] **docs/ui-system.md** — New/changed layout or component patterns documented if they establish precedent?
- [ ] **docs/PRODUCT_ASSUMPTIONS.md** — Domain or security assumptions changed?
- [ ] **HelpDialog.tsx** — Tabs/sections reflect current product behavior and shortcuts?
- [ ] **CHANGELOG / release notes** — Update if the repo maintains them
- [ ] **Version** — Impact classified (Conventional Commits → SemVer), user explicitly confirmed bump (or no bump), `package.json` + `src/lib/app-version.ts` updated accordingly
- [ ] **Removed features** — Purged from README, CHEATSHEET, Help, and any assumptions docs
- [ ] **Naming** — Nav items, filters, field names consistent across UI, help, and repo docs

## Expected output template

Return this for the task (fill every section):

### 1. Documentation impact assessment

- **Impacted:** Yes / No
- **Why:** (1–3 sentences tied to the code change)

### 2. Impacted documentation locations

- (exact paths: markdown, components, prisma, seeds, JSON, etc.)

### 3. Proposed updates

- **`<path>`** — Short summary of what to say or fix

### 4. Actions performed

- **`<path>`** — updated | created | removed — (one line each)

### 5. Version (webapp)

- **Conventional-commit-style summary:** (e.g. “treat as `feat:` …”, “includes breaking API …”)
- **Proposed SemVer bump:** PATCH | MINOR | MAJOR | none
- **User confirmed:** Yes / Pending — (if Yes: old → new versions for `package.json` and `APP_VERSION_LABEL`)

### 6. Remaining gaps

- Human review, screenshots, product decisions, or open questions — or **None**

### 7. Intentionally unchanged

- **`<path>`** — Why still accurate or out of scope

## Failure / ambiguity behavior

- **Never** assume docs are correct after a product change.
- **Never** document removed features as if they still exist.
- If unsure **what** the product should say, stop short of inventing policy: add a **TODO** with file path + recommended question for the user.
- If unsure **where** content should live, prefer updating the canonical surfaces (`HelpDialog.tsx` + `CHEATSHEET.md` for user help; `docs/SETUP.md` for ops).
- If **no** documentation update is needed, explain why (e.g. internal refactor with identical UX and API).
- **Never** bump `package.json` or `src/lib/app-version.ts` without the user’s **explicit** confirmation of the proposed bump (or no bump); if they have not answered yet, leave versions unchanged and report **User confirmed: Pending** with the exact question asked.

## Quick reuse blurb (paste into prompts)

> After implementation, run **documentation-sync**: assess repo + in-app docs, update `README.md`, `docs/*`, `CHEATSHEET.md`, and `src/components/app-shell/HelpDialog.tsx` as needed, remove obsolete instructions, align names with the UI, propose a version bump using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) rules and **wait for explicit confirmation** before changing `package.json` / `src/lib/app-version.ts`, then finish with the skill’s output template (including intentional no-ops).
