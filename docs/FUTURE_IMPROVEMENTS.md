# Future improvements

Structured list of possible next steps. Kept realistic and aligned with an internal MVP—not an enterprise roadmap.

---

## Product features

- **Authentication** — Simple login (e.g. NextAuth with one provider) so the app is not fully open.
- **Read-only or basic roles** — Optional “viewer” vs “editor” to limit who can change bookings.
- **Search / filter on planning** — Filter grid by project name or resource name; optional search in the nav bar.
- **Export** — CSV (or similar) of projects, resources, or bookings for the visible range (backup or reporting).
- **Unarchive / soft delete (optional)** — If product needs “hide but keep history,” reintroduce archive for projects/resources with a way to unarchive or list archived items.

---

## UX improvements

- **Mobile-friendly planning** — Responsive grid or simplified week/resource picker for small screens.
- **Keyboard shortcuts** — e.g. Escape to close side panel, arrow keys for week navigation.
- **Bulk actions** — Copy a week’s bookings to the next week; duplicate a resource’s week.
- **Clearer over-allocation** — Dedicated indicator or color in resource view when total &gt; 100%.
- **Default week range** — Remember last used span or “current week” preference in URL/localStorage.

---

## Technical improvements

- **Tests** — Unit tests for week utilities and validation; a few integration tests for critical flows (e.g. create booking, delete project).
- **Error handling** — Toasts or inline messages for failed mutations instead of (or in addition to) `alert()`.
- **Loading states** — Skeleton or spinner for planning data when changing week or view.
- **Validation feedback** — Inline errors on the booking form (partially present); ensure all server validation errors surface clearly.
- **Prisma** — Consider moving seed config to `prisma.config.ts` when upgrading to Prisma 7+.

---

## Scaling considerations

- **Larger datasets** — If projects/resources grow a lot: paginate or virtualize the planning grid rows; keep week range bounded.
- **Concurrent edits** — If multiple people edit at once: optional optimistic updates and clear “last updated” or conflict messaging; no need for full CRDTs for MVP.
- **Deployment** — Document or automate deploy to a single internal host (e.g. Vercel, Docker, or internal VM) with env-based `DATABASE_URL`.
- **Backups** — Rely on managed Postgres backups; optional: scheduled export job for bookings.

---

**Priority suggestion:** Auth (if the app becomes shared), then export and search/filter, then UX polish and tests. Avoid adding large features (e.g. full reporting, approvals) until the core workflow is stable and used.
