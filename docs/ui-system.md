# Resource Master UI System v1

## Intent
Resource Master should feel like a premium internal planning product:
calm, precise, dark, readable, structured, restrained.

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
- Left sidebar: fixed, 64px width
- Main area: header + page content + status bar
- Header remains visually consistent across pages
- Content container should align across all pages

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

Use existing Indigo Graphite tokens as the source of truth.

### Visual hierarchy
- Background: calm, dark, flat
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

## Planning-Specific Carryover
Planning remains the most complex page and acts as the main interaction benchmark.

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