"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import FocusTrap from "focus-trap-react";
import { Button } from "@/components/ui/Button";

const kbd = "rounded border border-[var(--rm-border)] bg-[var(--rm-surface)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--rm-fg)]";
const th = "pb-2 pr-4 text-left text-xs font-medium text-[var(--rm-muted)]";
const td = "pb-2 pr-4 text-sm text-[var(--rm-fg)]";
const tdMuted = "pb-2 pr-4 text-sm text-[var(--rm-muted)]";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-[var(--rm-fg)]">{title}</h3>
      {children}
    </section>
  );
}

function HelpContent() {
  return (
    <div className="space-y-8 text-sm leading-relaxed">
      <Section title="Quick Start">
        <ol className="list-inside list-decimal space-y-1.5 text-[var(--rm-muted)]">
          <li>Go to <strong className="text-[var(--rm-fg)]">Projects</strong> → <strong className="text-[var(--rm-fg)]">New project</strong> → give it a name and a color.</li>
          <li>Go to <strong className="text-[var(--rm-fg)]">Resources</strong> → <strong className="text-[var(--rm-fg)]">New resource</strong> → enter name, role, team, and capacity.</li>
          <li>Go to <strong className="text-[var(--rm-fg)]">Planning</strong> → click <strong className="text-[var(--rm-fg)]">+ Add resource</strong> inside a project → pick a person → click a week cell → type a % → press <kbd className={kbd}>Enter</kbd>.</li>
        </ol>
      </Section>

      <Section title="Projects & Resources">
        <table>
          <tbody>
            <tr><td className={td}><strong>Create</strong></td><td className={tdMuted}>New project / New resource button on each page.</td></tr>
            <tr><td className={td}><strong>Edit</strong></td><td className={tdMuted}>Click Edit on a row → update fields → Save.</td></tr>
            <tr><td className={td}><strong>Archive</strong></td><td className={tdMuted}>Click Archive → confirm. Hidden from planning, restorable.</td></tr>
            <tr><td className={td}><strong>Restore</strong></td><td className={tdMuted}>Switch to the Archived tab → click Restore.</td></tr>
            <tr><td className={td}><strong>Delete</strong></td><td className={tdMuted}>Only on archived items. Permanent, removes all allocations.</td></tr>
            <tr><td className={td}><strong>Search</strong></td><td className={tdMuted}>Filters by name, client, role, or team.</td></tr>
            <tr><td className={td}><strong>Filter</strong></td><td className={tdMuted}>Tabs: Active · Archived · All. Resources also filter by team.</td></tr>
          </tbody>
        </table>
      </Section>

      <Section title="Planning Grid">
        <table>
          <tbody>
            <tr><td className={td}><strong>Edit a cell</strong></td><td className={tdMuted}>Click the % button (or + on empty cells). Type 1–100.</td></tr>
            <tr><td className={td}><strong>Delete allocation</strong></td><td className={tdMuted}>Edit the cell → clear the value → Enter.</td></tr>
            <tr><td className={td}><strong>Add a row</strong></td><td className={tdMuted}>Click + Add resource / + Add project inside a group.</td></tr>
            <tr><td className={td}><strong>Add a group</strong></td><td className={tdMuted}>Use the + Add allocation dropdown at the bottom.</td></tr>
            <tr><td className={td}><strong>Notes</strong></td><td className={tdMuted}>In edit mode, click Add note. Dot indicator when a note exists.</td></tr>
          </tbody>
        </table>
      </Section>

      <Section title="Navigation">
        <table>
          <tbody>
            <tr><td className={td}><strong>By project / By resource</strong></td><td className={tdMuted}>Toggle how the grid is grouped.</td></tr>
            <tr><td className={td}><strong>« / »</strong></td><td className={tdMuted}>Shift 1 week.</td></tr>
            <tr><td className={td}><strong>«« / »»</strong></td><td className={tdMuted}>Jump by the full span.</td></tr>
            <tr><td className={td}><strong>Today</strong></td><td className={tdMuted}>Snap to the current week.</td></tr>
            <tr><td className={td}><strong>4w · 8w · 12w</strong></td><td className={tdMuted}>Set visible weeks.</td></tr>
            <tr><td className={td}><strong>Team filter</strong></td><td className={tdMuted}>Filter resources by team.</td></tr>
          </tbody>
        </table>
      </Section>

      <Section title="Keyboard Shortcuts">
        <table>
          <thead>
            <tr><th className={th}>Key</th><th className={th}>In allocation cell</th></tr>
          </thead>
          <tbody>
            <tr><td className={td}><kbd className={kbd}>Enter</kbd></td><td className={tdMuted}>Save and close.</td></tr>
            <tr><td className={td}><kbd className={kbd}>Esc</kbd></td><td className={tdMuted}>Cancel and close.</td></tr>
            <tr><td className={td}><kbd className={kbd}>Tab</kbd></td><td className={tdMuted}>Save, move to next cell.</td></tr>
            <tr><td className={td}><kbd className={kbd}>Shift</kbd>+<kbd className={kbd}>Tab</kbd></td><td className={tdMuted}>Save, move to previous cell.</td></tr>
          </tbody>
        </table>
        <table className="mt-3">
          <thead>
            <tr><th className={th}>Key</th><th className={th}>In note textarea</th></tr>
          </thead>
          <tbody>
            <tr><td className={td}><kbd className={kbd}>Enter</kbd></td><td className={tdMuted}>Save note + allocation.</td></tr>
            <tr><td className={td}><kbd className={kbd}>Shift</kbd>+<kbd className={kbd}>Enter</kbd></td><td className={tdMuted}>New line.</td></tr>
            <tr><td className={td}><kbd className={kbd}>Esc</kbd></td><td className={tdMuted}>Close note, focus % input.</td></tr>
          </tbody>
        </table>
        <p className="mt-2 text-xs text-[var(--rm-muted-subtle)]"><kbd className={kbd}>Esc</kbd> also closes any modal or dialog.</p>
      </Section>

      <Section title="Visual Indicators">
        <table>
          <tbody>
            <tr><td className={td}>Colored dot</td><td className={tdMuted}>Project color (by name).</td></tr>
            <tr><td className={td}>Left stripe on cell</td><td className={tdMuted}>Project color in by-resource view.</td></tr>
            <tr><td className={td}>Corner fold (top-right)</td><td className={tdMuted}>Cell has a note — hover to read.</td></tr>
            <tr><td className={td}>Orange text / pill</td><td className={tdMuted}>Resource over-allocated (&gt; 100%).</td></tr>
            <tr><td className={td}>Archived badge</td><td className={tdMuted}>Item hidden from planning.</td></tr>
          </tbody>
        </table>
      </Section>

      <Section title="Shareable URLs">
        <p className="text-[var(--rm-muted)]">
          The planning page encodes its state in the URL. Copy it to share an exact view.
        </p>
        <table>
          <tbody>
            <tr><td className={td}><code className="text-xs">view</code></td><td className={tdMuted}><code className="text-xs">project</code> or <code className="text-xs">resource</code></td></tr>
            <tr><td className={td}><code className="text-xs">span</code></td><td className={tdMuted}><code className="text-xs">4</code>, <code className="text-xs">8</code>, or <code className="text-xs">12</code></td></tr>
            <tr><td className={td}><code className="text-xs">weekStart</code></td><td className={tdMuted}>ISO Monday date, e.g. <code className="text-xs">2026-03-23</code></td></tr>
            <tr><td className={td}><code className="text-xs">team</code></td><td className={tdMuted}>Team name, e.g. <code className="text-xs">Engineering</code></td></tr>
          </tbody>
        </table>
      </Section>

      <Section title="CSV Import (Admin)">
        <ol className="list-inside list-decimal space-y-1 text-[var(--rm-muted)]">
          <li><strong className="text-[var(--rm-fg)]">Upload</strong> — Choose Resources or Projects, drop a CSV/TSV file.</li>
          <li><strong className="text-[var(--rm-fg)]">Map columns</strong> — Auto-mapped; adjust if needed. Name must be mapped.</li>
          <li><strong className="text-[var(--rm-fg)]">Preview & Import</strong> — Review New/Update/Duplicate rows, then import.</li>
        </ol>
        <p className="mt-1 text-xs text-[var(--rm-muted-subtle)]">Records are matched by name — existing ones are updated, not duplicated.</p>
      </Section>
    </div>
  );
}

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--rm-border)] text-xs font-medium text-[var(--rm-muted)] transition-colors hover:border-[var(--rm-muted)] hover:text-[var(--rm-fg)]"
        aria-label="Help & shortcuts"
        title="Help & shortcuts"
      >
        ?
      </button>

      {open && createPortal(
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center"
          onClick={(e) => e.target === overlayRef.current && close()}
        >
          <div className="absolute inset-0 bg-black/60" onClick={close} />
          <FocusTrap
            focusTrapOptions={{
              escapeDeactivates: false,
              allowOutsideClick: true,
              fallbackFocus: () => panelRef.current!,
            }}
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className="relative my-8 w-full max-w-2xl rounded-2xl border border-[var(--rm-border)] bg-[var(--rm-surface-elevated)] shadow-xl outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-[var(--rm-border-subtle)] bg-[var(--rm-surface-elevated)] px-6 py-4">
                <h2 id={titleId} className="text-base font-semibold tracking-tight text-[var(--rm-fg)]">
                  Help — Resource Master
                </h2>
                <Button variant="ghost" type="button" onClick={close} aria-label="Close">
                  ×
                </Button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                <HelpContent />
              </div>
            </div>
          </FocusTrap>
        </div>,
        document.body,
      )}
    </>
  );
}
