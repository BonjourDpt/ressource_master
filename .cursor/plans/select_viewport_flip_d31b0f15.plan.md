---
name: Select viewport flip
overview: "Fix the planning \"add project/resource\" dropdown (and all `Select` menus) by adding viewport-aware positioning: open above the trigger when there is not enough space below, and cap `maxHeight` so the list stays scrollable inside the viewport."
todos:
  - id: select-flip
    content: Implement viewport flip + maxHeight in Select.tsx updatePosition and menu style
    status: completed
  - id: select-chevron
    content: "Optional: chevron reflects open-above vs open-below"
    status: completed
  - id: verify-build
    content: Run next build; sanity-check planning + filter selects
    status: completed
isProject: false
---

# Planning bottom Select: flip menu into viewport

## Problem

`[Select.tsx](src/components/ui/Select.tsx)` positions the portaled listbox with a fixed `top` at `getBoundingClientRect().bottom + 4` only (`[updatePosition](src/components/ui/Select.tsx)` ~lines 92–97). There is no check against `window.innerHeight`, so a trigger near the bottom of the page (e.g. "+ Add allocation" in `[PlanningGrid.tsx](src/components/planning/PlanningGrid.tsx)` ~304–318) pushes the menu past the fold.

## Approach (single shared fix)

Enhance **only** `[src/components/ui/Select.tsx](src/components/ui/Select.tsx)`—no page-local hacks.

1. **Extend positioning state** beyond `{ top, left, width }` to support either:
  - **Below:** `placement: "bottom"`, `top: r.bottom + gap`, `maxHeight` = `min(240, spaceBelow - margin)` (240px matches existing `max-h-60`).
  - **Above:** `placement: "top"`, position with `**bottom: window.innerHeight - r.top + gap`** (fixed positioning: menu’s bottom edge sits just above the trigger), `maxHeight` = `min(240, spaceAbove - margin)`.
2. **Flip rule:** If usable space below is smaller than a minimum (e.g. ~120–160px) **and** space above is **greater** than space below, use **above**; otherwise **below**. If both sides are tight, still pick the larger side and rely on reduced `maxHeight` + `overflow-auto`.
3. **Apply in the menu `style`:**
  - For `bottom` placement: set `top`, clear `bottom` (`auto` / omit).  
  - For `top` placement: set `bottom`, clear `top`.  
  - Set inline `**maxHeight`** from computed value (and keep `overflow-auto` via class) so the panel never exceeds the viewport.
4. **Keep existing behavior:** `useLayoutEffect` already recalculates on open, scroll (capture), and resize—reuse `updatePosition` so flipping updates when the user scrolls.
5. **Optional polish:** Rotate or mirror the chevron when `placement === "top"` so the trigger hints the menu direction (small UX win, same file).

## Files


| File                                                                                   | Change                                                                     |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `[src/components/ui/Select.tsx](src/components/ui/Select.tsx)`                         | Viewport-aware `updatePosition`, dual placement styles, inline `maxHeight` |
| `[src/components/planning/PlanningGrid.tsx](src/components/planning/PlanningGrid.tsx)` | No change required if `Select` is fixed globally                           |


## Verification

- Open planning with unallocated projects/resources; use bottom "+ Add allocation" `Select`—menu should open **upward** with a scrollable list when needed.
- Spot-check a `Select` mid-page (e.g. team filter)—should still open **downward** when space below is sufficient.
- Run `npx next build`.

