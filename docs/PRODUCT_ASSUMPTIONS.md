# Product assumptions

Explicit assumptions behind the current product design. Revisit when changing behavior or adding features.

## Resources and projects

- **Resource** — A person (or role) that can be assigned to projects. Represented by name and optional role/team. No notion of capacity or availability beyond the sum of booking percentages per week.
- **Project** — A piece of work. Has name, optional client, and a color from a fixed palette (for the planning grid). No status workflow beyond existence.

## Bookings

- **Booking** — One resource assigned to one project for **one week**, with an **allocation percentage** (1–100%).
- **Unit:** Allocation is always a **percentage** of that week (not hours or days). Interpretation is informal (e.g. “60%” = roughly 3 days).
- **Uniqueness:** At most one booking per (resource, project, week). Same resource can have multiple bookings in the same week (different projects).
- **Over-allocation:** A resource can total more than 100% in a week. The app **allows** it and shows a **warning** (e.g. total % in resource view); it does not block saving.

## Time and weeks

- **Week definition:** **ISO week** — week starts on **Monday**. All “week” values are stored as the Monday of that week (normalized, no time component).
- **Range:** Planning view shows a configurable number of weeks (default 8; span 4–12 via URL). No fiscal or custom week calendars.

## Data lifecycle

- **Projects and resources:** **Hard delete.** Deleting a project or resource removes it and all its bookings (DB cascade). There is no archive or soft delete.
- **Bookings:** **Hard delete** only. No archive.

## Security and access (v1)

- **No authentication** — The app does not implement login or sessions.
- **No permissions** — No roles, no per-user or per-entity access control. Anyone with access to the app can change any data.
- **Internal use** — Access control is assumed to be handled outside the app (e.g. network, VPN, deployment environment).

## UI and scope

- **MVP scope** — Only projects, resources, bookings, and the weekly planning view. No timesheets, approvals, reporting, notifications, or integrations.
- **Single user / small team** — No real-time collaboration or conflict handling; last write wins.
