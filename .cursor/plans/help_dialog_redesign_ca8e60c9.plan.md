---
name: Help dialog redesign
overview: Restructure [HelpDialog.tsx](src/components/app-shell/HelpDialog.tsx) into a shorter, tabbed help experience with clearer typography and card-style groupings, using only existing Indigo Graphite CSS variables and patterns aligned with [Modal.tsx](src/components/ui/Modal.tsx). Remove or compress URL/CSV/detail tables that duplicate in-app discovery.
todos:
  - id: trim-content
    content: "Rewrite HelpContent: merge/drop sections per plan (URLs, CSV, dense tables); bullets + grid/dl for remainder"
    status: completed
  - id: tab-shell
    content: Add SegmentedTabs + tabpanels; sticky tab bar; align panel chrome with Modal (surface, radius, close control)
    status: completed
  - id: a11y-pass
    content: Verify tablist/tabpanel ids, focus trap, Escape, aria-labelledby on dialog title
    status: completed
isProject: false
---

# Modern help popup (palette-aligned)

## Current state

- All content lives in one scroll stack inside a custom portal dialog (`[HelpDialog.tsx](src/components/app-shell/HelpDialog.tsx)`): `max-w-2xl`, `rm-surface-elevated`, `rounded-2xl`, sticky header, `×` close.
- Nine sections rely on dense `<table>` rows; several topics overlap (e.g. **Notes on allocations** vs **Visual Indicators** corner fold; **Planning Grid** vs keyboard tables).
- Shared app modals use `[Modal.tsx](src/components/ui/Modal.tsx)`: `rm-surface`, `rounded-xl`, softer border/shadow, accessible close control with focus ring — the help UI is visually adjacent but not quite the same “family.”

Design tokens to keep using (no new colors): `--rm-fg`, `--rm-muted`, `--rm-muted-subtle`, `--rm-surface`, `--rm-surface-elevated`, `--rm-border`, `--rm-border-subtle`, `--rm-primary` / `--rm-primary-text` for light emphasis only.

## Information architecture: what to show vs drop

**Keep (high value for first-time / daily use)**

- **Quick start** — Keep the 3 steps; tighten wording slightly so each line scans in one glance.
- **Planning** — Cell edit (%, Enter), delete (0/clear), add row/group, notes at a glance (one short block, not a full duplicate of shortcuts).
- **Keyboard** — Merge the three shortcut tables into **one** compact reference: group by context with a small label row (e.g. “In cell”, “Notes”, “Everywhere”) using a **grid or `<dl>`** instead of three `<table>`s.
- **Navigation** — Keep the planning toolbar behaviors (`« »`, span chips, Today, view toggle, team filter) in a **short bullet list** (faster than a table).

**Compress or remove (nice-to-have / power-user / discoverable elsewhere)**

- **Projects & Resources** — Replace the 8-row table with **4–5 bullets**: create from page buttons; edit (Edit button or row select + `E` when row is active); archive/restore/delete rules in one line each; search + tabs in one line. Drop the long field-validation paragraph (name required, capacity 0–168, “informational”) unless you want a single muted footnote — most users learn this from forms.
- **Visual indicators** — Merge into **one** subsection under Planning or a dedicated “Legend” tab: dots/stripes, over-allocation colors, archived/muted rows, note fold — **one line per idea**, no table.
- **Shareable URLs** — Replace the parameter table + default-value paragraph with **one sentence**: planning state is in the URL; copy the address bar to share. Omit `view` / `span` / `weekStart` / `team` tables (power users can infer from the URL).
- **CSV import** — Remove from help or reduce to **one line**: “Bulk import: Admin → CSV import.” The admin flow is step-driven in the UI.

Result: roughly **half the vertical content**, focused on actions users cannot guess from labels alone.

## UI / layout changes

1. **Tabbed content** — Use existing `[SegmentedTabs](src/components/ui/SegmentedTabs.tsx)` in the dialog body (below the title, above scroll) with something like: **Start** | **Planning** | **Shortcuts** | **Reference** (Reference holds compressed lists: lists/projects bullets + legend if you did not fold legend into Planning). Wire `role="tabpanel"` / `aria-labelledby` on the active panel for consistency with the tablist.
2. **Replace tables with structured lists** — For key/value pairs, use a **two-column grid** (`grid gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,7rem)_1fr]`) or `<dl>` with `dt`/`dd` styled with `text-xs` labels and `text-sm` body — easier to read than `<tr><td>`.
3. **Section rhythm** — Inside each tab: `space-y-6`; subsection titles `text-xs font-medium uppercase tracking-wide text-[var(--rm-muted)]` (matches [ui-system.md](docs/ui-system.md) guidance for small headers).
4. `**kbd` styling** — Keep mono only for keys; optionally add a hairline `bg-[var(--rm-surface-highest)]` so chips match elevated surfaces from [globals.css](src/app/globals.css).
5. **Optional callouts** — One or two “tips” using `border-l-2 border-[var(--rm-primary)]/40 pl-3 text-sm text-[var(--rm-muted)]` — reserved use so accent stays meaningful.

## Shell alignment with app modals

- Match **Modal**-like panel: `bg-[var(--rm-surface)]`, `rounded-xl`, border/shadow classes from `[Modal.tsx](src/components/ui/Modal.tsx)` (lines 88–89), same header spacing and **SVG close** + focus ring pattern (lines 106–113) instead of raw `×` on `Button variant="ghost"`.
- Keep **portal + FocusTrap + body scroll lock** as today (or extract a shared “large modal” wrapper later — optional; not required for this task).
- Widen slightly if needed after tabs: e.g. `max-w-3xl` so two-column shortcut grids breathe; cap body with `max-h-[min(85vh,720px)]` and `overflow-y-auto` on the **tab panel** only so **SegmentedTabs stay visible** while scrolling (sticky subheader under the title bar is ideal).

## Files to touch

- Primary: `[src/components/app-shell/HelpDialog.tsx](src/components/app-shell/HelpDialog.tsx)` — content rewrite, layout, tab state, shell classes, accessibility for tab panels.
- No changes to `[globals.css](src/app/globals.css)` unless you add a tiny utility (prefer Tailwind arbitrary values + tokens inline first).

## Out of scope (unless you ask)

- Documenting this in `docs/ui-system.md` (per project convention: only if you want help patterns codified).
- Refactoring `Modal` to accept `size="lg"` and reusing it inside `HelpDialog` — possible follow-up to reduce duplication.

