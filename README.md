# Resource Master

Internal web app to visualize and manage resource allocation across projects on a weekly basis.

## Overview

Resource Master answers a simple question: **who is on what project, and when?** It provides a weekly timeline (by project or by resource), CRUD for projects, resources, and bookings, and a minimalist UI suited for internal planning.

**Why it exists:** Lightweight alternative to heavy PPM tools for teams that need quick visibility and editing of who is assigned to which project each week—without timesheets, approvals, or permissions.

## Key features

- **Projects** — Create, edit, delete projects (name, optional client, color from a fixed palette).
- **Resources** — Create, edit, delete resources (name, optional role and team).
- **Bookings** — Assign a resource to a project for a given week with an allocation percentage (1–100%); create, edit, and delete inline from the planning grid.
- **Planning view** — Weekly grid with toggle: *By project* (rows = projects) or *By resource* (rows = resources). Week navigation and URL-based state.
- **No auth (v1)** — No login or permissions; internal use only.
- **Minimalist UI** — Clean layout, subtle borders, iOS-inspired styling, no clutter.

## Tech stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4, custom components (no component library)
- **Data:** Prisma ORM, PostgreSQL
- **Validation:** Zod
- **Date logic:** Custom ISO-week utilities (`lib/weeks.ts`)

## Screens and main concepts

| Screen | Purpose |
|--------|--------|
| **Planning** | Weekly timeline grid. Rows = projects or resources (toggle); columns = weeks. Each cell shows bookings (name + %). Click a chip to edit, click "+" to add. Side panel for create/edit/delete. |
| **Projects** | List of projects with name, client, color. New / Edit (modal), Delete with confirmation. |
| **Resources** | List of resources with name, role, team. New / Edit (modal), Delete with confirmation. |

**Concepts:** A **booking** is a single assignment: one resource, one project, one week, one allocation percentage. One resource can have multiple bookings in the same week (e.g. 60% Project A, 50% Project B); over 100% is allowed but shown in the resource view.

## Quick start

1. See **[docs/SETUP.md](docs/SETUP.md)** for prerequisites, env, database, and running the app.
2. After setup: `npm run dev` → open [http://localhost:3000](http://localhost:3000). Root redirects to `/planning`.

## Project philosophy

- **MVP first** — Only what’s needed for internal planning; no enterprise scope.
- **Simplicity** — Straightforward patterns, minimal abstractions, easy to change.
- **Internal tool** — No auth or permissions in v1; trust and access controlled outside the app.
