---
name: documentation-sync
description: Runs a mandatory documentation impact check for every product change, updates repo docs and in-app user docs to match behavior, removes obsolete copy, and reports gaps. Use when implementing or changing features, UI, APIs, schema, env, scripts, settings, navigation, labels, help text, or removing functionality — and before marking any such task complete.
---

# Documentation sync (Resource Master)

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
- `src/lib/app-version.ts` — version string in help title; bump when appropriate to release messaging
- Other UX copy: scan changed files for user-visible strings (toasts, placeholders, `aria-label`, confirmation dialogs)

If the codebase gains new doc surfaces (CMS, MDX routes, seeded DB articles), extend this map in your assessment.

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
10. **Closing report** — Use the output template below in the task summary.

## Documentation checklist

Copy and use mentally or literally:

- [ ] **README** — Feature list, screens table, stack, links still true?
- [ ] **CHEATSHEET.md** — Matches Help dialog and actual UI labels/workflows?
- [ ] **docs/SETUP.md** — Env vars, commands, migrations, troubleshooting still valid?
- [ ] **docs/ui-system.md** — New/changed layout or component patterns documented if they establish precedent?
- [ ] **docs/PRODUCT_ASSUMPTIONS.md** — Domain or security assumptions changed?
- [ ] **HelpDialog.tsx** — Tabs/sections reflect current product behavior and shortcuts?
- [ ] **CHANGELOG / release notes** — Update if the repo maintains them
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

### 5. Remaining gaps

- Human review, screenshots, product decisions, or open questions — or **None**

### 6. Intentionally unchanged

- **`<path>`** — Why still accurate or out of scope

## Failure / ambiguity behavior

- **Never** assume docs are correct after a product change.
- **Never** document removed features as if they still exist.
- If unsure **what** the product should say, stop short of inventing policy: add a **TODO** with file path + recommended question for the user.
- If unsure **where** content should live, prefer updating the canonical surfaces (`HelpDialog.tsx` + `CHEATSHEET.md` for user help; `docs/SETUP.md` for ops).
- If **no** documentation update is needed, explain why (e.g. internal refactor with identical UX and API).

## Quick reuse blurb (paste into prompts)

> After implementation, run **documentation-sync**: assess repo + in-app docs, update `README.md`, `docs/*`, `CHEATSHEET.md`, and `src/components/app-shell/HelpDialog.tsx` as needed, remove obsolete instructions, align names with the UI, and finish with the skill’s output template (including intentional no-ops).
