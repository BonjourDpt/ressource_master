# Product assumptions

Explicit assumptions behind the current product design. Revisit when changing behavior or adding features.

## Resources and projects

- **Resource** — A person (or role) that can be assigned to projects. Represented by name, optional role/team, and a weekly capacity in hours (default 37.5h, range 0–168h). Capacity is informational; it does not block bookings.
- **Project** — A piece of work. Has name, optional client, and a color from a fixed palette of **10** swatches (for the planning grid).
- **Lifecycle status** — Both projects and resources have a status: **ACTIVE** (default) or **ARCHIVED**. Archiving hides items from the planning grid and list defaults, but preserves data and linked bookings for later restoration.

## Bookings

- **Booking** — One resource assigned to one project for **one week**, with an **allocation percentage** (1–100%) and an optional **note** (max 200 characters).
- **Unit:** Allocation is always a **percentage** of that week (not hours or days). Interpretation is informal (e.g. "60%" = roughly 3 days).
- **Uniqueness:** At most one booking per (resource, project, week). Same resource can have multiple bookings in the same week (different projects).
- **Over-allocation:** A resource can total more than 100% in a week. The app **allows** it and shows a **warning** (orange/red indicators in the planning view); it does not block saving.

## Time and weeks

- **Week definition:** **ISO week** — week starts on **Monday**. All "week" values are stored as the Monday of that week (normalized, no time component).
- **Range:** Planning view shows a configurable number of weeks (4, 8, or 12 via span selector). If `span` is omitted in the URL, the server default is **12** weeks. No fiscal or custom week calendars.
- **This week button:** Snaps the view to the current ISO week.

## Data lifecycle

- **Projects and resources:** **Soft delete via archiving.** Archiving sets the status to `ARCHIVED`, hiding the item from active views and the planning grid. Archived items can be restored at any time. Permanent deletion is only available on archived items and removes the entity and all its bookings (DB cascade).
- **Bookings:** **Hard delete** only. No archive. Deleting an allocation (clearing or zeroing the cell) removes the booking permanently.

## Security and access (v1)

- **No authentication** — The app does not implement login or sessions.
- **No permissions** — No roles, no per-user or per-entity access control. Anyone with access to the app can change any data.
- **Internal use** — Access control is assumed to be handled outside the app (e.g. network, VPN, deployment environment).

## UI and scope

- **MVP scope** — Projects, resources, bookings, weekly planning view, CSV import, and in-app help. No timesheets, approvals, reporting, notifications, or integrations.
- **Single user / small team** — No real-time collaboration or conflict handling; last write wins.
- **Dark-first theme** — Custom design system using CSS custom properties. Optimized for dark backgrounds.
- **Accessibility** — Focus trapping in modals, ARIA attributes, keyboard navigation for allocation cells.
