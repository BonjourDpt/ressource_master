---
name: Readability and help UI
overview: Scale app typography (~+20%) and line spacing (~+30%) via Tailwind theme tokens and globals, increase table/planning row rhythm, add alternating group contrast in the planning grid (especially between projects), and modernize the Help dialog while staying on the Indigo Graphite palette.
todos:
  - id: theme-typography
    content: Override Tailwind @theme text sizes (+20%) and line-heights (+30%); align body in globals.css; replace hardcoded px text in planning/shell
    status: completed
  - id: row-rhythm
    content: Bump DataTable + planning padding, add-row height, optional header height
    status: completed
  - id: planning-contrast
    content: Alternating group bands + parity-matched sticky column bg; optional project-color left rule in project mode
    status: completed
  - id: help-polish
    content: Restyle HelpDialog header, panel, sections, tables, kbd using existing rm-* tokens
    status: completed
  - id: verify-pages
    content: Smoke-test planning sticky scroll, lists, modals, help dialog
    status: completed
isProject: false
---

# Readability, planning contrast, and help dialog polish

## 1. Typography: ~20% larger type, ~30% looser lines

**Mechanism (consistent with Tailwind v4):** Override font-size and line-height theme variables in `[src/app/globals.css](src/app/globals.css)` inside the existing `@theme inline` block. Default tokens live in `node_modules/tailwindcss/theme.css` (e.g. `--text-sm`, `--text-sm--line-height`).

- Multiply each **used** step by **1.2**: at minimum `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl` (page titles use `text-xl`).
- Bump **line-height** for each step by **~30%** versus the previous ratio: e.g. default `--text-sm--line-height` is `calc(1.25 / 0.875)`; target roughly `calc(1.25 / 0.875 * 1.3)` as a unitless ratio, or set explicit ratios like `1.55` / `1.65` per step after spot-checking in the UI.

**Body baseline:** Update `[src/app/globals.css](src/app/globals.css)` `body` to align with the scaled `--text-sm` / `--text-base` (or `font-size` + `line-height` matching the new defaults) so non-utility text inherits correctly.

**Hardcoded sizes:** Grep planning and shell for `text-[10px]`, `text-[11px]`, `text-[13px]` (e.g. `[src/components/planning/PlanningTableBody.tsx](src/components/planning/PlanningTableBody.tsx)`, `[src/components/planning/planningStickyClasses.ts](src/components/planning/planningStickyClasses.ts)`, `[src/components/planning/TimelineHeader.tsx](src/components/planning/TimelineHeader.tsx)` if present) and replace with `**text-xs` / `text-sm`** (or `leading-`*) so they pick up the theme scaling instead of fighting it.

## 2. “Lines 30% higher” for layout (row / control rhythm)

Interpret this as **vertical rhythm** in dense tables, not only CSS `line-height`:

- `**[src/components/ui/DataTable.tsx](src/components/ui/DataTable.tsx)`:** Increase `DataTableTh` / `DataTableCell` vertical padding (~~30%, e.g. `py-2.5` → `py-3.5`, `py-3` → `~~py-4`) so list rows read taller without changing borders.
- `**[src/components/planning/planningStickyClasses.ts](src/components/planning/planningStickyClasses.ts)`:** Scale `padFirst` / `padSecond`, `weekHeadCell`, and `[weekBodyCell](src/components/planning/planningStickyClasses.ts)` `py` similarly; keep sticky z-index and col widths unless readability requires nudging `min-w` / `[WEEK_COL_MIN_PX](src/components/planning/PlanningTable.tsx)`.
- `**[src/components/planning/PlanningTableBody.tsx](src/components/planning/PlanningTableBody.tsx)`:** Raise `addRowLine` row height (`h-8` → ~`h-10` or padding-driven height) so the “+ Add resource” row matches the new rhythm.

Optional: `[AppHeader](src/components/app-shell/AppHeader.tsx)` `h-14` → slightly taller if nav labels feel cramped after scaling.

## 3. Planning: contrast between project groups (and consistent by resource)

Today each group is separated by a light `[border-t-2 border-[var(--rm-border)]/30](src/components/planning/PlanningTableBody.tsx)` on the first row; sticky label cells use solid `[bg-[var(--rm-surface)]](src/components/planning/planningStickyClasses.ts)` and week cells use `[bg-[var(--rm-bg)]](src/components/planning/planningStickyClasses.ts)`.

**Approach (palette-safe):**

- Add **alternating group bands** using `groupIndex % 2`: e.g. even groups use a **subtle lifted surface** on data cells (`--rm-surface` / `color-mix` with `--rm-bg` at low opacity), odd groups stay closer to `--rm-bg`. This reads as “one project vs the next” in **by project** mode and keeps **by resource** visually consistent.
- **Critical:** Sticky first/second columns must use the **same** background as their group row; otherwise zebra stripes look broken. Implement by:
  - Passing a `groupParity: "even" | "odd"` (or boolean) from `[PlanningTableBody](src/components/planning/PlanningTableBody.tsx)` into row rendering, and
  - Extending `[stickyBodyFirst` / `stickyBodySecond](src/components/planning/planningStickyClasses.ts)` (or local `cx(...)`) with parity-based backgrounds, **or** defining two small utility classes in `globals.css` (e.g. `.rm-plan-group-a` / `.rm-plan-group-b`) that encode `background-color` using only existing tokens.
- **Optional extra clarity in by-project mode:** A **3px inset left rule** using `g.groupColor` at ~25–35% opacity on the group’s first column cell (only when `g.mode === "project"` and color exists), in addition to the existing dot—keeps hierarchy without neon blocks.

Validate scroll/sticky: no regression in horizontal scroll or sticky overlap.

## 4. Help dialog: more modern, same design system

All changes in `[src/components/app-shell/HelpDialog.tsx](src/components/app-shell/HelpDialog.tsx)` (and tiny shared tokens in `globals.css` only if needed):

- **Shell:** Slightly richer **elevated surface** (`--rm-surface-highest`), **hairline** border + soft **outer shadow** (`shadow-2xl` tuned), optional **ring** `ring-1 ring-white/5` for a crisp edge on dark backgrounds.
- **Header:** Sticky header with **backdrop-blur-sm** + semi-opaque background using the same token as the panel body; **primary accent** on the title (e.g. subtle bottom border or small `text-[var(--rm-primary-text)]` on “Help”).
- **Content:** Increase section spacing; **section titles** with a short **primary-tinted rule** or letterspacing; slightly larger body copy (will inherit scaled `text-sm`).
- **Tables:** Round corners on table wrapper, zebra **very subtle** row hover or row band using `--rm-surface`; keep readable column separation.
- `**<kbd>` pills:** Deeper inset, `border-[var(--rm-border)]`, `bg-[var(--rm-surface)]`, optional `shadow-inner`—still monospace and small.

No new colors outside existing CSS variables.

## 5. Verification

- Manually compare **Planning**, **Projects**, **Resources**, **Admin** after theme change (Sonner toasts already use tokens).
- Check **planning** horizontal scroll, sticky columns, and **CSV / modals** for overflow.
- Quick **keyboard / focus** pass on Help dialog (existing `FocusTrap` unchanged in behavior).

```mermaid
flowchart LR
  subgraph tokens [globals.css]
    themeText[@theme text scale]
    body[body baseline]
  end
  subgraph consumers [UI]
    tailwindUtils[text-sm text-xs utilities]
    planning[PlanningTable sticky + body]
    lists[DataTable padding]
    help[HelpDialog shell]
  end
  themeText --> tailwindUtils
  body --> tailwindUtils
  themeText --> planning
  planning --> stickyParity[Group parity backgrounds]
```



