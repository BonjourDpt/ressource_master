"use client";

import { formatWeekLabel, toWeekStartKey } from "@/lib/weeks";
import { stickyHeadFirst, stickyHeadSecond, weekHeadCell } from "./planningStickyClasses";

export type PlanningViewMode = "project" | "resource";

export interface TimelineHeaderProps {
  view: PlanningViewMode;
  weekRange: Date[];
}

export function TimelineHeader({ view, weekRange }: TimelineHeaderProps) {
  return (
    <thead>
      <tr>
        <th scope="col" className={stickyHeadFirst}>
          {view === "project" ? "Project" : "Resource"}
        </th>
        <th scope="col" className={stickyHeadSecond}>
          {view === "project" ? "Resource" : "Project"}
        </th>
        {weekRange.map((w) => (
          <th key={toWeekStartKey(w)} scope="col" className={weekHeadCell}>
            {formatWeekLabel(w)}
          </th>
        ))}
      </tr>
    </thead>
  );
}
