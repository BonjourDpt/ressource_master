"use client";

import type { Dispatch, SetStateAction } from "react";
import { formatWeekLabel, toWeekStartKey } from "@/lib/weeks";
import { formatAllocationPercent } from "@/lib/planning-format";
import type {
  PlanningEditingCell,
  PlanningMatrixGroup,
  ProjectModel,
  ResourceModel,
} from "@/lib/planning-view-model";
import { AllocationCell } from "./AllocationCell";
import { stickyBodyFirst, stickyBodySecond, weekBodyCell } from "./planningStickyClasses";
import { TotalPctPill } from "./TotalPctPill";

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
}: PlanningTableBodyProps) {
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

        return (
          <tbody key={g.groupId} data-planning-group={g.groupId}>
            {g.rows.map((row, rowIndex) => {
              const isFirstInGroup = rowIndex === 0;
              const trClass =
                row.rowType === "add"
                  ? `${addRowLine} ${isFirstInGroup ? groupTop : ""}`.trim()
                  : `${rowLine} ${isFirstInGroup ? groupTop : ""}`.trim();

              const pairingIncomplete =
                row.rowType === "allocation" && (!row.projectId || !row.resourceId);

              const secondaryCell =
                row.rowType === "add" ? (
                  <button
                    type="button"
                    onClick={() => onAddAllocationRow(g.groupId)}
                    className="text-left text-[11px] font-medium text-[var(--rm-muted-subtle)] transition-colors hover:text-[var(--rm-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rm-primary)]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rm-bg)]"
                  >
                    {g.mode === "project" ? "+ Add resource" : "+ Add project"}
                  </button>
                ) : row.rowType === "summary" ? (
                  <span className="text-xs font-medium text-[var(--rm-muted)]">Total</span>
                ) : pairingIncomplete ? (
                  <div className="min-w-0">
                    {g.mode === "project" ? (
                      <select
                        value={row.resourceId ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v) onDraftPairChange(row.id, v);
                        }}
                        className="max-w-full rounded border border-[var(--rm-border-subtle)] bg-[var(--rm-surface)] px-1.5 py-1 text-xs text-[var(--rm-fg)] focus:border-[var(--rm-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--rm-primary)]/35"
                        aria-label="Resource for new row"
                      >
                        <option value="">Resource…</option>
                        {resources.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={row.projectId ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v) onDraftPairChange(row.id, v);
                        }}
                        className="max-w-full rounded border border-[var(--rm-border-subtle)] bg-[var(--rm-surface)] px-1.5 py-1 text-xs text-[var(--rm-fg)] focus:border-[var(--rm-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--rm-primary)]/35"
                        aria-label="Project for new row"
                      >
                        <option value="">Project…</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
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
                <tr key={row.id} className={trClass} data-row-type={row.rowType}>
                  {isFirstInGroup && (
                    <td className={stickyBodyFirst} rowSpan={rowSpan}>
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
                  <td className={stickyBodySecond}>{secondaryCell}</td>
                  {row.rowType === "allocation" &&
                    row.weeks.map((cell) => (
                      <td key={cell.weekStart} className={weekBodyCell}>
                        <AllocationCell
                          g={g}
                          row={row}
                          cell={cell}
                          editingCell={editingCell}
                          onEditingCellChange={onEditingCellChange}
                          onTabNavigate={onTabNavigate}
                        />
                      </td>
                    ))}
                  {row.rowType === "add" &&
                    weekRange.map((w) => {
                      const wk = toWeekStartKey(w);
                      return (
                        <td key={wk} className={`${weekBodyCell} bg-[var(--rm-bg)]`} aria-hidden />
                      );
                    })}
                  {row.rowType === "summary" &&
                    weekRange.map((w) => {
                      const wk = toWeekStartKey(w);
                      const total = resWeekTotals.get(`${g.groupId}:${wk}`) ?? 0;
                      return (
                        <td key={wk} className={weekBodyCell}>
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
