---
name: UX keyboard and polish
overview: Add "e" keyboard shortcut (click-to-select + press "e") for editing in Projects/Resources, add accent color to the planning view toggle, and fix the planning pairing dropdown to match the dark UI.
todos:
  - id: datatable-selected
    content: Add `selected` prop to DataTableRow with subtle highlight styling
    status: completed
  - id: segmented-accent
    content: Add `accent` prop to SegmentedTabs for primary-colored active state
    status: completed
  - id: projects-keyboard
    content: Add click-to-select + 'e' keyboard shortcut to ProjectList
    status: completed
  - id: resources-keyboard
    content: Add click-to-select + 'e' keyboard shortcut to ResourceList
    status: completed
  - id: planning-accent
    content: Pass `accent` to the By project / By resource SegmentedTabs in PlanningGrid
    status: completed
  - id: fix-dropdown
    content: Verify and fix planning pairing dropdown dark styling
    status: completed
  - id: build-verify
    content: Verify build passes with no regressions
    status: completed
isProject: false
---

# UX: Keyboard Edit Shortcut, Accent Toggle, Dropdown Fix

## Feature 1 -- "e" keyboard shortcut to edit (Projects + Resources)

**Approach**: Click a row to select it (tracked via `selectedId` state), then press "e" to open the edit modal. The selected row gets a subtle highlight.

### Shared: `DataTableRow` selection support

In [src/components/ui/DataTable.tsx](src/components/ui/DataTable.tsx), add an optional `selected` prop to `DataTableRow`:

- When `true`, apply a subtle highlight: `bg-[var(--rm-surface)]/80` (slightly brighter than hover, with a faint left border or ring)
- Also add `cursor-pointer` to all rows that have an `onClick`

### ProjectList changes in [src/components/projects/ProjectList.tsx](src/components/projects/ProjectList.tsx)

- Add `selectedId` state (`string | null`)
- Row `onClick` sets `selectedId` to `p.id` (toggle: clicking the same row deselects)
- Pass `selected={selectedId === p.id}` to `DataTableRow`
- Add a global `keydown` listener via `useEffect`:
  - `"e"`: if `selectedId` is set, the item is not archived, and no modal/dialog is open, call `openEdit(selectedProject)`
  - `"Escape"`: deselect (`setSelectedId(null)`)
  - Guard: skip if `e.target` is an input/textarea/select (user is typing in search)
- When `modalOpen` changes to `false`, keep selection so the user can re-edit
- Clear selection when filters change (search, statusFilter)

### ResourceList changes in [src/components/resources/ResourceList.tsx](src/components/resources/ResourceList.tsx)

- Same pattern as ProjectList: `selectedId` state, row click to select, "e" to edit, Escape to deselect
- Same guards for input focus and modal state

---

## Feature 2 -- Accent color on planning view toggle

### SegmentedTabs in [src/components/ui/SegmentedTabs.tsx](src/components/ui/SegmentedTabs.tsx)

Add an optional `accent?: boolean` prop:

- When `accent` is true, the active tab uses:
`bg-[var(--rm-primary)]/15 text-[var(--rm-primary-text)]`
instead of the default neutral:
`bg-[var(--rm-surface-elevated)] text-[var(--rm-fg)]`
- Inactive tabs stay the same

### PlanningGrid in [src/components/planning/PlanningGrid.tsx](src/components/planning/PlanningGrid.tsx)

- Pass `accent` to the "By project / By resource" `SegmentedTabs` only
- The span selector (4w/8w/12w) and other SegmentedTabs keep the default neutral style

---

## Feature 3 -- Fix planning pairing dropdown (white menu)

The custom `Select` component in [src/components/ui/Select.tsx](src/components/ui/Select.tsx) renders its menu via `createPortal` to `document.body`. The menu uses `bg-[var(--rm-surface-highest)]` which should be dark (`#252529`).

The issue is likely that the portal renders outside the element where the CSS custom properties are scoped. If `:root` variables are correctly applied, the colors should work. Possible fixes:

- Verify that `--rm-surface-highest` is defined on `:root` in [src/app/globals.css](src/app/globals.css) and available globally
- If the portal node doesn't inherit the dark context, add an explicit `color-scheme: dark` and `background-color` fallback to the menu panel
- Alternatively, the user may be seeing a flash of unstyled content or a different dropdown -- inspect all selects in `PlanningTableBody` and `PlanningGrid`

Investigation step: run the app and verify. If the menu is indeed rendering white, the fix is to add inline fallback styles to the portal menu in `Select.tsx`:

```tsx
style={{
  ...existing styles,
  backgroundColor: 'var(--rm-surface-highest, #252529)',
  color: 'var(--rm-fg, #e4e4e7)',
}}
```

---

## Files touched

- `src/components/ui/DataTable.tsx` -- add `selected` prop to `DataTableRow`
- `src/components/ui/SegmentedTabs.tsx` -- add `accent` prop
- `src/components/ui/Select.tsx` -- verify/fix portal dark styling
- `src/components/projects/ProjectList.tsx` -- row selection + "e" shortcut
- `src/components/resources/ResourceList.tsx` -- row selection + "e" shortcut
- `src/components/planning/PlanningGrid.tsx` -- pass `accent` to view toggle

