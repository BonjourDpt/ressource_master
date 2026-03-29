"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import FocusTrap from "focus-trap-react";
import { SegmentedTabs, type SegmentedTab } from "@/components/ui/SegmentedTabs";
import { APP_VERSION_LABEL } from "@/lib/app-version";

type HelpTab = "start" | "planning" | "shortcuts" | "reference";

const HELP_TABS = [
  { value: "start", label: "Start" },
  { value: "planning", label: "Planning" },
  { value: "shortcuts", label: "Shortcuts" },
  { value: "reference", label: "Reference" },
] as const satisfies readonly SegmentedTab<HelpTab>[];

const kbdClass =
  "rounded border border-[var(--rm-border)] bg-[var(--rm-surface-highest)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--rm-fg)]";

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className={kbdClass}>{children}</kbd>;
}

const sub =
  "text-xs font-medium uppercase tracking-wide text-[var(--rm-muted)]";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className={sub}>{title}</h3>
      {children}
    </section>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-l-2 border-[var(--rm-primary)]/40 pl-3 text-sm leading-relaxed text-[var(--rm-muted)]">
      {children}
    </p>
  );
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2 text-sm leading-relaxed text-[var(--rm-muted)]">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--rm-muted-subtle)]" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ShortcutBlock({
  label,
  rows,
}: {
  label: string;
  rows: { keys: React.ReactNode; desc: string }[];
}) {
  return (
    <div className="space-y-2">
      <p className={sub}>{label}</p>
      <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,11rem)_1fr]">
        {rows.map((row, i) => (
          <FragmentRow key={i} keys={row.keys} desc={row.desc} />
        ))}
      </dl>
    </div>
  );
}

function FragmentRow({ keys, desc }: { keys: React.ReactNode; desc: string }) {
  return (
    <>
      <dt className="flex flex-wrap items-center gap-1 text-[var(--rm-fg)]">{keys}</dt>
      <dd className="text-sm text-[var(--rm-muted)]">{desc}</dd>
    </>
  );
}

function TabPanel({
  id,
  labelledBy,
  hidden,
  children,
}: {
  id: string;
  labelledBy: string;
  hidden: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      role="tabpanel"
      aria-labelledby={labelledBy}
      hidden={hidden}
      className="space-y-6 text-sm leading-relaxed"
    >
      {children}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HelpPanels({ tab, idPrefix }: { tab: HelpTab; idPrefix: string }) {
  return (
    <>
      <TabPanel
        id={`${idPrefix}-panel-start`}
        labelledBy={`${idPrefix}-tab-start`}
        hidden={tab !== "start"}
      >
        <Section title="Quick start">
          <ol className="list-inside list-decimal space-y-2.5 pl-0.5 text-[var(--rm-muted)] marker:text-[var(--rm-muted-subtle)]">
            <li>
              <strong className="font-medium text-[var(--rm-fg)]">Projects</strong> →{" "}
              <strong className="font-medium text-[var(--rm-fg)]">New project</strong> — name and color.
            </li>
            <li>
              <strong className="font-medium text-[var(--rm-fg)]">Resources</strong> →{" "}
              <strong className="font-medium text-[var(--rm-fg)]">New resource</strong> — name, role, team, capacity.
            </li>
            <li>
              <strong className="font-medium text-[var(--rm-fg)]">Planning</strong> →{" "}
              <strong className="font-medium text-[var(--rm-fg)]">+ Add resource</strong> in a project → pick someone →
              click a week → enter % → <Kbd>Enter</Kbd>.
            </li>
          </ol>
        </Section>
        <Tip>
          Row shortcuts on Projects and Resources are ignored while search, tabs, buttons, or another dialog is
          focused.
        </Tip>
      </TabPanel>

      <TabPanel
        id={`${idPrefix}-panel-planning`}
        labelledBy={`${idPrefix}-tab-planning`}
        hidden={tab !== "planning"}
      >
        <Section title="Grid actions">
          <BulletList
            items={[
              <>
                Edit: click the <strong className="text-[var(--rm-fg)]">%</strong> (or <strong className="text-[var(--rm-fg)]">+</strong> on empty) → type{" "}
                <strong className="text-[var(--rm-fg)]">1–100</strong> → <Kbd>Enter</Kbd>.
              </>,
              <>Clear allocation: empty the field or type <strong className="text-[var(--rm-fg)]">0</strong> → Enter.</>,
              <>
                Add a row: <strong className="text-[var(--rm-fg)]">+ Add resource</strong> /{" "}
                <strong className="text-[var(--rm-fg)]">+ Add project</strong> inside a group.
              </>,
              <>
                Add a group: <strong className="text-[var(--rm-fg)]">+ Add allocation</strong> at the bottom.
              </>,
              <>
                Notes: in edit mode use <strong className="text-[var(--rm-fg)]">Add note</strong> /{" "}
                <strong className="text-[var(--rm-fg)]">Edit note</strong>. Saved with the cell on <Kbd>Enter</Kbd> or{" "}
                <Kbd>Tab</Kbd> on the % field. Max <strong className="text-[var(--rm-fg)]">200</strong> characters; hover a
                cell with a note to read it.
              </>,
            ]}
          />
        </Section>

        <Section title="Toolbar">
          <BulletList
            items={[
              <>
                <strong className="text-[var(--rm-fg)]">By project</strong> /{" "}
                <strong className="text-[var(--rm-fg)]">By resource</strong> — group the grid.
              </>,
              <>
                <strong className="text-[var(--rm-fg)]">«</strong> / <strong className="text-[var(--rm-fg)]">»</strong> — one
                week; <strong className="text-[var(--rm-fg)]">««</strong> / <strong className="text-[var(--rm-fg)]">»»</strong>{" "}
                — full span.
              </>,
              <>
                <strong className="text-[var(--rm-fg)]">Today</strong> — current week.{" "}
                <strong className="text-[var(--rm-fg)]">4w · 8w · 12w</strong> — visible range.
              </>,
              <>
                <strong className="text-[var(--rm-fg)]">Team</strong> — filter resources (Planning).
              </>,
            ]}
          />
        </Section>

        <Section title="What you see">
          <BulletList
            items={[
              <>Dot / left stripe — project color (name vs by-resource view).</>,
              <>Corner fold — saved note on the cell.</>,
              <>
                Orange / red totals — week over <strong className="text-[var(--rm-fg)]">100%</strong> (warning) or{" "}
                <strong className="text-[var(--rm-fg)]">120%</strong> (stronger).
              </>,
              <>Orange label — resource row over-allocated.</>,
              <>Archived badge or muted row — hidden from planning; restore from the Archived tab.</>,
            ]}
          />
        </Section>
      </TabPanel>

      <TabPanel
        id={`${idPrefix}-panel-shortcuts`}
        labelledBy={`${idPrefix}-tab-shortcuts`}
        hidden={tab !== "shortcuts"}
      >
        <div className="space-y-6">
          <ShortcutBlock
            label="In allocation cell"
            rows={[
              { keys: <Kbd>Enter</Kbd>, desc: "Save and close." },
              { keys: <Kbd>Esc</Kbd>, desc: "Cancel and close." },
              { keys: <Kbd>Tab</Kbd>, desc: "Save, move to next cell." },
              {
                keys: (
                  <>
                    <Kbd>Shift</Kbd>+<Kbd>Tab</Kbd>
                  </>
                ),
                desc: "Save, move to previous cell.",
              },
            ]}
          />
          <ShortcutBlock
            label="In note field"
            rows={[
              { keys: <Kbd>Enter</Kbd>, desc: "Save note and allocation." },
              {
                keys: (
                  <>
                    <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd>
                  </>
                ),
                desc: "New line.",
              },
              { keys: <Kbd>Esc</Kbd>, desc: "Close note, focus % input." },
            ]}
          />
          <ShortcutBlock
            label="Everywhere"
            rows={[
              {
                keys: <Kbd>Esc</Kbd>,
                desc: "Close modals, confirmations, and this help dialog.",
              },
            ]}
          />
        </div>
      </TabPanel>

      <TabPanel
        id={`${idPrefix}-panel-reference`}
        labelledBy={`${idPrefix}-tab-reference`}
        hidden={tab !== "reference"}
      >
        <Section title="Projects & resources">
          <BulletList
            items={[
              <>
                <strong className="text-[var(--rm-fg)]">Create</strong> — New project / New resource on each page.
              </>,
              <>
                <strong className="text-[var(--rm-fg)]">Edit</strong> — Edit button, or select the row and press{" "}
                <Kbd>E</Kbd> (active rows only) → Save.
              </>,
              <>
                <strong className="text-[var(--rm-fg)]">Select row</strong> — click to highlight; <Kbd>Esc</Kbd> clears.
              </>,
              <>
                <strong className="text-[var(--rm-fg)]">Archive</strong> — confirm; hidden from planning, restorable.
              </>,
              <>
                <strong className="text-[var(--rm-fg)]">Restore</strong> — Archived tab → Restore.{" "}
                <strong className="text-[var(--rm-fg)]">Delete</strong> — archived only; permanent.
              </>,
              <>
                <strong className="text-[var(--rm-fg)]">Search</strong> — name, client, role, team.{" "}
                <strong className="text-[var(--rm-fg)]">Tabs</strong> — Active / Archived / All; resources also by team.
              </>,
            ]}
          />
        </Section>
        <Section title="Sharing & admin">
          <BulletList
            items={[
              <>
                Planning view, span, week, and team are reflected in the URL — copy the address bar to share the same
                view.
              </>,
              <>
                Bulk CSV import: <strong className="text-[var(--rm-fg)]">Admin</strong> → follow the import steps there.
              </>,
            ]}
          />
        </Section>
      </TabPanel>
    </>
  );
}

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<HelpTab>("start");
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const tabsIdPrefix = useId().replace(/:/g, "");

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
        onClick={() => {
          setTab("start");
          setOpen(true);
        }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--rm-border)] text-xs font-medium text-[var(--rm-muted)] transition-colors hover:border-[var(--rm-muted)] hover:text-[var(--rm-fg)]"
        aria-label="Help & shortcuts"
        title="Help & shortcuts"
      >
        ?
      </button>

      {open &&
        createPortal(
          <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={(e) => e.target === overlayRef.current && close()}
          >
            <div className="absolute inset-0 bg-black/55" aria-hidden onClick={close} />
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
                className="relative flex max-h-[min(85vh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[var(--rm-border)]/90 bg-[var(--rm-surface)] shadow-[0_4px_24px_rgba(0,0,0,0.22)] outline-none"
                onClick={(e) => e.stopPropagation()}
              >
                <header className="shrink-0 border-b border-[var(--rm-border-subtle)]/70 px-6 pb-4 pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <h2
                      id={titleId}
                      className="text-lg font-semibold leading-snug tracking-tight text-[var(--rm-fg)]"
                    >
                      Help · Resource Master · {APP_VERSION_LABEL}
                    </h2>
                    <button
                      type="button"
                      onClick={close}
                      aria-label="Close"
                      className="shrink-0 rounded-md p-1.5 text-[var(--rm-muted)] transition-colors hover:bg-[var(--rm-surface-elevated)] hover:text-[var(--rm-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rm-primary)]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rm-surface)]"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                </header>
                <div className="shrink-0 border-b border-[var(--rm-border-subtle)]/70 px-6 py-3">
                  <SegmentedTabs
                    tabs={HELP_TABS}
                    value={tab}
                    onChange={setTab}
                    ariaLabel="Help sections"
                    idPrefix={tabsIdPrefix}
                  />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <HelpPanels tab={tab} idPrefix={tabsIdPrefix} />
                </div>
              </div>
            </FocusTrap>
          </div>,
          document.body,
        )}
    </>
  );
}
