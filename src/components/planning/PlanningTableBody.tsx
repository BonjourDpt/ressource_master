"use client";

import { formatWeekLabel, toWeekStartKey } from "@/lib/weeks";
import { formatAllocationPercent } from "@/lib/planning-format";
import type { PlanningMatrixGroup, ProjectModel, ResourceModel } from "@/lib/planning-view-model";
import { AllocationCell } from "./AllocationCell";
import { stickyBodyFirst, stickyBodySecond, weekBodyCell } from "./planningStickyClasses";
import { TotalPctPill } from "./TotalPctPill";

type Overload = { wk: string; label: string; pct: number };

function OverloadHint({ items }: { items: Overload[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-1.5 text-xs leading-relaxed text-[var(--rm-warning)]">
      {items.map((o, idx) => (
        <span key={o.wk}>
          {idx > 0 ? ", " : null}
          {o.label}: {formatAllocationPercent(o.pct)}
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

export interface PlanningTableBodyProps {
  groups: PlanningMatrixGroup[];
  weekRange: Date[];
  resWeekTotals: Map<string, number>;
  projects: ProjectModel[];
  resources: ResourceModel[];
  activeCellKey: string | null;
  onActiveCellKeyChange: (key: string | null) => void;
}

const rowLine = "border-b border-[var(--rm-border-subtle)]";

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
      {groups.map((g, groupIndex) => {
        const groupTop = groupIndex > 0 ? "border-t border-[var(--rm-border-subtle)]" : "";

        if (g.mode !== "resource") {
          return (
            <tbody key={g.groupId} data-planning-group={g.groupId}>
              {g.rows.map((row, rowIndex) => (
                <tr
                  key={`${g.groupId}-${rowIndex}`}
                  className={`${rowLine} ${rowIndex === 0 ? groupTop : ""}`.trim()}
                >
                  {rowIndex === 0 && (
                    <td className={stickyBodyFirst} rowSpan={g.rows.length}>
                      <div className="flex flex-col py-0.5">
                        <div className="flex items-center gap-2">
                          {g.mode === "project" && g.groupColor ? (
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: g.groupColor }}
                              aria-hidden
                            />
                          ) : null}
                          <span className="text-sm font-medium leading-snug text-[var(--rm-fg)]">
                            {g.groupLabel}
                          </span>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className={stickyBodySecond}>
                    <SecondaryCellContent
                      label={row.secondaryLabel}
                      muted={row.secondaryId === null}
                    />
                  </td>
                  {row.weeks.map((cell) => (
                    <td key={cell.weekStart} className={weekBodyCell}>
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
              ))}
            </tbody>
          );
        }

        const hasOpenRow = g.rows.length > 0 && g.rows[g.rows.length - 1].secondaryId === null;
        const openRow = hasOpenRow ? g.rows[g.rows.length - 1] : null;
        const projectRows = hasOpenRow ? g.rows.slice(0, -1) : g.rows;

        const stickyRowSpan = g.rows.length + 1;
        const overloads: Overload[] = weekRange
          .map((w) => {
            const wk = toWeekStartKey(w);
            const t = resWeekTotals.get(`${g.groupId}:${wk}`) ?? 0;
            if (t <= 100) return null;
            return { wk, label: formatWeekLabel(w), pct: t };
          })
          .filter((v): v is Overload => v !== null);

        const resourceTitleBlock = (
          <div className="flex flex-col py-0.5">
            <span className="text-sm font-medium leading-snug text-[var(--rm-fg)]">{g.groupLabel}</span>
            <OverloadHint items={overloads} />
          </div>
        );

        return (
          <tbody key={g.groupId} data-planning-group={g.groupId}>
            {projectRows.map((row, rowIndex) => (
              <tr
                key={`${g.groupId}-${rowIndex}`}
                className={`${rowLine} ${rowIndex === 0 ? groupTop : ""}`.trim()}
              >
                {rowIndex === 0 && (
                  <td className={stickyBodyFirst} rowSpan={stickyRowSpan}>
                    {resourceTitleBlock}
                  </td>
                )}
                <td className={stickyBodySecond}>
                  <SecondaryCellContent
                    label={row.secondaryLabel}
                    muted={row.secondaryId === null}
                    dotColor={row.secondaryId !== null ? row.secondaryColor : null}
                  />
                </td>
                {row.weeks.map((cell) => (
                  <td key={cell.weekStart} className={weekBodyCell}>
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
            ))}

            <tr className={rowLine}>
              {projectRows.length === 0 && (
                <td className={stickyBodyFirst} rowSpan={stickyRowSpan}>
                  {resourceTitleBlock}
                </td>
              )}

              <td className={stickyBodySecond}>
                <span className="text-xs font-medium text-[var(--rm-muted)]">Total</span>
              </td>
              {weekRange.map((w) => {
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

            {openRow && (
              <tr className={rowLine}>
                <td className={stickyBodySecond}>
                  <SecondaryCellContent label={openRow.secondaryLabel} muted />
                </td>
                {openRow.weeks.map((cell) => (
                  <td key={cell.weekStart} className={weekBodyCell}>
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
