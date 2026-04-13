# Future improvements

Structured list of possible next steps. Kept realistic and aligned with an internal MVP — not an enterprise roadmap.

Items marked ~~strikethrough~~ have been implemented.

---

## Product features

- **Authentication** — Simple login (e.g. NextAuth with one provider) so the app is not fully open.
- **Read-only or basic roles** — Optional "viewer" vs "editor" to limit who can change bookings.
- ~~**Search / filter on planning**~~ — ✅ Team filter on planning grid; search and status/team filters on project and resource list pages.
- **Export** — CSV (or similar) of projects, resources, or bookings for the visible range (backup or reporting).
- ~~**Soft delete / archive**~~ — ✅ Archive and restore for projects and resources. Permanent delete only available on archived items.
- ~~**Notes on bookings**~~ — ✅ Optional notes per allocation cell, with dot indicator and tooltip.

---

## UX improvements

- **Mobile-friendly planning** — Responsive grid or simplified week/resource picker for small screens.
- ~~**Keyboard shortcuts**~~ — ✅ Enter/Escape/Tab/Shift+Tab for allocation cells; Enter for note save; Escape to close modals; Ctrl/⌘+Z and Ctrl/⌘+Y (or Shift+Z) for planning undo/redo when not focused in a field.
- **Bulk actions** — Copy a week's bookings to the next week; duplicate a resource's week.
- ~~**Clearer over-allocation**~~ — ✅ Orange/red indicators for over-allocation in resource view.
- ~~**Default week range**~~ — ✅ This week button snaps to current week; span selector (4/8/12) in URL.
- ~~**Toast notifications**~~ — ✅ Replaced alert()/confirm() with Sonner toasts and custom confirmation dialogs.
- ~~**Empty states**~~ — ✅ Engaging empty state cards with icons and call-to-action links.
- ~~**In-app help**~~ — ✅ Cheatsheet accessible via ? button in header, rendered as a portal overlay.

---

## Technical improvements

- **Tests** — Unit tests for week utilities and validation; a few integration tests for critical flows (e.g. create booking, delete project).
- ~~**Error handling**~~ — ✅ Toasts for failed mutations; custom ConfirmDialog for destructive actions.
- **Loading states** — Skeleton or spinner for planning data when changing week or view.
- **Validation feedback** — Inline errors on the booking form (partially present); ensure all server validation errors surface clearly.
- **Prisma** — Consider moving seed config to `prisma.config.ts` when upgrading to Prisma 7+.
- ~~**Modal accessibility**~~ — ✅ Focus trapping via focus-trap-react, ARIA attributes, Escape key handling.

---

## Scaling considerations

- **Larger datasets** — If projects/resources grow a lot: paginate or virtualize the planning grid rows; keep week range bounded.
- **Concurrent edits** — If multiple people edit at once: optional optimistic updates and clear "last updated" or conflict messaging; no need for full CRDTs for MVP.
- **Deployment** — Document or automate deploy to a single internal host (e.g. Vercel, Docker, or internal VM) with env-based `DATABASE_URL`.
- **Backups** — Rely on managed Postgres backups; optional: scheduled export job for bookings.

---

**Priority suggestion:** Auth (if the app becomes shared), then export, then mobile-friendly planning and bulk actions. The core UX workflow is now stable.
