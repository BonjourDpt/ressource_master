---
name: Add Resource capacity field
overview: Add a required `capacity` (hours/week) column to the `Resource` table in Neon/Postgres (default 37.5 for existing and new rows), and surface it in the Resource create/edit UI and listing.
todos:
  - id: prisma-capacity-field
    content: Add `capacity` field to `Resource` model in `prisma/schema.prisma` with default 37.5 and run Prisma migration + generate.
    status: completed
  - id: update-validation-actions
    content: Update `resourceSchema`/`ResourceFormData` and include `capacity` in create/update server actions.
    status: completed
  - id: update-resources-ui
    content: Add capacity field to `ResourceForm` and show capacity column in `ResourceList`.
    status: completed
  - id: update-shared-types
    content: Extend `ResourceModel` with `capacity` and ensure Planning/Resources pages compile with it.
    status: completed
  - id: verify
    content: Run lint/typecheck on edited files and quick sanity-check flows.
    status: completed
isProject: false
---

## Goal

Add a required `capacity` field to resources, defaulted to **37.5 hours/week** (including for existing rows), and allow users to view/edit it in the Resources UI.

## Database / Prisma changes

- Update Prisma model in `[prisma/schema.prisma](prisma/schema.prisma)`:
  - Add `capacity` as a required number with a default of 37.5 (plan: `Float @default(37.5)`).
- Create and apply a Prisma migration (dev) that:
  - Adds `capacity` to the `Resource` table as `NOT NULL` with default 37.5.
  - Ensures existing rows read as 37.5 automatically (Postgres constant default on add-column backfills existing rows).
- Regenerate Prisma client after migration.

## Server actions / validation

- Update `[src/lib/validations.ts](src/lib/validations.ts)`:
  - Extend `resourceSchema` with `capacity` using `z.coerce.number()` and basic bounds (e.g. `min(0)`), keeping decimals.
  - Update `ResourceFormData` type accordingly.
- Update `[src/app/resources/actions.ts](src/app/resources/actions.ts)`:
  - Include `capacity` on `db.resource.create` and `db.resource.update`.

## UI updates

- Update `[src/components/resources/ResourceForm.tsx](src/components/resources/ResourceForm.tsx)`:
  - Add a `FormField` for capacity (number input), label like “Capacity (h/week)”.
  - Default to 37.5 when creating a new resource; when editing, prefill from the resource.
- Update `[src/components/resources/ResourceList.tsx](src/components/resources/ResourceList.tsx)`:
  - Add a “Capacity” column and show the stored value (e.g. 37.5).

## Types shared with Planning UI

- Update `[src/lib/planning-view-model.ts](src/lib/planning-view-model.ts)`:
  - Add `capacity: number` to `ResourceModel` so the same object works across Resources + Planning pages.
  - No functional change to planning grid logic; only type alignment.

## Verification

- Run typecheck/lint for edited files.
- Sanity-check that:
  - Existing resources display `capacity = 37.5`.
  - Create/update resource persists capacity.
  - Resources page and Planning page still render with updated `ResourceModel`.

