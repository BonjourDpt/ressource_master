# Resource Master — Cheatsheet

Resource Master is a weekly capacity planning tool where you assign **resources** (people) to **projects** with percentage allocations per week.

---

## 1. Quick Start

1. Go to **Projects** → click **New project** → give it a name and a color.
2. Go to **Resources** → click **New resource** → enter name, role, team, and weekly capacity (default 37.5h).
3. Go to **Planning** → your project appears → click **+ Add resource** inside it → pick a person → click a week cell → type a percentage → press **Enter**.

You're planning.

---

## 2. Projects & Resources

| Action | How |
|--------|-----|
| **Create** | Click **New project** / **New resource** on the respective page. |
| **Edit** | Click **Edit** on the row → update fields in the modal → **Save**. Or click the row to select it (highlighted), then press **E** to open the same editor (**active** rows only). |
| **Row selection** | Click a row to select it. **Esc** clears the selection. |
| **Keyboard focus** | **E** / **Esc** are ignored when focus is in the search box, on tabs, on buttons/links, or while a modal is open. |
| **Archive** | Click **Archive** → confirm. Hidden from planning, restorable anytime. |
| **Restore** | Switch to the **Archived** tab → click **Restore**. |
| **Delete permanently** | Only available on archived items. Removes all linked allocations. |
| **Search** | Type in the search bar — filters by name, client (projects) or name, role, team (resources). |
| **Filter by status** | Tabs: **Active** (default) · **Archived** · **All**. |
| **Filter by team** | Resources page: dropdown next to status tabs. |

**Project fields:** Name (required), Client, Color (pick from 10 swatches).
**Resource fields:** Name (required), Role, Team, Capacity in hours/week (0–168).

---

## 3. Planning Grid — Basics

| To do this… | Do this |
|-------------|---------|
| **Edit an allocation** | Click the percentage button on a filled cell. |
| **Add an allocation** | Click the **+** on an empty cell. |
| **Assign a new resource to a project** | Click **+ Add resource** (by-project view) or **+ Add project** (by-resource view) inside a group. Pick from the dropdown, then type a percentage. |
| **Bring in an unallocated project/resource** | Use the **+ Add allocation** dropdown at the bottom of the grid. |
| **Delete an allocation** | Edit the cell → clear the value (or type 0) → press Enter. |

Values are integers from **1%** to **100%** per cell. One cell = one resource on one project for one week.

---

## 4. Planning Grid — Navigation

| Control | What it does |
|---------|--------------|
| **Undo / Redo** | Step backward or forward through **saved** allocation changes (create, edit, delete from a cell). Buttons next to the view toggle. Shortcuts: **Ctrl+Z** (undo), **Ctrl+Y** or **Ctrl+Shift+Z** (redo); on Mac use **⌘** instead of **Ctrl**. Disabled when there is nothing to undo or redo. |
| **By project / By resource** | Toggle how the grid is grouped. **Switching view clears** the undo/redo history for that page. |
| **Team filter** | Dropdown (appears when resources have teams). Filters resources and their bookings. |
| **« / »** | Shift the visible window by **1 week**. |
| **«« / »»** | Jump by the **full span** (4, 8, or 12 weeks). |
| **This week** | Snap back to the current week. |
| **4w · 8w · 12w** | Set how many weeks are visible at once. |

All navigation updates the URL, so you can bookmark or share any view.

Undo/redo applies to changes **after** they are saved to the server. It does **not** cover unsaved text in an open cell, and the stack is **not** kept after a full page reload — only for the current session in that tab.

---

## 5. Keyboard Shortcuts

### Allocation cell (% input focused)

| Key | Action |
|-----|--------|
| **Enter** | Save and close cell. |
| **Escape** | Cancel changes and close cell. |
| **Tab** | Save, then move to the **next** cell. |
| **Shift + Tab** | Save, then move to the **previous** cell. |

### Note textarea (open inside a cell)

| Key | Action |
|-----|--------|
| **Enter** | Save allocation + note and close. |
| **Shift + Enter** | Insert a newline in the note. |
| **Escape** | Close note area, return focus to % input. |

### Planning (focus not in a field)

Shortcuts apply when you are **not** typing in an input, textarea, select, or rich-text field (same idea as row **E** on list pages).

| Key | Action |
|-----|--------|
| **Ctrl+Z** (**⌘+Z** on Mac) | Undo the last **saved** allocation change. |
| **Ctrl+Y** or **Ctrl+Shift+Z** (**⌘+Y** / **⌘+Shift+Z** on Mac) | Redo. |

### Modals & dialogs

| Key | Action |
|-----|--------|
| **Escape** | Close any open modal or confirmation dialog. |

---

## 6. Notes on Allocations

- While editing a cell, click **Add note** (or **Edit note**) below the input to expand a textarea.
- Notes are saved together with the allocation when you press Enter or Tab.
- Cells with a note show a small **corner fold** (triangle) in the top-right of the percentage button.
- Hover over a filled cell to see the note in a **tooltip**.
- Max length: 200 characters.

---

## 7. Shareable URLs

The planning page encodes its full state in the URL. If you omit query parameters, the app uses: **`view=project`**, **`span=12`**, **`weekStart`** = current ISO Monday, and **all teams** (no `team` param).

| Parameter | Example | Description |
|-----------|---------|-------------|
| `view` | `resource` | `project` (default) or `resource`. |
| `span` | `12` | Weeks visible: `4`, `8`, or `12`. If omitted, the app defaults to **12**. |
| `weekStart` | `2026-03-23` | ISO Monday date for the first visible week. |
| `team` | `Engineering` | Filter by team name. Omit for all teams. |

**Example:**
```
/planning?view=resource&span=8&weekStart=2026-03-23&team=Engineering
```

Copy the URL from your browser and share it — the recipient sees the exact same view.

---

## 8. CSV Import (Admin)

1. **Upload** — Go to **Admin**, choose **Resources** or **Projects**, drag-and-drop or select a `.csv` / `.tsv` file.
2. **Map columns** — The tool auto-maps CSV headers to fields. Adjust if needed. The **Name** column must be mapped.
3. **Preview & Import** — Review rows marked as **New**, **Update**, or **Duplicate** (skipped). Click **Import**.

Existing records are matched **by name** — if a name already exists, the record is updated rather than duplicated.

---

## 9. In-App Help

Click the **?** button in the top-right corner of the header to open this cheatsheet in a dialog. Press **Escape**, click **×**, or click the dimmed backdrop to close it.

---

## 10. Visual Indicators at a Glance

| Indicator | Meaning |
|-----------|---------|
| Colored dot next to a project name | Project color (set in project settings). |
| Left color stripe on a cell (by-resource view) | Which project this allocation belongs to. |
| Corner fold (top-right of the % button) | This cell has a note — hover to read it in the tooltip. |
| Orange warning text under a resource name | Resource is **over-allocated** (> 100%) for those weeks. |
| Total row pill turns orange/red | Week total exceeds 100% (warning) or 120% (danger). |
| "Archived" badge on a list row | Item is archived and hidden from planning. |
| Reduced opacity row | Archived item in the list view. |
