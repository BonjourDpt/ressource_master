# AI-assisted contributions

This repository follows practices aligned with the Linux kernel’s guidance for AI coding assistants ([`Documentation/process/coding-assistants.rst`](https://github.com/torvalds/linux/blob/master/Documentation/process/coding-assistants.rst)), adapted for **RESOURCE PLANNER** (not GPL-specific; this repo does not yet declare a `LICENSE` file—compliance with any future license remains your responsibility).

## Why

- **Traceability** — Funding and audit contexts (see [`DEV_LOG.md`](DEV_LOG.md)) benefit from clear records of what changed and how work was produced.
- **Honest attribution** — Separates human accountability from tool assistance.

## Human responsibilities

- **Review** all changes before they land; you own the result.
- **Security and licensing** — Ensure the change is appropriate for your context; do not rely on an AI to certify legal or license matters.
- Follow [`DEVELOPER_GUARDRAILS.md`](DEVELOPER_GUARDRAILS.md) and [`SETUP.md`](SETUP.md) for checks and local setup.

## What AI agents must not do

- **Do not add `Signed-off-by`** or otherwise certify the [Developer Certificate of Origin](https://developercertificate.org/) on behalf of a human. Only a person may do that, and only if the project adopts DCO (this repo does **not** require DCO today).

## Assisted-by trailer (commits)

When a commit materially used an AI assistant or other non-basic assistance, add a trailer in the kernel style:

```text
Assisted-by: AGENT_NAME:MODEL_VERSION [TOOL1] [TOOL2]
```

- **`AGENT_NAME` / `MODEL_VERSION`** — Use names that match what you actually used (e.g. `Cursor:Composer-2`).
- **`[TOOL1] [TOOL2]`** — Optional; list specialized analysis tools if relevant. Ordinary tools (git, editor, compiler) need not be listed.

If **no AI or special tools** were used for that commit, still include an explicit trailer so automation can pass:

```text
Assisted-by: human-only
```

You may use `Assisted-by: none` with the same meaning if you prefer.

## Enforcement in this repo

**What is `HEAD`?** In Git, **`HEAD`** is the commit you (or CI) are “on” right now: usually the **latest commit on the current branch**. On GitHub Actions for a push to `main`, **`HEAD`** is the **commit that triggered that run** (the tip of `main` after the push). The strict check uses **`git log -1`** — i.e. that commit’s message only.

### Auto-append (`prepare-commit-msg`)

Husky runs **[`.husky/prepare-commit-msg`](../.husky/prepare-commit-msg)** before your editor opens (and for `git commit -m` / `-F`). If the message file does **not** already contain a non-empty `Assisted-by:` line, the hook **appends**:

```text
Assisted-by: human-only
```

**AI-assisted commit (override the default):** set **`ASSISTED_BY`** for that command only (value is whatever goes after `Assisted-by: `):

- **bash / sh:** `ASSISTED_BY='Cursor:Composer-2' git commit`
- **PowerShell:** `$env:ASSISTED_BY='Cursor:Composer-2'; git commit`

If **`ASSISTED_BY`** is empty, the hook still uses `human-only`. Do not put newlines in **`ASSISTED_BY`**.

The hook **does not** append when:

- Git passes source **`merge`** (merge commits), or
- The first line of the message starts with **`Merge `** or **`Revert `**, or
- Any line already matches **`Assisted-by:`** with non-empty content (case-insensitive).

You can edit or delete the appended line in the commit editor; **`commit-msg`** may still warn, and **CI** will fail on `main` if the final message is invalid.

### Other local and CI checks

- **`commit-msg`:** Husky runs [`scripts/check-assisted-by.mjs`](../scripts/check-assisted-by.mjs) in **warn-only** mode after you finish editing (reminder if `Assisted-by` is missing).
- **CI (push to `main`):** The same script runs in **`--strict`** mode and **fails the build** if the checked-in commit message is missing a valid `Assisted-by:` line.
- **Bypass (emergencies only):** `git commit --no-verify` skips hooks; fix the message before pushing to `main` or CI will fail.

### Commits that skip the check

The script **does not** require `Assisted-by` when the first line of the message starts with `Merge ` or `Revert ` (typical merge and revert commits).

### Squash merges

If you squash on `main`, ensure the **squashed** commit message body still contains a valid `Assisted-by:` line, or CI will fail.

## Ongoing documentation

Policy changes to this file, Husky, CI, or [`.cursor/rules/ai-assisted-contributions.mdc`](../.cursor/rules/ai-assisted-contributions.mdc) should go through the **documentation-sync** workflow ([`.cursor/skills/documentation-sync/SKILL.md`](../.cursor/skills/documentation-sync/SKILL.md)) so guardrails and docs stay aligned.
