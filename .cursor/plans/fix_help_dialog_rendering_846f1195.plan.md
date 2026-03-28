---
name: Fix Help Dialog Rendering
overview: Fix the help dialog rendering by using a React portal so the modal escapes the header's stacking context and renders at the document body level.
todos:
  - id: portal-fix
    content: Wrap help dialog modal in createPortal to render at document.body
    status: completed
isProject: false
---

# Fix Help Dialog Rendering

## Problem

In [src/components/app-shell/HelpDialog.tsx](src/components/app-shell/HelpDialog.tsx), the `HelpButton` component returns a fragment containing both the `?` button and the full modal overlay as siblings. Since `HelpButton` is placed inside the `<header>` in [AppHeader.tsx](src/components/app-shell/AppHeader.tsx) (line 51), the modal inherits the header's CSS stacking context (`sticky top-0 z-50`, fixed `h-14`), causing the dialog to render clipped inside the header area.

## Fix

Use `createPortal` from `react-dom` to render the modal overlay at `document.body`, while keeping the `?` button inline in the header.

**Single file change** in [src/components/app-shell/HelpDialog.tsx](src/components/app-shell/HelpDialog.tsx):

- Import `createPortal` from `react-dom`
- Wrap the modal overlay JSX (the `{open && ...}` block, lines 167-205) in `createPortal(..., document.body)`
- The `?` button stays as-is in the header

No changes needed to `AppHeader.tsx`, `AppShell.tsx`, or `layout.tsx`. The `?` button position, the modal content, and all behavior (Escape, backdrop click, focus trap) remain identical.