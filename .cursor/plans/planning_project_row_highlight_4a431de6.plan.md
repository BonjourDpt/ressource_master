---
name: Planning project row highlight
overview: Add optional “selected project” state in the planning grid (By project only), apply the same left-accent + tinted background pattern as `DataTableRow` across every `<tr>` in that project group, and wire row clicks with `stopPropagation` on allocation/edit controls so editing behavior stays intact.
todos:
  - id: state-grid
    content: Add selectedProjectId state + reset on view/week in PlanningGrid; pass to PlanningTable
    status: completed
  - id: body-rows
    content: "PlanningTableBody: project-mode tr/td highlight + onClick toggle; stopPropagation on add row + draft Select wrapper"
    status: completed
  - id: cells-stop
    content: "EditableAllocationCell: stopPropagation on edit triggers (and editing controls as needed)"
    status: completed
  - id: wire-table
    content: "PlanningTable: thread new props to PlanningTableBody"
    status: completed
isProject: false
---

# Planning By project: row highlight like Projects tab

## Current behavior

- **Projects tab**: `[ProjectList.tsx](src/components/projects/ProjectList.tsx)` keeps `selectedId` and passes `selected={selectedId === p.id}` and `onClick` toggle into `[DataTableRow](src/components/ui/DataTable.tsx)`, which applies:
  - `border-l-2` with `border-l-[var(--rm-primary)]/35` when selected
  - `bg-[var(--rm-primary)]/6` (and slightly stronger hover) when selected
- **Planning**: `[PlanningTableBody.tsx](src/components/planning/PlanningTableBody.tsx)` renders `<tr>` with only bottom border classes (`rowLine` / `addRowLine`); no selection.

## Desired behavior

- In **By project** (`view === "project"`), clicking a project’s **group** (any row under that project: resource lines, add row, etc.) toggles highlight for **all rows** sharing `g.groupId`, so the whole block reads as one selected “project” (helps scan allocations).
- **By resource**: unchanged (no new props behavior, or pass `null` and no-op).

## Interaction with allocation cells

`[EditableAllocationCell.tsx](src/components/planning/EditableAllocationCell.tsx)` uses `<button>` to enter edit mode; those clicks **bubble** to `<tr>`. If `<tr>` toggles selection with the same semantics as ProjectList (`id === g.groupId ? null : id`), a second click on a cell in an **already selected** project would **deselect** while opening the editor—bad UX.

**Fix:** call `e.stopPropagation()` on allocation UI pointer events (at minimum the non-editing `<button>` `onClick` handlers; also editing-mode controls that should not toggle row selection). Same for the **+ Add resource** button and draft **Select** in `[PlanningTableBody.tsx](src/components/planning/PlanningTableBody.tsx)`—wrap draft `Select` in a `div` with `onClick={(e) => e.stopPropagation()}` (or `onPointerDown`) so choosing a resource does not toggle highlight.

Clicks on **non-interactive** parts of a row (e.g. resource label text in the sticky second column, empty padding in week cells where the button is not full width) will still select/toggle, which matches “click on the line” without breaking edits.

## Visual implementation notes

- `**tr`**: add the same border/transition/hover pattern as `DataTableRow` (`border-l-2`, transparent vs primary left border, `transition-colors`, hover when not selected). Add `cursor-pointer` only for project-mode rows that handle click.
- `**td` backgrounds**: planning cells set explicit backgrounds (`stickyBodyFirst` / `stickyBodySecond` use `bg-[var(--rm-surface)]`, `weekBodyCell` uses `bg-[var(--rm-bg)]`), so a `tr` background alone will not read like the projects table. When selected, **append** a primary tint to each `td` in that row (e.g. `bg-[var(--rm-primary)]/6` on week cells; same tint on sticky columns so the stripe is consistent). Reuse the same opacity tokens as `DataTableRow` for cohesion.
- **Accessibility**: on project-mode `<tr>`, set `aria-selected={isSelected}` when using click selection (and ensure interactive children remain focusable).

## State and wiring

1. `**[PlanningGrid.tsx](src/components/planning/PlanningGrid.tsx)`**
  - `useState<string | null>(null)` for highlighted project id.  
  - Clear it in the existing effect that resets on `view` / week range / span (alongside `editingCell`, drafts, pins) so highlights do not leak across navigations.  
  - Pass `selectedProjectId`, `onToggleProjectSelection(projectId: string)` (or equivalent) into `PlanningTable` **only as needed**—simplest is always pass `selectedProjectId` + handler; handler no-ops in resource view inside body, or only pass when `view === "project"` (either is fine; keep call sites small).
2. `**[PlanningTable.tsx](src/components/planning/PlanningTable.tsx)`**
  - Thread new props through to `PlanningTableBody`.
3. `**[PlanningTableBody.tsx](src/components/planning/PlanningTableBody.tsx)`**
  - When `g.mode === "project"` and props are present:  
    - `const rowSelected = selectedProjectId === g.groupId`  
    - Merge highlight classes into `trClass`; add `onClick` on `<tr>` to call toggle for `g.groupId`.  
    - Conditionally extend `className` for each `td` in that row (sticky first only on `isFirstInGroup`, sticky second, week cells, add-row empty cells, etc.) so tint applies everywhere.
  - Do not attach row click / selection styling when `g.mode === "resource"`.
4. `**[EditableAllocationCell.tsx](src/components/planning/EditableAllocationCell.tsx)**`
  - Add `stopPropagation` on interactive controls as above (minimal: buttons that enter edit mode; extend to input/note UI if clicks would otherwise hit the row—usually input lives inside a selected row without needing toggle, but stopping on the editing container avoids surprises).

## Files touched (expected)

- `[src/components/planning/PlanningGrid.tsx](src/components/planning/PlanningGrid.tsx)` — state + reset + props  
- `[src/components/planning/PlanningTable.tsx](src/components/planning/PlanningTable.tsx)` — prop pass-through  
- `[src/components/planning/PlanningTableBody.tsx](src/components/planning/PlanningTableBody.tsx)` — row/cell classes, click handler, Select wrapper  
- `[src/components/planning/EditableAllocationCell.tsx](src/components/planning/EditableAllocationCell.tsx)` — stop propagation on cell controls

No change required to `[DataTable.tsx](src/components/ui/DataTable.tsx)` unless you later want to export shared class fragments to avoid duplicating the two-line class string (optional cleanup).