---
name: Slack success notify job
overview: Add a `notify-success` job to [.github/workflows/ci-deploy.yml](.github/workflows/ci-deploy.yml) that runs after green `build` and `deploy`, posts a blocks-formatted Slack Incoming Webhook payload built with `jq -n` when `SLACK_WEBHOOK_URL` is set, and validate the workflow with actionlint.
todos:
  - id: add-notify-success-job
    content: Add `notify-success` job (needs, if, env, bash+jq+curl) after `deploy`, before `notify-failure` in ci-deploy.yml
    status: completed
  - id: validate-actionlint
    content: Run actionlint on `.github/workflows/ci-deploy.yml` and fix any reported issues
    status: completed
  - id: docs-sync
    content: "Per documentation-sync skill: update README/SETUP/GUARDRAILS if they describe Slack notifications only for failures"
    status: completed
isProject: false
---

# Slack success notification job for CI-deploy

## Context

The workflow already defines [`build`](.github/workflows/ci-deploy.yml), [`deploy`](.github/workflows/ci-deploy.yml) (`needs: build`), and [`notify-failure`](.github/workflows/ci-deploy.yml) (`needs: [build, deploy]`, `if: ${{ failure() }}`, optional `SLACK_WEBHOOK_URL`, `jq`-built blocks, `curl` POST). The new job should follow the same shell style (`set -euo pipefail`, empty-secret early exit with a clear `echo`, no `GITHUB_TOKEN` or Jobs API—success does not need enrichment).

## Implementation

1. **Insert job `notify-success`** (recommended placement: immediately after the `deploy` job, before `notify-failure`, so success/failure notifications are grouped and easy to compare).

2. **Job configuration**
   - `needs: [build, deploy]` — satisfies dependency on both jobs.
   - `if: ${{ success() }}` — runs only when the needed jobs completed successfully; aligns with requirement “only when the workflow succeeds” and mirrors the explicit `failure()` on `notify-failure`.
   - `runs-on: ubuntu-latest` — same as other jobs; `jq` is available on the runner.

3. **Single step** (e.g. `Notify Slack on success`)
   - **Env** (all via `github` context, no secrets except webhook): `SLACK_WEBHOOK_URL` from `secrets.SLACK_WEBHOOK_URL`, plus `WORKFLOW_NAME` (`github.workflow`), `REPO` (`github.repository`), `BRANCH` (`github.ref_name`), `FULL_SHA` (`github.sha`), `RUN_URL` (`github.server_url`/`github.repository`/`github.run_id`—same pattern as [`notify-failure`](.github/workflows/ci-deploy.yml) line 121).
   - **Bash**: If `SLACK_WEBHOOK_URL` is unset/empty, log something explicit (e.g. `SLACK_WEBHOOK_URL not set, skipping Slack success notification`) and `exit 0`.
   - Otherwise build **`payload`** with `jq -n` and `--arg` for every string, outputting Slack **blocks**:
     - `header`: plain_text e.g. “Workflow succeeded” (or similar positive wording).
     - `section` with `fields`: Workflow, Repository, Branch, Commit (full SHA)—same mrkdwn field style as the failure job.
     - `section` with link: `RUN_URL` as “View GitHub Actions workflow run” (or equivalent).
   - `curl -fsS -X POST -H 'Content-Type: application/json' -d "$payload" "$SLACK_WEBHOOK_URL"`.

4. **Do not modify** any steps or `if`/`needs` on `build`, `deploy`, or `notify-failure`.

## YAML validation (requirement 10)

After editing, validate with **[actionlint](https://github.com/rhysd/actionlint)** (validates workflow YAML + GitHub Actions semantics):

- **Docker** (works on Windows if Docker Desktop is available):

  `docker run --rm -v "${PWD}:/repo" -w /repo rhysd/actionlint:latest -color .github/workflows/ci-deploy.yml`

- **Alternative**: download the release binary for your OS from the actionlint repo and run `actionlint .github/workflows/ci-deploy.yml` from the repo root.

Plain YAML parsers (e.g. PyYAML) are **not** sufficient for GHA-specific checks; prefer actionlint.

## Documentation note (repo policy)

Changing [.github/workflows/ci-deploy.yml](.github/workflows/ci-deploy.yml) matches the workspace documentation rule for `.github/**`. When implementing (after plan approval), follow [.cursor/skills/documentation-sync/SKILL.md](.cursor/skills/documentation-sync/SKILL.md): update maintainer-facing mentions (e.g. [README.md](README.md), [docs/SETUP.md](docs/SETUP.md), [docs/DEVELOPER_GUARDRAILS.md](docs/DEVELOPER_GUARDRAILS.md)) so they describe optional **success** Slack notification alongside existing **failure** notification, without changing the substance of build/deploy/failure behavior.
