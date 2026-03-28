---
name: UI polish pass
overview: Refine empty states, inline validation, and row action hover behavior across the app by upgrading shared components and applying consistent patterns to Projects, Resources, and Planning.
todos:
  - id: p1-empty-state
    content: "Upgrade EmptyState: compact prop, search icon"
    status: completed
  - id: p1-projects-empty
    content: Replace bare no-match text in ProjectList with compact EmptyState
    status: completed
  - id: p1-resources-empty
    content: Replace bare no-match text in ResourceList with compact EmptyState + clear filters action
    status: completed
  - id: p1-planning-empty
    content: Add filtered-empty message in PlanningTable when groups is empty but data exists
    status: completed
  - id: p2-form-alert
    content: Create shared FormAlert component
    status: completed
  - id: p2-formgroup-spacing
    content: Fix FormGroup error spacing to match Input
    status: completed
  - id: p2-allocation-feedback
    content: Add inline feedback for invalid/clamped values in EditableAllocationCell
    status: completed
  - id: p2-forms-migrate
    content: Migrate ProjectForm and ResourceForm to use FormAlert
    status: completed
  - id: p3-row-hover
    content: Add group class to DataTableRow, create ghost-muted and danger-ghost Button variants
    status: completed
  - id: p3-migrate-lists
    content: Migrate ProjectList and ResourceList row actions to new variants with gap
    status: completed
  - id: p4-build
    content: Verify build passes, lint clean, no regressions
    status: completed
isProject: false
---

# UI Polish Pass: Empty States, Validation, Row Actions

## Phase 1 -- Empty States

### Shared component changes

**Upgrade `EmptyState` in [src/components/ui/EmptyState.tsx](src/components/ui/EmptyState.tsx)**

- Add a `"search"` icon (magnifying glass) to the `icons` map for filter/search misses.
- Add an optional `compact` prop: when true, reduces `py-16` to `py-10`, shrinks the icon from 48px to 32px, and drops `mb-4` to `mb-3`. This variant is for "filtered empty" inside an existing page layout (less dramatic than "true empty").

**New: `FilteredEmptyState` pattern** (not a separate component -- just a usage convention)

- Use `<EmptyState compact icon="search" title="No results" description="..." />` for all filtered/search-miss empty states.
- When filters caused it, add an action button: "Clear filters" or "Reset search".

### Specific pages

**[src/components/projects/ProjectList.tsx](src/components/projects/ProjectList.tsx)**

- Replace the bare `<p>No matching projects found.</p>` with `<EmptyState compact icon="search" title="No matching projects" description="Try a different search term or status filter." />`.

**[src/components/resources/ResourceList.tsx](src/components/resources/ResourceList.tsx)**

- Same treatment: replace the bare `<p>` with compact search empty state.
- Add a "Clear filters" action when `teamFilter !== "ALL"` or `search` is non-empty.

**[src/components/planning/PlanningTable.tsx](src/components/planning/PlanningTable.tsx)**

- When `groups.length === 0 && !groupListEmpty`, render a compact empty state inside the table wrapper: "No planning rows match the current filters."

---

## Phase 2 -- Inline Validation

### Shared component changes

**New: `FormAlert` in `src/components/ui/FormAlert.tsx`**

- Extracts the duplicated `_form` error banner from ProjectForm and ResourceForm into a shared component.
- Props: `message: string | undefined`.
- Renders: `rounded-lg border border-[var(--rm-danger)]/25 bg-[var(--rm-danger)]/10 px-3 py-2.5 text-sm text-[var(--rm-danger)]` with `role="alert"` and a small warning icon.
- Returns null when `message` is undefined.

**Fix `FormGroup` error spacing in [src/components/ui/FormGroup.tsx](src/components/ui/FormGroup.tsx)**

- Add `mt-1.5` to the error `<p>` to match `Input` error spacing.

### EditableAllocationCell improvements in [src/components/planning/EditableAllocationCell.tsx](src/components/planning/EditableAllocationCell.tsx)

Current behavior for invalid input: silently reverts and closes the editor. Improvement:

- On `parsed.kind === "invalid"`: instead of immediately closing, **flash** a brief inline error message ("Numbers only") for ~1.5s, then reset and close. This preserves the fast editing flow while giving feedback.
- On values > 100: instead of silently clamping to 100, **show** the clamped value in the input and set a brief transient hint ("Capped at 100%") that clears after save succeeds. The value is still clamped and saved, but the user sees what happened.
- On 0 or empty removing an allocation: the current behavior is fine, but add a tooltip to the empty cell's `+` button: `title="Click to allocate (0% removes)"`.

### Form-level errors

**[src/components/projects/ProjectForm.tsx](src/components/projects/ProjectForm.tsx)** and **[src/components/resources/ResourceForm.tsx](src/components/resources/ResourceForm.tsx)**

- Replace the inline `_form` error `<p>` with `<FormAlert message={errors._form?.[0]} />`.

---

## Phase 3 -- Row Action Hover

### Strategy

Row actions should be **low-emphasis at rest, sharpened on row hover**. This means:

- At rest: action text is `text-[var(--rm-muted-subtle)]` (very quiet).
- On row hover (`group` / `group-hover`): actions shift to `text-[var(--rm-muted)]` (normal ghost emphasis).
- On direct button hover: existing ghost/danger behavior kicks in (bg change, text brightens).

This is a group-hover pattern using Tailwind's `group` on the `<tr>`.

### Shared component changes

**[src/components/ui/DataTable.tsx](src/components/ui/DataTable.tsx) -- `DataTableRow`**

- Add `group` to the `<tr>` className so child elements can use `group-hover:*`.

**[src/components/ui/Button.tsx](src/components/ui/Button.tsx) -- new `"ghost-muted"` variant**

- A quieter ghost for row actions: `text-[var(--rm-muted-subtle)]` at rest, `group-hover:text-[var(--rm-muted)]` on row hover, full `hover:bg-[var(--rm-surface)] hover:text-[var(--rm-fg)]` on direct hover.
- This replaces `ghost` for all table row actions (Edit, Archive, Restore).

**Danger button at rest refinement in [src/components/ui/Button.tsx](src/components/ui/Button.tsx)**

- The `danger` variant currently shows a red border at rest -- too aggressive for inline table use.
- Add a new `"danger-ghost"` variant: no border at rest, `text-[var(--rm-muted-subtle)]` at rest, `group-hover:text-[var(--rm-danger)]` on row hover, full danger styling on direct hover. This is specifically for destructive row actions (Delete) that should not scream until the user is interacting.

### Specific pages

**[src/components/projects/ProjectList.tsx](src/components/projects/ProjectList.tsx)**

- Active rows: Edit + Archive buttons switch from `variant="ghost"` to `variant="ghost-muted"`.
- Archived rows: Restore switches to `variant="ghost-muted"`, Delete switches from `variant="danger"` to `variant="danger-ghost"`.
- Add `gap-1` between action buttons to prevent visual merging.

**[src/components/resources/ResourceList.tsx](src/components/resources/ResourceList.tsx)**

- Same treatment as ProjectList.

---

## Files touched (summary)

- `src/components/ui/EmptyState.tsx` -- add `compact` prop, add `search` icon
- `src/components/ui/FormAlert.tsx` -- new shared component
- `src/components/ui/FormGroup.tsx` -- fix error spacing
- `src/components/ui/DataTable.tsx` -- add `group` class to row
- `src/components/ui/Button.tsx` -- add `ghost-muted` and `danger-ghost` variants
- `src/components/projects/ProjectList.tsx` -- filtered empty state, row action variants, gap
- `src/components/resources/ResourceList.tsx` -- filtered empty state, row action variants, gap
- `src/components/projects/ProjectForm.tsx` -- use FormAlert
- `src/components/resources/ResourceForm.tsx` -- use FormAlert
- `src/components/planning/PlanningTable.tsx` -- filtered empty state for zero groups
- `src/components/planning/EditableAllocationCell.tsx` -- invalid input feedback, clamp hint

