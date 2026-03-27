---
name: UX Improvements P0-P2
overview: "Implement UX improvements across three priority tiers: P0 (toast system + archive/unarchive), P1 (search/filter, today button, empty states, focus trap), and P2 (team filtering on planning, notes on cells)."
todos:
  - id: p0-toast
    content: "P0: Install sonner, add Toaster to layout, create ConfirmDialog component"
    status: completed
  - id: p0-toast-integrate
    content: "P0: Replace all alert()/confirm() calls with toast + ConfirmDialog in ProjectList, ResourceList"
    status: completed
  - id: p0-toast-success
    content: "P0: Add success toasts to ProjectForm and ResourceForm on create/save"
    status: completed
  - id: p0-archive-actions
    content: "P0: Add archive/unarchive server actions for projects and resources"
    status: completed
  - id: p0-archive-ui
    content: "P0: Replace Delete with Archive in list UIs, add Unarchive for archived items"
    status: completed
  - id: p1-search-filter
    content: "P1: Add search bar + status filter tabs to ProjectList and ResourceList"
    status: completed
  - id: p1-search-data
    content: "P1: Update page queries to fetch all statuses (not just ACTIVE for resources)"
    status: completed
  - id: p1-today-span
    content: "P1: Add Today button and span selector (4/8/12 weeks) to PlanningGrid"
    status: completed
  - id: p1-empty-states
    content: "P1: Create EmptyState component and replace plain-text empties in lists + planning"
    status: completed
  - id: p1-focus-trap
    content: "P1: Install focus-trap-react, add focus trap to Modal, fix dialog ARIA placement"
    status: completed
  - id: p2-team-filter
    content: "P2: Add team filter dropdown to PlanningGrid with URL param persistence"
    status: completed
  - id: p2-notes-cells
    content: "P2: Add note indicator dot on cells + note textarea in editing mode"
    status: completed
isProject: false
---

# UX Improvements: P0, P1, and Selected P2

## P0-1: Toast Notification System (replace alert/confirm)

**Install `sonner`** (lightweight toast library that works seamlessly with Next.js server actions).

- Add `<Toaster />` in the root [src/app/layout.tsx](src/app/layout.tsx) inside the `<body>`.
- Create a custom confirmation dialog component `src/components/ui/ConfirmDialog.tsx` using the existing [Modal](src/components/ui/Modal.tsx) — renders a title, message, and Cancel/Confirm buttons.

**Files to change:**

- [src/components/projects/ProjectList.tsx](src/components/projects/ProjectList.tsx): Replace `confirm()` with `ConfirmDialog` state, replace `alert()` with `toast.error()`, add `toast.success("Project deleted")` on success.
- [src/components/resources/ResourceList.tsx](src/components/resources/ResourceList.tsx): Same pattern.
- [src/components/projects/ProjectForm.tsx](src/components/projects/ProjectForm.tsx): Add `toast.success("Project created/saved")` in `onSuccess` path.
- [src/components/resources/ResourceForm.tsx](src/components/resources/ResourceForm.tsx): Same pattern.
- The planning cell ([EditableAllocationCell.tsx](src/components/planning/EditableAllocationCell.tsx)) already shows inline errors, so no toast needed there.

---

## P0-2: Archive / Unarchive (soft delete)

The `LifecycleStatus` enum (`ACTIVE | ARCHIVED`) already exists in the [Prisma schema](prisma/schema.prisma). The current delete actions hard-delete with cascade.

**Server actions** — add to each actions file:

- `archiveProject(id)` / `unarchiveProject(id)` in [src/app/projects/actions.ts](src/app/projects/actions.ts): `db.project.update({ where: { id }, data: { status: "ARCHIVED" } })`.
- `archiveResource(id)` / `unarchiveResource(id)` in [src/app/resources/actions.ts](src/app/resources/actions.ts): same pattern.

**UI changes:**

- [ProjectList.tsx](src/components/projects/ProjectList.tsx): Replace "Delete" button with "Archive" (uses `ConfirmDialog` from P0-1). When viewing archived items, show "Unarchive" and "Delete permanently" (the latter with a stronger confirmation warning).
- [ResourceList.tsx](src/components/resources/ResourceList.tsx): Same pattern.
- These lists will gain status filter tabs as part of P1-1 (next section), so archived items become accessible.

---

## P1-1: Search + Filter on Lists

Add a toolbar above each table with:

- A **text search input** filtering by name (client-side, since dataset is typically small).
- **Status filter tabs**: "Active" (default) | "Archived" | "All" — client-side filter on the `status` field.

**Data change:** Both [src/app/projects/page.tsx](src/app/projects/page.tsx) and [src/app/resources/page.tsx](src/app/resources/page.tsx) currently query with `orderBy: { name: "asc" }` (projects) and no status filter. Change both to fetch all statuses so the client can filter.

**Component changes:**

- [ProjectList.tsx](src/components/projects/ProjectList.tsx): Add `search` and `statusFilter` state. Filter `projects` array before rendering. Show a `<Input>` search box + 3 filter buttons above the table.
- [ResourceList.tsx](src/components/resources/ResourceList.tsx): Same, plus allow filtering by **team** (dropdown from unique team values in the data) and **role**.
- Archived rows rendered with `opacity-60` styling to distinguish them visually.

---

## P1-2: "Today" Button + Span Selector

In [PlanningGrid.tsx](src/components/planning/PlanningGrid.tsx), the week navigator (lines 229-250) only has left/right arrows.

**Add:**

- A **"Today" button** between the left arrow and the date range label. On click: reset `weekStart` to `getIsoMonday(new Date())` via `router.push`.
- A **span selector** (small `<select>` or segmented control) with options: 4, 8, 12 weeks. On change: update the `span` search param. Place it to the right of the week range label.
- A **jump-by-span** mechanism: clicking the arrow while holding Shift advances by `span` weeks instead of 1, or add double-arrow buttons (`<<` / `>>`) that shift by `span`.

---

## P1-3: Better Empty States

Replace the plain text empty states with illustrated cards containing an icon, message, and CTA.

**Files:**

- [ProjectList.tsx](src/components/projects/ProjectList.tsx) (line 75-77): When `projects.length === 0`, hide the `<table>` entirely, show a centered card with a folder/briefcase SVG icon, "No projects yet" heading, "Create your first project to start planning." subtext, and a "New project" button wired to `openCreate()`.
- [ResourceList.tsx](src/components/resources/ResourceList.tsx) (line 71-73): Same pattern with a person/team icon, "No resources yet", "Add your team members to allocate them to projects."
- [PlanningTable.tsx](src/components/planning/PlanningTable.tsx) (line 76-80): Replace "No projects/resources yet." with a card that links to `/projects` or `/resources`.

Optionally create a reusable `EmptyState` component in `src/components/ui/EmptyState.tsx` with props: `icon`, `title`, `description`, `action` (ReactNode).

---

## P1-4: Focus Trap in Modals

**Install `focus-trap-react`**.

**Change [Modal.tsx](src/components/ui/Modal.tsx):**

- Wrap the modal panel `<div>` in `<FocusTrap>` with `initialFocus` targeting the first focusable element inside.
- Move `role="dialog"` from the outer overlay to the inner panel div (the actual dialog surface), which is the correct ARIA pattern.
- The `ConfirmDialog` (from P0-1) will inherit this behavior automatically since it's built on Modal.

---

## P2-1: Team Filtering on Planning

Add a **team filter dropdown** to the planning toolbar in [PlanningGrid.tsx](src/components/planning/PlanningGrid.tsx).

- Extract unique `team` values from the `resources` prop.
- Add a `<select>` (or multi-select pill UI) labeled "Team" next to the view toggle, defaulting to "All teams".
- When a team is selected, filter `resources` and `bookings` before passing them to `buildPlanningMatrix` in the `useMemo`. This is client-side filtering since all data is already loaded.
- Persist the selected team in a URL search param (`?team=Engineering`) so it survives page reloads.
- The "Add allocation" select at the bottom should also respect the team filter (only show resources from selected team).

---

## P2-2: Notes Visibility on Planning Cells

The `Booking` model has a `note` field (max 200 chars) that is already saved/loaded but not visible in the planning grid.

**Visual indicator:**

- In [EditableAllocationCell.tsx](src/components/planning/EditableAllocationCell.tsx): when `booking?.note` is non-empty, render a small dot indicator (top-right corner of the allocation button, absolute positioned) to signal that a note exists.

**View/edit note:**

- Add a **popover** (or small floating panel) that opens on right-click or via a small icon button on the cell. Contains:
  - A `<textarea>` bound to the note value
  - A "Save" button that calls `updateBooking` with the current allocation + updated note
- Alternatively, when the cell is in editing mode (input visible), add a small "note" icon button below the input. Clicking it expands a textarea inline.

**Simpler approach (recommended):** Add a `title` attribute to the allocation button showing the note as a native tooltip for read, and a small text link "Add note" / "Edit note" that appears below the input when in editing mode, toggling a textarea.

**Files:**

- [EditableAllocationCell.tsx](src/components/planning/EditableAllocationCell.tsx): Add note dot indicator on the display button, add note textarea toggle in editing mode, update `runSave` to include the note from local state.
- [src/app/planning/actions.ts](src/app/planning/actions.ts): Already accepts `note` in `createBooking` / `updateBooking` -- no change needed.

---

## Dependency Summary

```
npm install sonner focus-trap-react
```

No other new dependencies needed. All filtering (search, status, team) is client-side.

## File Change Summary

- **New files:** `src/components/ui/ConfirmDialog.tsx`, `src/components/ui/EmptyState.tsx`
- **Modified (major):** `ProjectList.tsx`, `ResourceList.tsx`, `PlanningGrid.tsx`, `EditableAllocationCell.tsx`, `Modal.tsx`
- **Modified (minor):** `layout.tsx`, `projects/actions.ts`, `resources/actions.ts`, `projects/page.tsx`, `resources/page.tsx`, `PlanningTable.tsx`
- **No schema changes needed** (LifecycleStatus already exists)

