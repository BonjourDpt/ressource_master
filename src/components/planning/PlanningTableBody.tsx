"use client";

import { useMemo, type Dispatch, type SetStateAction } from "react";
import { Select } from "@/components/ui/Select";
import { cx } from "@/lib/cx";
import { formatWeekLabel, toWeekStartKey } from "@/lib/weeks";
import { formatAllocationPercent } from "@/lib/planning-format";
import type { BookingHistoryCommitEvent } from "@/lib/planning-booking-history";
import type {
  PlanningEditingCell,
  PlanningMatrixGroup,
  ProjectModel,
  ResourceModel,
} from "@/lib/planning-view-model";
import { AllocationCell } from "./AllocationCell";
import { stickyBodyFirst, stickyBodySecond, weekBodyCell, weekBodyCellCurrent } from "./planningStickyClasses";
import { TotalPctPill } from "./TotalPctPill";
import { isResourceRowSelectable } from "@/lib/planning-resource-selection";

type Overload = { wk: string; label: string; pct: number };

function OverloadHint({ items }: { items: Overload[] }) {
  if (items.length === 0) return null;
  return (
    <div className="text-[10px] leading-relaxed text-[var(--rm-warning)]">
      {items.map((o, idx) => (
        <span key={o.wk}>
          {idx > 0 ? ", " : null}
          {o.label}: <span className="font-mono">{formatAllocationPercent(o.pct)}</span>
        </span>
      ))}
    </div>
  );
}

function SecondaryCellContent({
  label,
  muted,
  dotColor,
}: {
  label: string;
  muted: boolean;
  dotColor?: string | null;
}) {
  if (muted) {
    return <span className="text-xs text-[var(--rm-muted-subtle)]">{label}</span>;
  }
  return (
    <span className="flex items-center gap-2 text-xs text-[var(--rm-muted)]">
      {dotColor ? (
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
          aria-hidden
        />
      ) : null}
      {label}
    </span>
  );
}

const rowLine = "border-b border-[var(--rm-border-subtle)]/60";
const addRowLine = `${rowLine} h-8 [&>td]:py-1 [&>td]:align-middle`;

/** Matches DataTableRow selection affordance for By project rows. */
const projectRowTrInteractive =
  "group cursor-pointer border-l-2 border-[var(--rm-border-subtle)]/60 border-l-transparent transition-colors";
const projectRowTrSelected = "border-l-[var(--rm-primary)]/35";
const projectRowTdSelected = "!bg-[var(--rm-primary)]/6 hover:!bg-[var(--rm-primary)]/10";
const projectRowStickyTdHover = "group-hover:!bg-[var(--rm-surface-elevated)]/50";
const projectRowWeekTdHover = "group-hover:!bg-[var(--rm-surface)]/50";

export interface PlanningTableBodyProps {
  groups: PlanningMatrixGroup[];
  weekRange: Date[];
  resWeekTotals: Map<string, number>;
  projects: ProjectModel[];
  resources: ResourceModel[];
  editingCell: PlanningEditingCell;
  onEditingCellChange: Dispatch<SetStateAction<PlanningEditingCell>>;
  onTabNavigate: (rowId: string, weekId: string, delta: number) => void;
  onAddAllocationRow: (groupId: string) => void;
  onDraftPairChange: (draftRowId: string, pairedEntityId: string) => void;
  selectedProjectId: string | null;
  onToggleProjectSelection: (projectId: string) => void;
  selectedResourceRowId: string | null;
  onToggleResourceRowSelection: (rowId: string) => void;
  onBookingHistoryCommit?: (ev: BookingHistoryCommitEvent) => void;
  currentWeekKey?: string;
}

export function PlanningTableBody({
  groups,
  weekRange,
  resWeekTotals,
  projects,
  resources,
  editingCell,
  onEditingCellChange,
  onTabNavigate,
  onAddAllocationRow,
  onDraftPairChange,
  selectedProjectId,
  onToggleProjectSelection,
  selectedResourceRowId,
  onToggleResourceRowSelection,
  onBookingHistoryCommit,
  currentWeekKey,
}: PlanningTableBodyProps) {
  const resourcePairOptions = useMemo(
    () => [
      { value: "", label: "Resource…" },
      ...resources.map((r) => ({ value: r.id, label: r.name })),
    ],
    [resources],
  );
  const projectPairOptions = useMemo(
    () => [
      { value: "", label: "Project…" },
      ...projects.map((p) => ({ value: p.id, label: p.name })),
    ],
    [projects],
  );

  return (
    <>
      {groups.map((g, groupIndex) => {
        const groupTop = groupIndex > 0 ? "border-t-2 border-[var(--rm-border)]/30" : "";
        const rowSpan = g.rows.length;

        const overloads: Overload[] =
          g.mode === "resource"
            ? weekRange
                .map((w) => {
                  const wk = toWeekStartKey(w);
                  const t = resWeekTotals.get(`${g.groupId}:${wk}`) ?? 0;
                  if (t <= 100) return null;
                  return { wk, label: formatWeekLabel(w), pct: t };
                })
                .filter((v): v is Overload => v !== null)
            : [];

        const resourceTitleBlock =
          g.mode === "resource" ? (
            <div className="flex flex-col gap-0.5 py-0.5">
              <span className="text-[13px] font-semibold leading-snug text-[var(--rm-fg)]">{g.groupLabel}</span>
              <OverloadHint items={overloads} />
            </div>
          ) : null;

        const projectRowSelectable = g.mode === "project";
        const resourceRowMode = g.mode === "resource";

        return (
          <tbody key={g.groupId} data-planning-group={g.groupId}>
            {g.rows.map((row, rowIndex) => {
              const isFirstInGroup = rowIndex === 0;
              const rowSelected = projectRowSelectable && selectedProjectId === g.groupId;
              const resourceRowSelectable = resourceRowMode && isResourceRowSelectable(row);
              const resourceRowSelected = resourceRowSelectable && selectedResourceRowId === row.id;
              const baseTr =
                row.rowType === "add"
                  ? `${addRowLine} ${isFirstInGroup ? groupTop : ""}`.trim()
                  : `${rowLine} ${isFirstInGroup ? groupTop : ""}`.trim();
              const trClass = cx(
                baseTr,
                projectRowSelectable && projectRowTrInteractive,
                rowSelected && projectRowTrSelected,
                resourceRowSelectable && projectRowTrInteractive,
                resourceRowSelected && projectRowTrSelected,
              );

              const stickyFirstTd = cx(
                stickyBodyFirst,
                projectRowSelectable && rowSelected && projectRowTdSelected,
                projectRowSelectable && !rowSelected && projectRowStickyTdHover,
                resourceRowSelectable && resourceRowSelected && projectRowTdSelected,
                resourceRowSelectable && !resourceRowSelected && projectRowStickyTdHover,
              );
              const stickySecondTd = cx(
                stickyBodySecond,
                projectRowSelectable && rowSelected && projectRowTdSelected,
                projectRowSelectable && !rowSelected && projectRowStickyTdHover,
                resourceRowSelectable && resourceRowSelected && projectRowTdSelected,
                resourceRowSelectable && !resourceRowSelected && projectRowStickyTdHover,
              );
              const weekTdForKey = (wk: string) =>
                cx(
                  weekBodyCell,
                  currentWeekKey && wk === currentWeekKey && weekBodyCellCurrent,
                  projectRowSelectable && rowSelected && projectRowTdSelected,
                  projectRowSelectable && !rowSelected && projectRowWeekTdHover,
                  resourceRowSelectable && resourceRowSelected && projectRowTdSelected,
                  resourceRowSelectable && !resourceRowSelected && projectRowWeekTdHover,
                );
              const addRowWeekTdForKey = (wk: string) =>
                cx(
                  weekBodyCell,
                  "bg-[var(--rm-bg)]",
                  currentWeekKey && wk === currentWeekKey && weekBodyCellCurrent,
                  projectRowSelectable && rowSelected && projectRowTdSelected,
                  projectRowSelectable && !rowSelected && projectRowWeekTdHover,
                );

              const pairingIncomplete =
                row.rowType === "allocation" && (!row.projectId || !row.resourceId);

              const secondaryCell =
                row.rowType === "add" ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddAllocationRow(g.groupId);
                    }}
                    className="text-left text-[11px] font-medium text-[var(--rm-muted-subtle)] transition-colors hover:text-[var(--rm-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rm-primary)]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rm-bg)]"
                  >
                    {g.mode === "project" ? "+ Add resource" : "+ Add project"}
                  </button>
                ) : row.rowType === "summary" ? (
                  <span className="text-xs font-medium text-[var(--rm-muted)]">Total</span>
                ) : pairingIncomplete ? (
                  <div
                    className="min-w-0 max-w-[11rem]"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {g.mode === "project" ? (
                      <Select
                        options={resourcePairOptions}
                        value={row.resourceId ?? ""}
                        onChange={(v) => {
                          if (v) onDraftPairChange(row.id, v);
                        }}
                        size="compact"
                        placeholder="Resource…"
                        aria-label="Resource for new row"
                      />
                    ) : (
                      <Select
                        options={projectPairOptions}
                        value={row.projectId ?? ""}
                        onChange={(v) => {
                          if (v) onDraftPairChange(row.id, v);
                        }}
                        size="compact"
                        placeholder="Project…"
                        aria-label="Project for new row"
                      />
                    )}
                  </div>
                ) : (
                  <SecondaryCellContent
                    label={row.secondaryLabel}
                    muted={false}
                    dotColor={g.mode === "resource" ? row.secondaryColor : null}
                  />
                );

              return (
                <tr
                  key={row.id}
                  className={trClass}
                  data-row-type={row.rowType}
                  {...(projectRowSelectable
                    ? {
                        "aria-selected": rowSelected,
                        onClick: () => onToggleProjectSelection(g.groupId),
                      }
                    : resourceRowSelectable
                      ? {
                          "aria-selected": resourceRowSelected,
                          onClick: () => onToggleResourceRowSelection(row.id),
                        }
                      : {})}
                >
                  {isFirstInGroup && (
                    <td className={stickyFirstTd} rowSpan={rowSpan}>
                      {g.mode === "project" ? (
                        <div className="flex flex-col gap-0.5 py-0.5">
                          <div className="flex items-center gap-2.5">
                            {g.groupColor ? (
                              <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: g.groupColor }}
                                aria-hidden
                              />
                            ) : null}
                            <span className="text-[13px] font-semibold leading-snug text-[var(--rm-fg)]">
                              {g.groupLabel}
                            </span>
                          </div>
                        </div>
                      ) : (
                        resourceTitleBlock
                      )}
                    </td>
                  )}
                  <td className={stickySecondTd}>{secondaryCell}</td>
                  {row.rowType === "allocation" &&
                    row.weeks.map((cell) => (
                      <td key={cell.weekStart} className={weekTdForKey(cell.weekStart)}>
                        <AllocationCell
                          g={g}
                          row={row}
                          cell={cell}
                          editingCell={editingCell}
                          onEditingCellChange={onEditingCellChange}
                          onTabNavigate={onTabNavigate}
                          onBookingHistoryCommit={onBookingHistoryCommit}
                        />
                      </td>
                    ))}
                  {row.rowType === "add" &&
                    weekRange.map((w) => {
                      const wk = toWeekStartKey(w);
                      return (
                        <td key={wk} className={addRowWeekTdForKey(wk)} aria-hidden />
                      );
                    })}
                  {row.rowType === "summary" &&
                    weekRange.map((w) => {
                      const wk = toWeekStartKey(w);
                      const total = resWeekTotals.get(`${g.groupId}:${wk}`) ?? 0;
                      return (
                        <td key={wk} className={weekTdForKey(wk)}>
                          <div className="flex min-h-9 items-center justify-center">
                            <TotalPctPill pct={total} />
                          </div>
                        </td>
                      );
                    })}
                </tr>
              );
            })}
          </tbody>
        );
      })}
    </>
  );
}
