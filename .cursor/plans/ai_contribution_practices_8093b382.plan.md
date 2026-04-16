---
name: AI contribution practices
overview: Document Linux-kernel–inspired AI assistance rules (human-only certification, Assisted-by attribution, process alignment) in this repo’s docs and Cursor guidance, adapted from [coding-assistants.rst](https://github.com/torvalds/linux/blob/master/Documentation/process/coding-assistants.rst)—add optional local/CI enforcement for Assisted-by, and fold ongoing maintenance into the documentation-sync skill (map, triggers, checklist, Dev LOG).
todos:
  - id: add-ai-doc
    content: "Add docs/AI_ASSISTED_CONTRIBUTIONS.md (kernel-linked, repo-specific: no AI Signed-off-by, Assisted-by format, human duties, optional DCO note)."
    status: completed
  - id: cross-link
    content: Link from docs/DEVELOPER_GUARDRAILS.md and README.md to the new doc.
    status: completed
  - id: cursor-rule
    content: Add .cursor/rules/ai-assisted-contributions.mdc for agent behavior (no Signed-off-by; suggest Assisted-by in commit messages).
    status: completed
  - id: assisted-by-enforcement
    content: "Add Assisted-by enforcement: e.g. commit-msg hook (warn or block) and/or CI step; document behavior, edge cases (merge/revert), and escape hatches in AI_ASSISTED_CONTRIBUTIONS + DEVELOPER_GUARDRAILS."
    status: completed
  - id: documentation-sync-ownership
    content: "Extend documentation-sync SKILL.md: project map entry, trigger when hooks/CI for AI policy change, checklist items for AI contribution docs + guardrails, Dev LOG on rollout."
    status: completed
isProject: false
---

# Adopt kernel-style AI contribution practices (adapted)

## Source of truth

The kernel document ([`Documentation/process/coding-assistants.rst`](https://github.com/torvalds/linux/blob/master/Documentation/process/coding-assistants.rst)) boils down to:

1. **Follow the project’s normal contribution process** (for the kernel: their dev process / style / patch submission; here: local checks, CI, docs).
2. **Licensing / legal compliance** remains the **human submitter’s** responsibility (kernel: GPL-2.0 and SPDX; this repo currently has **no `LICENSE` file**—the new doc should say “comply with whatever license the repo uses once declared,” not GPL-2.0-by-default).
3. **Signed-off-by / DCO:** **AI agents must not add `Signed-off-by`.** Only a human may certify the Developer Certificate of Origin. The human reviews AI output, ensures license fit, and adds their own sign-off **if** the project uses DCO.
4. **Attribution:** Encourage an **`Assisted-by:`** trailer in commit messages when AI tools materially helped, using the kernel format: `Assisted-by: AGENT_NAME:MODEL_VERSION [TOOL1] [TOOL2]` (optional non-basic tools only—*not* git/gcc/editors per the kernel text).

## What to add in this repository

### 1. New contributor-facing doc

Add **[`docs/AI_ASSISTED_CONTRIBUTIONS.md`](docs/AI_ASSISTED_CONTRIBUTIONS.md)** (name can be adjusted) containing:

- Short **“why”** (traceability, subsidy/R&D logs alignment with [`docs/DEV_LOG.md`](docs/DEV_LOG.md), honest attribution).
- **Human responsibilities:** review, security/licensing, run/adhere to [`docs/DEVELOPER_GUARDRAILS.md`](docs/DEVELOPER_GUARDRAILS.md) and [`docs/SETUP.md`](docs/SETUP.md).
- **Agent constraints:** never add `Signed-off-by`; do not impersonate human certification.
- **Assisted-by:** definition, examples (e.g. `Assisted-by: Cursor:Composer …` with plausible agent/model labels—wording should allow humans to substitute the actual tool/model string), and note that it is **recommended** when AI was used for a non-trivial part of the change.
- **Optional DCO:** if the project later adopts DCO, point to a future `CONTRIBUTING.md`; until then, state clearly that **no DCO is required today** unless you decide otherwise.

Keep it short; link out to the kernel doc for the original rationale.

### 2. Wire it into existing “where contributors look”

- **[`docs/DEVELOPER_GUARDRAILS.md`](docs/DEVELOPER_GUARDRAILS.md)** — In **Contributor workflows (Cursor)**, add a row for the new doc (same table style as documentation-sync / TDD).
- **[`README.md`](README.md)** — One sentence + link under a sensible heading (e.g. contributing / development), so non-Cursor readers see it.

### 3. Cursor-facing rule (optional but high leverage)

Add a small **[`.cursor/rules/ai-assisted-contributions.mdc`](.cursor/rules/ai-assisted-contributions.mdc)** (or extend an existing rule) with `alwaysApply: true` **or** scoped globs if you prefer less noise:

- Instruct agents: **never** add `Signed-off-by` or DCO certification text.
- Instruct agents: when suggesting a commit message, **include** `Assisted-by:` when the change was AI-assisted (matching the format above).

This mirrors the kernel guidance where the **human** still commits and can edit the message.

### 4. Enforce `Assisted-by` (hooks and/or CI)

Bring **optional but real** enforcement in line with the kernel idea that attribution should be **trackable**, while accepting trade-offs (noise, merge commits, squash workflows).

**Preferred layering:**

1. **Local `commit-msg` hook (Husky)** — Inspect the commit message body for a line matching `^Assisted-by:` (case-sensitive or kernel-style as documented). Choose policy explicitly in docs:
   - **Warn-only** (print to stderr, exit 0): lowest friction; good for adoption.
   - **Block** (exit 1): stricter; document how to bypass when appropriate (`git commit --no-verify` for emergencies only, or a documented env var if you add one—keep it rare).
2. **CI guard (optional)** — On `pull_request` or `push` to `main`, run a small script that checks **only the commits in the range** (or the merge commit message for squash merges—define behavior). Reuse the same regex/rules as the hook. Note: this repo currently has **[`.github/workflows/ci-deploy.yml`](.github/workflows/ci-deploy.yml)** on `main` only; adding PR checks is a separate workflow or trigger—call that out in the plan implementation.

**Document edge cases** in [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](docs/AI_ASSISTED_CONTRIBUTIONS.md) and [`docs/DEVELOPER_GUARDRAILS.md`](docs/DEVELOPER_GUARDRAILS.md):

- When **AI was not used**, either require a trailer such as `Assisted-by: none` / `Assisted-by: human-only` **or** scope the hook to commits where a bot/agent label is present—**pick one rule** and encode it in the checker to avoid false failures.
- **Merge commits**, **reverts**, **cherry-picks**, and **release automation** may need skip patterns (e.g. `Merge ` prefix, `Revert `) or allowlist.
- **Squash merges**: final message on `main` must contain `Assisted-by` if policy says so; document for maintainers.

Keep the checker script minimal (e.g. `scripts/check-assisted-by.mjs` or `bash`) and referenced from both Husky and CI.

### 5. Owned by **documentation-sync** (not a one-off)

Yes — **policy, discoverability, and guardrail docs** for AI-assisted contributions should be **maintained through the same skill** as other repo docs:

- **[`.cursor/skills/documentation-sync/SKILL.md`](.cursor/skills/documentation-sync/SKILL.md)** — Treat as canonical owner:
  - **Project map:** add [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](docs/AI_ASSISTED_CONTRIBUTIONS.md) next to other `docs/*` entries.
  - **Trigger conditions:** extend with bullets such as: changes to **`.cursor/rules/*` for AI policy**, **Husky hooks** that enforce commit messages, **CI** steps that enforce `Assisted-by`, or **substantive edits** to the AI contribution doc itself—run documentation-sync so the map, checklist, DEVELOPER_GUARDRAILS table, and scripts stay aligned.
  - **Documentation checklist:** add items, e.g. “`docs/AI_ASSISTED_CONTRIBUTIONS.md` matches hook/CI behavior and escape hatches”, “`docs/DEVELOPER_GUARDRAILS.md` lists the new hook/CI row”.
  - **Dev LOG:** append a **newest-first** entry when this rollout ships (RSEDE traceability for process/guardrail work), unless the user explicitly scopes as non-R&D—same rules as the rest of the skill.
  - **Closing report:** agents completing this work should use the skill’s template (including §8 Dev LOG).

Product-only tasks still run documentation-sync as today; AI-policy changes are **additional** triggers so the skill stays the single place that defines “what to update before done.”

## Out of scope (unless you ask)

- **Adopting DCO** repo-wide (legal/process decision).
- Adding **`LICENSE`** (separate decision; the new doc should not claim a license the repo doesn’t state).

## Verification (after implementation)

- Links from README and DEVELOPER_GUARDRAILS resolve.
- Wording clearly distinguishes **kernel** requirements from **this repo’s** adapted policy.
- Hook and/or CI behavior matches what [`docs/AI_ASSISTED_CONTRIBUTIONS.md`](docs/AI_ASSISTED_CONTRIBUTIONS.md) promises (including human-only commits, merge/skip rules, and bypass policy).
- **[`.cursor/skills/documentation-sync/SKILL.md`](.cursor/skills/documentation-sync/SKILL.md)** lists the new doc, AI-policy triggers, and checklist lines; closing reports for this work include Dev LOG §8 per the skill.
- No contradiction with existing subsidy log workflow in [`docs/DEV_LOG.md`](docs/DEV_LOG.md) (AI policy is about **git attribution**; Dev LOG remains the project journal).
