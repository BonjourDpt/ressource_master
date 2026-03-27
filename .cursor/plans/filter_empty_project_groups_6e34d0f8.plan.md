---
name: Filter empty project groups
overview: In the "By project" planning view, hide projects that have no bookings in the visible time range by filtering the output of `buildPlanningMatrix`.
todos:
  - id: filter-groups
    content: Add .filter() to buildPlanningMatrix to exclude project groups with no allocation rows
    status: completed
isProject: false
---

# Filter Empty Project Groups in Planning View

## Current behavior

`buildPlanningMatrix` in `[src/lib/planning-view-model.ts](src/lib/planning-view-model.ts)` creates a group for **every** active project, even those with zero bookings in the visible week range. This clutters the view.

## Proposed change

A single, minimal change inside `buildPlanningMatrix` at the end of the `view === "project"` branch (line 195-244). The function already collects `resourceIds` from bookings for each project -- if that set is empty, the project has no allocations in the visible range.

After the `projects.map(...)` call, add a `.filter()` to exclude groups with no allocation rows:

```typescript
return projects.map((project) => {
  // ... existing code that builds rows ...
}).filter((group) =>
  group.rows.some((r) => r.rowType === "allocation")
);
```

This keeps the "add" row inside each visible project group (so you can still add resources to projects that already have at least one allocation), but hides entirely empty projects.

## What stays unchanged

- **"By resource" view**: All active resources are still shown regardless of bookings (the user did not request filtering here).
- **All projects remain available** in the resource-view dropdown for pairing, so you can still assign any active project to a resource from the "By resource" view.
- **No backend/query changes needed** -- the filtering is purely in the view model logic.

## File to change

- `[src/lib/planning-view-model.ts](src/lib/planning-view-model.ts)`: Add `.filter()` after the `projects.map(...)` on line 195.

