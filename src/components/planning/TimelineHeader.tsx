"use client";

import { cx } from "@/lib/cx";
import { formatWeekLabel, toWeekStartKey } from "@/lib/weeks";
import {
  stickyHeadFirst,
  stickyHeadSecond,
  weekHeadCell,
  weekHeadCellCurrent,
} from "./planningStickyClasses";

export type PlanningViewMode = "project" | "resource";

export interface TimelineHeaderProps {
  view: PlanningViewMode;
  weekRange: Date[];
  currentWeekKey?: string;
}

export function TimelineHeader({ view, weekRange, currentWeekKey }: TimelineHeaderProps) {
  return (
    <thead>
      <tr>
        <th scope="col" className={stickyHeadFirst}>
          {view === "project" ? "Project" : "Resource"}
        </th>
        <th scope="col" className={stickyHeadSecond}>
          {view === "project" ? "Resource" : "Project"}
        </th>
        {weekRange.map((w) => {
          const wk = toWeekStartKey(w);
          const isCurrent = currentWeekKey !== undefined && wk === currentWeekKey;
          return (
            <th key={wk} scope="col" className={cx(weekHeadCell, isCurrent && weekHeadCellCurrent)}>
              {formatWeekLabel(w)}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
