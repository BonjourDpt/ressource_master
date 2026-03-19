"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SidePanel } from "@/components/ui/SidePanel";
import { BookingForm } from "./BookingForm";
import { PlanningTableBody } from "./PlanningTableBody";
import { getIsoMonday, addWeeks, formatWeekLabel, getWeekRange } from "@/lib/weeks";
import {
  buildPlanningMatrix,
  resourceWeekTotals,
  type BookingWithRelations,
} from "@/lib/planning-view-model";
import type { Booking, Project, Resource } from "@prisma/client";

type ViewMode = "project" | "resource";

interface PlanningGridProps {
  projects: Project[];
  resources: Resource[];
  bookings: (Booking & { project: Project; resource: Resource })[];
  startWeek: Date;
  span: number;
}

function weekKey(d: Date): string {
  return getIsoMonday(d).toISOString().slice(0, 10);
}

export function PlanningGrid({
  projects,
  resources,
  bookings,
  startWeek,
  span,
}: PlanningGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = (searchParams.get("view") as ViewMode) || "project";
  const weekRange = useMemo(() => getWeekRange(startWeek, span), [startWeek, span]);

  const groups = useMemo(
    () => buildPlanningMatrix(view, projects, resources, bookings, weekRange),
    [view, projects, resources, bookings, weekRange]
  );

  const resWeekTotals = useMemo(() => resourceWeekTotals(bookings), [bookings]);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingWithRelations | null>(null);
  const [addContext, setAddContext] = useState<{
    projectId?: string;
    resourceId?: string;
    weekStart?: string;
  }>({});

  const setView = (v: ViewMode) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("view", v);
    router.push(`/planning?${p.toString()}`);
  };

  const shiftWeeks = (delta: number) => {
    const newStart = addWeeks(startWeek, delta);
    const p = new URLSearchParams(searchParams.toString());
    p.set("weekStart", newStart.toISOString().slice(0, 10));
    router.push(`/planning?${p.toString()}`);
  };

  const openEdit = (b: BookingWithRelations) => {
    setEditingBooking(b);
    setAddContext({});
    setPanelOpen(true);
  };

  const openAdd = (ctx: { projectId?: string; resourceId?: string; weekStart?: string }) => {
    setEditingBooking(null);
    setAddContext(ctx);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingBooking(null);
    setAddContext({});
  };

  const groupListEmpty = view === "project" ? projects.length === 0 : resources.length === 0;

  const stickyHeadFirst =
    "sticky left-0 top-0 z-[31] w-40 min-w-[160px] max-w-[200px] border-b border-r border-[var(--rm-border)] bg-[var(--rm-surface)] px-4 py-2.5 text-left align-middle text-[13px] font-semibold text-[var(--rm-muted)]";
  const stickyHeadSecond =
    "sticky left-40 top-0 z-[30] min-w-[132px] w-44 max-w-[200px] border-b border-r border-[var(--rm-border)] bg-[var(--rm-surface)] px-4 py-2.5 text-left align-middle text-[13px] font-semibold text-[var(--rm-muted)]";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--rm-fg)]">Planning</h1>
        <div className="flex items-center gap-4">
          <div
            role="tablist"
            className="inline-flex rounded-lg border border-[var(--rm-border)] bg-[var(--rm-surface)] p-1"
          >
            <button
              role="tab"
              aria-selected={view === "project"}
              onClick={() => setView("project")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "project"
                  ? "bg-[var(--rm-bg)] text-[var(--rm-fg)]"
                  : "text-[var(--rm-muted)] hover:text-[var(--rm-fg)]"
              }`}
            >
              By project
            </button>
            <button
              role="tab"
              aria-selected={view === "resource"}
              onClick={() => setView("resource")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "resource"
                  ? "bg-[var(--rm-bg)] text-[var(--rm-fg)]"
                  : "text-[var(--rm-muted)] hover:text-[var(--rm-fg)]"
              }`}
            >
              By resource
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => shiftWeeks(-1)}
              className="rounded-lg px-2.5 py-1.5 text-sm text-[var(--rm-muted)] hover:bg-[var(--rm-surface)] hover:text-[var(--rm-fg)] transition-colors"
              aria-label="Previous weeks"
            >
              ←
            </button>
            <span className="min-w-[120px] text-center text-sm text-[var(--rm-muted)]">
              {formatWeekLabel(weekRange[0] ?? startWeek)} –{" "}
              {formatWeekLabel(weekRange[span - 1] ?? startWeek)}
            </span>
            <button
              onClick={() => shiftWeeks(1)}
              className="rounded-lg px-2.5 py-1.5 text-sm text-[var(--rm-muted)] hover:bg-[var(--rm-surface)] hover:text-[var(--rm-fg)] transition-colors"
              aria-label="Next weeks"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="rm-scroll-x overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-sm text-[var(--rm-fg)]">
          <thead>
            <tr>
              <th scope="col" className={stickyHeadFirst}>
                {view === "project" ? "Project" : "Resource"}
              </th>
              <th scope="col" className={stickyHeadSecond}>
                {view === "project" ? "Resource" : "Project"}
              </th>
              {weekRange.map((w) => (
                <th
                  key={weekKey(w)}
                  scope="col"
                  className="sticky top-0 z-10 min-w-[104px] border-b border-[var(--rm-border)] bg-[var(--rm-surface)] px-3 py-2.5 text-center align-middle text-[13px] font-medium text-[var(--rm-muted)]"
                >
                  {formatWeekLabel(w)}
                </th>
              ))}
            </tr>
          </thead>
          <PlanningTableBody
            groups={groups}
            weekRange={weekRange}
            resWeekTotals={resWeekTotals}
            onEditBooking={openEdit}
            onAddBooking={openAdd}
          />
        </table>
        {groupListEmpty && (
          <p className="py-10 text-center text-[13px] text-[var(--rm-muted-subtle)]">
            No {view === "project" ? "projects" : "resources"} yet.
          </p>
        )}
      </div>

      <SidePanel
        open={panelOpen}
        onClose={closePanel}
        title={editingBooking ? "Edit booking" : "New booking"}
      >
        <BookingForm
          booking={editingBooking}
          projects={projects}
          resources={resources}
          weekRange={weekRange}
          initialProjectId={addContext.projectId}
          initialResourceId={addContext.resourceId}
          initialWeekStart={addContext.weekStart}
          onSuccess={closePanel}
          onCancel={closePanel}
        />
      </SidePanel>
    </div>
  );
}
