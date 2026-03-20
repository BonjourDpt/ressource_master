"use client";

import { formatWeekLabel, getIsoMonday } from "@/lib/weeks";
import { formatAllocationPercent } from "@/lib/planning-format";
import type {
  PlanningMatrixGroup,
  PlanningWeekCell,
  PlanningMatrixRow,
  ProjectModel,
  ResourceModel,
} from "@/lib/planning-view-model";
import { TotalPctPill } from "./TotalPctPill";
import { EditableAllocationCell } from "./EditableAllocationCell";

function weekKey(d: Date): string {
  return getIsoMonday(d).toISOString().slice(0, 10);
}

function allocationCellKey(
  projectId: string | null,
  resourceId: string | null,
  weekStart: string
): string {
  return `p:${projectId ?? "_"}|r:${resourceId ?? "_"}|w:${weekStart}`;
}

const stickyFirst =
  "sticky left-0 z-[21] w-40 min-w-[160px] max-w-[200px] border-r border-[var(--rm-border)] bg-[var(--rm-surface)] align-middle shadow-[4px_0_12px_-6px_rgba(0,0,0,0.45)]";
const stickySecond =
  "sticky left-40 z-[20] min-w-[132px] w-44 max-w-[200px] border-r border-[var(--rm-border)] bg-[var(--rm-surface)] align-middle shadow-[4px_0_12px_-6px_rgba(0,0,0,0.35)]";

export interface PlanningTableBodyProps {
  groups: PlanningMatrixGroup[];
  weekRange: Date[];
  resWeekTotals: Map<string, number>;
  projects: ProjectModel[];
  resources: ResourceModel[];
  activeCellKey: string | null;
  onActiveCellKeyChange: (key: string | null) => void;
}

function AllocationCell({
  g,
  row,
  cell,
  projects,
  resources,
  activeCellKey,
  onActiveCellKeyChange,
}: {
  g: PlanningMatrixGroup;
  row: PlanningMatrixRow;
  cell: PlanningWeekCell;
  projects: ProjectModel[];
  resources: ResourceModel[];
  activeCellKey: string | null;
  onActiveCellKeyChange: (key: string | null) => void;
}) {
  const projectId = g.mode === "project" ? g.groupId : row.secondaryId;
  const resourceId = g.mode === "resource" ? g.groupId : row.secondaryId;
  const cellKey = allocationCellKey(projectId, resourceId, cell.weekStart);
  const accentColor =
    g.mode === "resource" && row.secondaryId !== null ? row.secondaryColor ?? null : null;

  return (
    <EditableAllocationCell
      cellKey={cellKey}
      weekStart={cell.weekStart}
      booking={cell.booking}
      projectId={projectId}
      resourceId={resourceId}
      projectOptions={projects}
      resourceOptions={resources}
      isEditing={activeCellKey === cellKey}
      onBeginEdit={onActiveCellKeyChange}
      onEndEdit={() => onActiveCellKeyChange(null)}
      accentColor={accentColor}
    />
  );
}

export function PlanningTableBody({
  groups,
  weekRange,
  resWeekTotals,
  projects,
  resources,
  activeCellKey,
  onActiveCellKeyChange,
}: PlanningTableBodyProps) {
  return (
    <>
      {groups.map((g) => {
        if (g.mode !== "resource") {
          return (
            <tbody key={g.groupId} data-planning-group={g.groupId}>
              {g.rows.map((row, rowIndex) => {
                const isLastSubRow = rowIndex === g.rows.length - 1;
                return (
                  <tr
                    key={`${g.groupId}-${rowIndex}`}
                    className={
                      isLastSubRow
                        ? "border-b-2 border-[var(--rm-border)]"
                        : "border-b border-[var(--rm-border-subtle)]"
                    }
                  >
                    {rowIndex === 0 && (
                      <td className={stickyFirst} rowSpan={g.rows.length}>
                        <div className="flex flex-col gap-2 py-2.5 pr-2">
                          <div className="flex items-center gap-2">
                            {g.mode === "project" && g.groupColor && (
                              <span
                                className="inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-[var(--rm-border)] ring-offset-1 ring-offset-[var(--rm-surface)]"
                                style={{ backgroundColor: g.groupColor }}
                              />
                            )}
                            <span className="text-[13px] font-semibold leading-snug tracking-tight text-[var(--rm-fg)]">
                              {g.groupLabel}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className={`${stickySecond} px-3 py-2 align-middle`}>
                      <div
                        className={
                          row.secondaryId === null
                            ? "text-[11px] font-normal text-[var(--rm-muted-subtle)]"
                            : "flex items-center gap-2 text-[12px] font-normal leading-snug text-[var(--rm-muted)]"
                        }
                      >
                        <span>{row.secondaryLabel}</span>
                      </div>
                    </td>
                    {row.weeks.map((cell) => (
                      <td
                        key={cell.weekStart}
                        className="border-r border-[var(--rm-border-subtle)] bg-[var(--rm-bg)]/20 px-2 py-2 align-middle last:border-r-0"
                      >
                        <AllocationCell
                          g={g}
                          row={row}
                          cell={cell}
                          projects={projects}
                          resources={resources}
                          activeCellKey={activeCellKey}
                          onActiveCellKeyChange={onActiveCellKeyChange}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          );
        }

        const hasOpenRow = g.rows.length > 0 && g.rows[g.rows.length - 1].secondaryId === null;
        const openRow = hasOpenRow ? g.rows[g.rows.length - 1] : null;
        const projectRows = hasOpenRow ? g.rows.slice(0, -1) : g.rows;

        const stickyRowSpan = g.rows.length + 1;
        const overloads = weekRange
          .map((w) => {
            const wk = weekKey(w);
            const t = resWeekTotals.get(`${g.groupId}:${wk}`) ?? 0;
            if (t <= 100) return null;
            return { wk, label: formatWeekLabel(w), pct: t };
          })
          .filter((v): v is { wk: string; label: string; pct: number } => v !== null);

        return (
          <tbody key={g.groupId} data-planning-group={g.groupId}>
            {projectRows.map((row, rowIndex) => {
              const isFirstRenderedRow = rowIndex === 0;
              const isLastSubRow = false;
              return (
                <tr
                  key={`${g.groupId}-${rowIndex}`}
                  className={
                    isLastSubRow
                      ? "border-b-2 border-[var(--rm-border)]"
                      : "border-b border-[var(--rm-border-subtle)]"
                  }
                >
                  {isFirstRenderedRow && (
                    <td className={stickyFirst} rowSpan={stickyRowSpan}>
                      <div className="flex flex-col gap-2 py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold leading-snug tracking-tight text-[var(--rm-fg)]">
                            {g.groupLabel}
                          </span>
                        </div>
                        {overloads.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] leading-relaxed text-[var(--rm-warning)]">
                            {overloads.map((o, idx) => (
                              <span key={o.wk}>
                                {o.label}: {formatAllocationPercent(o.pct)}
                                {idx < overloads.length - 1 ? "," : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                  <td className={`${stickySecond} px-3 py-2 align-middle`}>
                    <div
                      className={
                        row.secondaryId === null
                          ? "text-[11px] font-normal text-[var(--rm-muted-subtle)]"
                          : "flex items-center gap-2 text-[12px] font-normal leading-snug text-[var(--rm-muted)]"
                      }
                    >
                      {row.secondaryId !== null && row.secondaryColor && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full ring-1 ring-[var(--rm-border)]"
                          style={{ backgroundColor: row.secondaryColor }}
                          aria-hidden
                        />
                      )}
                      <span>{row.secondaryLabel}</span>
                    </div>
                  </td>
                  {row.weeks.map((cell) => (
                    <td
                      key={cell.weekStart}
                      className="border-r border-[var(--rm-border-subtle)] bg-[var(--rm-bg)]/20 px-2 py-2 align-middle last:border-r-0"
                    >
                      <AllocationCell
                        g={g}
                        row={row}
                        cell={cell}
                        projects={projects}
                        resources={resources}
                        activeCellKey={activeCellKey}
                        onActiveCellKeyChange={onActiveCellKeyChange}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}

            <tr
              key={`${g.groupId}-total`}
              className={
                !openRow
                  ? "border-b-2 border-[var(--rm-border)]"
                  : "border-b border-[var(--rm-border-subtle)]"
              }
            >
              {projectRows.length === 0 && (
                <td className={stickyFirst} rowSpan={stickyRowSpan}>
                  <div className="flex flex-col gap-2 py-2.5 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold leading-snug tracking-tight text-[var(--rm-fg)]">
                        {g.groupLabel}
                      </span>
                    </div>
                    {overloads.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] leading-relaxed text-[var(--rm-warning)]">
                        {overloads.map((o, idx) => (
                          <span key={o.wk}>
                            {o.label}: {formatAllocationPercent(o.pct)}
                            {idx < overloads.length - 1 ? "," : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              )}

              <td className={`${stickySecond} bg-[var(--rm-surface-elevated)]/20 px-3 py-2 align-middle`}>
                <div className="text-[11px] font-semibold text-[var(--rm-muted)]">Total</div>
              </td>
              {weekRange.map((w) => {
                const wk = weekKey(w);
                const total = resWeekTotals.get(`${g.groupId}:${wk}`) ?? 0;
                return (
                  <td
                    key={wk}
                    className="border-r border-[var(--rm-border-subtle)] bg-[var(--rm-surface-elevated)]/20 px-2 py-2 align-middle last:border-r-0"
                  >
                    <div className="flex min-h-[36px] items-center justify-center">
                      <TotalPctPill pct={total} />
                    </div>
                  </td>
                );
              })}
            </tr>

            {openRow && (
              <tr key={`${g.groupId}-open`} className="border-b-2 border-[var(--rm-border)]">
                <td className={`${stickySecond} px-3 py-2 align-middle`}>
                  <div className="text-[11px] font-normal text-[var(--rm-muted-subtle)]">
                    {openRow.secondaryLabel}
                  </div>
                </td>
                {openRow.weeks.map((cell) => (
                  <td
                    key={cell.weekStart}
                    className="border-r border-[var(--rm-border-subtle)] bg-[var(--rm-bg)]/20 px-2 py-2 align-middle last:border-r-0"
                  >
                    <AllocationCell
                      g={g}
                      row={openRow}
                      cell={cell}
                      projects={projects}
                      resources={resources}
                      activeCellKey={activeCellKey}
                      onActiveCellKeyChange={onActiveCellKeyChange}
                    />
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        );
      })}
    </>
  );
}
