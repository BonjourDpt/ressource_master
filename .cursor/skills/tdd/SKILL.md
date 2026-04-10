---
name: tdd
description: Enforce Test Driven Development workflow for all feature development. Write failing tests first, validate they fail, get user review, implement the feature, validate tests pass, then deliver a detailed summary. Use when the user asks to develop a feature, implement functionality, add a new capability, or mentions TDD.
---

# Test Driven Development Workflow

## Overview

Every feature must follow the Red-Green-Refactor cycle:

1. **Understand** the feature (ask questions)
2. **Red** — write tests that define the expected behavior, run them, confirm they fail
3. **Review** — present failing tests to the user for approval
4. **Green** — implement the minimal code to make tests pass
5. **Refactor & Validate** — clean up, run tests, confirm they all pass
6. **Summary** — deliver a detailed implementation report

---

## Phase 0: Discovery

Before writing any code, **understand the feature thoroughly**.

- Ask clarifying questions about the feature: scope, edge cases, expected inputs/outputs, error scenarios, integration points. use the AskQuestion tool.
- Keep asking until confident you can write comprehensive tests. Don't rush — unclear requirements lead to bad tests.
- Summarize your understanding back to the user and get confirmation before proceeding.

Then ask the user with the AskQuestion tool :

```
Which model should I use for:
1. Writing the tests?
2. Writing the implementation?
(They can be different — e.g. a faster model for straightforward implementation, a more capable one for complex test design.)
```

Wait for the user's answer before proceeding.

---

## Phase 1: Test Infrastructure Check

Before writing tests, verify the project has a working test runner.

1. Check for test config files (`vitest.config.*`, `jest.config.*`, `playwright.config.*`)
2. Check `package.json` for test scripts and test framework dependencies

If **no test framework is set up**:
- Recommend **Vitest** for a Next.js/TypeScript project (fast, native ESM/TS, compatible with Jest API)
- Ask the user to confirm the choice
- Install and configure it:
  - Add `vitest` and `@testing-library/react` (if UI tests needed) as dev dependencies
  - Create a minimal `vitest.config.ts`
  - Add a `test` script to `package.json`
- Verify with a trivial sanity test before proceeding

If a framework **already exists**, use it. Respect existing conventions (file naming, directory structure, utilities).

---

## Phase 2: Red — Write Failing Tests

**Delegate test writing to a subagent** using the Task tool with the model chosen by the user.

Provide the subagent with:
- The feature requirements (from Phase 0)
- The testing framework and conventions to follow
- Instructions to write tests that:
  - Cover the happy path
  - Cover edge cases and error scenarios
  - Cover boundary conditions
  - Are well-named and descriptive (test name = specification)
  - Group related tests with `describe` blocks
  - Use clear Arrange / Act / Assert structure
  - Do NOT implement any production code — only tests

After the subagent returns, **run the tests** and confirm they all **fail** (red).

If any test passes unexpectedly, investigate — it means the behavior already exists or the test is wrong.

---

## Phase 3: Review — Present Tests to User

Present the failing tests to the user for review using **both** formats:

### Checklist

```
Test Results:
- [ ] ❌ test name — expected behavior description
- [ ] ❌ test name — expected behavior description
...
```

### Test Output

Show the full test runner output so the user sees the actual failure messages.

### Ask for approval

```
Please review the tests above. They define the specification for the feature.
- Are any cases missing?
- Should any test be modified or removed?
- Ready to proceed with implementation?
```

**Wait for explicit approval** before proceeding to implementation. Incorporate any feedback by updating tests and re-running them.

---

## Phase 4: Green — Implement the Feature

**Delegate implementation to a subagent** using the Task tool with the model chosen by the user.

Provide the subagent with:
- The feature requirements
- The exact test file(s) to satisfy (include content or paths)
- Instructions to:
  - Write the **minimal** production code to make all tests pass
  - Follow existing project conventions (code style, file structure, naming)
  - Not modify the test files
  - Run the tests after implementation and report results

After the subagent returns, **run the tests** to verify they all pass (green).

If any test fails:
- Analyze the failure
- Fix the implementation (not the tests, unless a test is genuinely wrong)
- Re-run until all tests pass

---

## Phase 5: Refactor

With all tests green:
- Review the implementation for code quality
- Refactor if needed (extract helpers, improve naming, remove duplication)
- Run tests after each refactor step to ensure nothing breaks

---

## Phase 6: Final Review & Summary

### Test Review

Run the full test suite one last time and present results.

### Implementation Summary

Deliver a **detailed** summary covering:

| Section | Content |
|---------|---------|
| **Feature overview** | What was built and why |
| **Architecture rationale** | Key design decisions and why they were made |
| **Trade-offs** | What was considered but not chosen, and why |
| **Files changed** | List of all new/modified files with brief purpose |
| **Test coverage** | Number of tests, what they cover, any known gaps |
| **Test results** | Final pass/fail output |
| **Follow-up items** | Anything that should be addressed later (tech debt, missing edge cases, integration tests) |
