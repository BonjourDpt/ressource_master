/** Planning matrix: sticky label columns + week grid. Keep in sync with colgroup (w-48 + w-40). */

const padFirst = "px-4 py-2.5";
const padSecond = "px-3 py-2.5";
const stickyBg = "bg-[var(--rm-surface)]";
const lineR = "border-r border-[var(--rm-border)]/30";
const lineB = "border-b border-[var(--rm-border-subtle)]";

export const stickyHeadFirst = `sticky left-0 top-0 z-[31] w-48 min-w-[192px] ${lineR} ${lineB} ${stickyBg} ${padFirst} text-left align-bottom text-[10px] font-semibold uppercase tracking-widest text-[var(--rm-muted-subtle)]`;

export const stickyHeadSecond = `sticky left-48 top-0 z-[30] w-40 min-w-[160px] ${lineR} ${lineB} ${stickyBg} ${padSecond} text-left align-bottom text-[10px] font-semibold uppercase tracking-widest text-[var(--rm-muted-subtle)]`;

export const stickyBodyFirst = `sticky left-0 z-[21] w-48 min-w-[192px] ${lineR} ${stickyBg} align-middle ${padFirst}`;

export const stickyBodySecond = `sticky left-48 z-[20] w-40 min-w-[160px] ${lineR} ${stickyBg} align-middle ${padSecond}`;

export const weekHeadCell = `sticky top-0 z-10 min-w-[80px] ${lineB} ${stickyBg} px-1 py-2.5 text-center align-bottom text-[10px] font-semibold tabular-nums text-[var(--rm-muted-subtle)]`;

export const weekBodyCell =
  "bg-[var(--rm-bg)] border-l border-[var(--rm-border-subtle)]/8 px-1.5 py-1.5 align-middle";

/** Applied on top of weekHeadCell for the current-week column header. */
export const weekHeadCellCurrent = `border-t-2 border-t-[var(--rm-primary)] text-[var(--rm-primary-text)]!`;

/** Applied on top of weekBodyCell for all body cells in the current-week column. */
export const weekBodyCellCurrent = "bg-[var(--rm-primary)]/[0.06]";
