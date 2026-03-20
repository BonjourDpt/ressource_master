/** Planning matrix: sticky label columns + week grid. Keep in sync with colgroup (w-40 + w-44). */

const pad = "px-3 py-2";
const labelBg = "bg-[var(--rm-surface)]";
const lineR = "border-r border-[var(--rm-border-subtle)]";
const lineB = "border-b border-[var(--rm-border-subtle)]";

export const stickyHeadFirst = `sticky left-0 top-0 z-[31] w-40 min-w-[160px] ${lineR} ${lineB} ${labelBg} ${pad} text-left align-middle text-xs font-medium text-[var(--rm-muted)]`;

export const stickyHeadSecond = `sticky left-40 top-0 z-[30] w-44 min-w-[176px] ${lineR} ${lineB} ${labelBg} ${pad} text-left align-middle text-xs font-medium text-[var(--rm-muted)]`;

export const stickyBodyFirst = `sticky left-0 z-[21] w-40 min-w-[160px] ${lineR} ${labelBg} align-middle ${pad}`;

export const stickyBodySecond = `sticky left-40 z-[20] w-44 min-w-[176px] ${lineR} ${labelBg} align-middle ${pad}`;

export const weekHeadCell = `sticky top-0 z-10 min-w-[88px] ${lineB} ${labelBg} px-2 py-2 text-center align-middle text-xs font-medium tabular-nums text-[var(--rm-muted)]`;

export const weekBodyCell =
  "bg-[var(--rm-bg)] px-2 py-2 align-middle transition-colors hover:bg-[var(--rm-surface)]";
