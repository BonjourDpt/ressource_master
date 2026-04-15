# RESOURCE PLANNER UI System v1

## Intent
RESOURCE PLANNER should feel like a premium internal planning product:
calm, precise, readable, structured, restrained — in **dark** (default) or **light** appearance.

The UI should not feel like:
- a default admin template
- a spreadsheet with random styling
- multiple pages designed independently

The UI should feel coherent across Planning, Projects, Resources, and Admin.

---

## Design Principles

1. Reuse before inventing
2. Data readability first
3. Subtle contrast over heavy decoration
4. Strong hierarchy, low noise
5. Shared components over page-local styling
6. Functional elegance over visual novelty

---

## Layout Rules

### App Shell
- **Top header** — Sticky full-width bar with brand mark (`public/app-brand-icon.png`, luminance-masked and filled with `currentColor` / primary text for white-on-dark artwork), two-line app title (**RESOURCE** / **PLANNER**), primary nav (Planning, Projects, Resources, Admin), **appearance** control (icon-only: sun while dark, moon while light — switches `data-theme` on `<html>`), and the in-app **Help** control.
- **Main area** — Centered content column (`max-w-[1800px]`) with horizontal padding; page content sits in `<main>` with bottom padding so lists clear the status bar.
- **Status bar** — Fixed footer strip showing live **resource** and **project** counts (mono, subtle).
- Header and content width should stay aligned so pages feel like one product, not separate templates.

### Page Structure
Every major page should follow this order:
1. Page header
2. Controls row
3. Main content

### Spacing
- Prefer consistent vertical rhythm
- Use one spacing system across pages
- Controls should have breathing room above the content
- Avoid cramped title/control/table stacking

---

## Typography

### Titles
- Large enough to anchor the page
- Bold but restrained
- Consistent across major pages

### Labels and headers
- Small, precise, subtle
- Table headers can use uppercase / tracking for clarity
- Do not overdo tiny text

### Body text
- Clear, neutral, highly readable

### Mono text
Use only for:
- numeric values
- percentages
- metadata-like status if needed

Do not use mono as a decorative font.

---

## Color System

Use **Indigo Graphite** semantic tokens in [`src/app/globals.css`](../src/app/globals.css) as the source of truth.

- **Default (dark):** `:root` defines `--rm-*` variables and `color-scheme: dark`.
- **Light mode:** `html[data-theme="light"]` overrides the same `--rm-*` names; `color-scheme: light`.
- **Persistence:** `localStorage` key `rm-theme` stores `"dark"` or `"light"`. A small `beforeInteractive` script applies the stored theme before paint to avoid a flash.
- **Overlays:** `--rm-scrim` (modal/side-panel/help backdrop) and elevation shadows `--rm-shadow-elevated`, `--rm-shadow-dropdown` are theme-aware.

### Visual hierarchy
- Background: calm, flat (dark graphite or light gray)
- Surfaces: slightly lifted from background
- Borders: subtle, never loud
- Primary accent: reserved and meaningful
- Muted text: readable, not faded into invisibility
- Danger: only for true warnings / overload / destructive states

Avoid introducing extra page-specific colors unless they encode real meaning.

---

## Component Rules

### PageHeader
Used on every major page.
Contains:
- page title
- optional subtitle
- primary action button on the right

### PrimaryButton
Used for main page actions:
- New project
- New resource
- similar CTA actions

Must be visually consistent everywhere.

### SegmentedTabs
Used for:
- Active / Archived / All
- similar mutually exclusive views

Must look like a shared control, not inline text links.

### SearchInput
Used across pages for list filtering.
Must share:
- size
- padding
- background
- border
- focus behavior

### DataTable
Used for list/index pages.

Rules:
- subtle header styling
- clear row separators
- comfortable density
- hover state that improves scannability
- consistent cell padding
- no raw-database feeling

### Badge / Dot / Status indicator
Use only when useful.
Must remain subtle and consistent.

---

## Table Guidelines

### General
Tables should feel productized, not default.

### Headers
- subtle
- readable
- consistent casing/treatment

### Rows
- consistent height
- subtle separation
- hover state
- action area aligned and predictable

### Actions
- should be legible
- should not feel detached from row content
- destructive actions should not overpower standard actions

---

## Controls Bar Guidelines

Controls rows may include:
- tabs
- dropdown filters
- search
- secondary actions

Rules:
- all controls should visually belong together
- consistent heights and spacing
- avoid mixing unrelated styles in one row
- layout should remain stable and aligned

---

## Planning Table Layout

### Split-header pattern (`PlanningTable`)

The planning grid splits into two sibling containers so the full planning header row (name columns plus week dates) stays persistent during window-level vertical scroll:

1. **Sticky header div** — `sticky top-14 z-30 overflow-hidden` (positioned below the `h-14` app nav; **`z-30` is required** so the whole thead paints above the body’s sticky label columns, which use `z-[21]` / `z-[20]` — otherwise Project/Resource header text is covered during vertical page scroll). Contains a `<table>` with only `<thead>`. Horizontal scroll position is kept in sync with the body via a `scrollLeft` mirror on `onScroll`.
2. **Scroll body div** — `overflow-x-auto` (standard horizontal scroll). Contains a `<table>` with only `<tbody>`. Fires `onScroll` to update the header div's `scrollLeft`.

Both tables share identical `<colgroup>` definitions and the same `minWidth` style so column widths stay aligned. The first two columns (`sticky left-0` / `sticky left-48`) remain pinned within each container independently.

Both `<table>` elements use **`border-separate` with `border-spacing: 0`** instead of `border-collapse: collapse`. Collapsed borders interact poorly with `position: sticky` on `<th>` in several engines, so the Project/Resource header cells would scroll horizontally out of view while the synced week row moved — separate borders keep label headers pinned like the body’s sticky label columns.

**Why not a single `overflow-x-auto` wrapper?** Setting `overflow-x: auto` on a parent creates a CSS scroll container for *both* axes. Any `position: sticky; top: …` inside it becomes sticky relative to that container, not the window — so the header scrolls away when the page scrolls down. The split pattern avoids this constraint entirely.

### By-resource summary band (`PlanningTableBody`)

In **By resource** view only, each resource group ends with a **Total allocation** row styled as a section closer (elevated surface background, stronger top border, slightly denser row height). It shows summed weekly percentages only; the first sticky column cell is intentionally empty there because the resource title lives in the rowspan cell above. **By project** view has no equivalent summary row.

---

## Planning Cell Conventions

### Allocation cells with notes (`EditableAllocationCell`)
- **Read-only, no note**: single centered allocation `%` label; standard background/text tokens.
- **Read-only, with note**: the button gains the `note-cell` class and switches to a stacked layout — allocation `%` on top, a truncated note preview (`text-[9px]`, `--rm-muted-subtle`) underneath, a corner-fold triangle indicator (`border-t-[var(--rm-primary)]`) in the top-right.
- **Border treatment for note cells**: use `ring-1 ring-inset ring-[var(--rm-primary)]/35` instead of a `border` property. This keeps the styling layout-neutral (ring is rendered as `box-shadow`) so row heights stay identical whether or not a cell has a note.
- **Note preview truncation**: handled by `truncateNotePreview()` (`src/lib/planning-note-utils.ts`), hard-capped at 25 characters + `…`.
- **Editing state**: unchanged from base design; note indicator and border treatment are only on the read-only button.

---

## Planning-Specific Carryover
Planning remains the most complex page and acts as the main interaction benchmark.

Its toolbar clusters related controls (undo/redo for saved grid edits, view mode, optional team filter, week navigation, span). New planning affordances should stay visually grouped and aligned with that row rather than floating as one-offs.

Other pages should inherit:
- spacing discipline
- control consistency
- typography logic
- token usage
- visual restraint

But they should not mimic the planning table mechanically if it hurts usability.

---

## Consistency Checklist

Before considering a page complete, verify:
- same header structure as other pages
- same button style as other pages
- same tabs style as other pages
- same search input style as other pages
- same table language as other pages
- same spacing rhythm as other pages
- no page-specific visual improvisation unless justified

---

## Anti-Patterns

Do not:
- restyle one page with custom local classes when a shared component should exist
- create slightly different versions of the same button/input/tab
- let table pages drift into separate visual languages
- add decorative effects that do not improve hierarchy or usability
- optimize for screenshot aesthetics at the expense of product consistency