"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SidePanel } from "@/components/ui/SidePanel";
import { BookingForm } from "./BookingForm";
import {
  getIsoMonday,
  addWeeks,
  formatWeekLabel,
  getWeekRange,
} from "@/lib/weeks";
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
  const weekRange = getWeekRange(startWeek, span);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<
    (Booking & { project: Project; resource: Resource }) | null
  >(null);
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

  const openEdit = (b: Booking & { project: Project; resource: Resource }) => {
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

  const bookingsByProjectWeek = new Map<string, (Booking & { project: Project; resource: Resource })[]>();
  const bookingsByResourceWeek = new Map<string, (Booking & { project: Project; resource: Resource })[]>();

  for (const b of bookings) {
    const wk = weekKey(b.weekStart);
    const pk = `${b.projectId}:${wk}`;
    const rk = `${b.resourceId}:${wk}`;
    if (!bookingsByProjectWeek.has(pk)) bookingsByProjectWeek.set(pk, []);
    bookingsByProjectWeek.get(pk)!.push(b);
    if (!bookingsByResourceWeek.has(rk)) bookingsByResourceWeek.set(rk, []);
    bookingsByResourceWeek.get(rk)!.push(b);
  }

  const rows = view === "project" ? projects : resources;
  const getCellBookings = view === "project"
    ? (entityId: string, week: Date) =>
        bookingsByProjectWeek.get(`${entityId}:${weekKey(week)}`) ?? []
    : (entityId: string, week: Date) =>
        bookingsByResourceWeek.get(`${entityId}:${weekKey(week)}`) ?? [];

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
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 min-w-[160px] border-b border-r border-[var(--rm-border)] bg-[var(--rm-surface)] py-3 px-4 text-left text-[13px] font-medium text-[var(--rm-muted)]">
                {view === "project" ? "Project" : "Resource"}
              </th>
              {weekRange.map((w) => (
                <th
                  key={weekKey(w)}
                  className="sticky top-0 z-10 min-w-[110px] border-b border-[var(--rm-border)] bg-[var(--rm-surface)] py-3 px-4 text-center text-[13px] font-medium text-[var(--rm-muted)]"
                >
                  {formatWeekLabel(w)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((entity) => (
              <tr key={entity.id} className="border-b border-[var(--rm-border-subtle)] last:border-0">
                <td className="sticky left-0 z-10 border-r border-[var(--rm-border)] bg-[var(--rm-bg)] py-2 px-4">
                  {view === "project" && "color" in entity && entity.color && (
                    <span
                      className="mr-2 inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: entity.color }}
                    />
                  )}
                  <span className="font-medium">{entity.name}</span>
                </td>
                {weekRange.map((week) => {
                  const cellBookings = getCellBookings(entity.id, week);
                  const totalPct =
                    view === "resource"
                      ? cellBookings.reduce((s, b) => s + b.allocationPct, 0)
                      : 0;
                  const isOverAllocated = view === "resource" && totalPct > 100;

                  return (
                    <td
                      key={weekKey(week)}
                      className="border-r border-[var(--rm-border-subtle)] py-2 px-4 last:border-r-0"
                    >
                      <div className="flex min-h-[48px] flex-col gap-1.5">
                        {cellBookings.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => openEdit(b)}
                            className="flex w-full items-center justify-between rounded-lg border border-[var(--rm-border)] bg-[var(--rm-surface)] px-2.5 py-1.5 text-left text-xs text-[var(--rm-fg)] transition-colors hover:border-[var(--rm-muted)]"
                          >
                            <span
                              className="truncate"
                              style={
                                view === "resource" && b.project.color
                                  ? { color: b.project.color }
                                  : undefined
                              }
                            >
                              {view === "project" ? b.resource.name : b.project.name}
                            </span>
                            <span className="shrink-0 text-[var(--rm-muted)]">
                              {b.allocationPct}%
                            </span>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            openAdd(
                              view === "project"
                                ? { projectId: entity.id, weekStart: weekKey(week) }
                                : { resourceId: entity.id, weekStart: weekKey(week) }
                            )
                          }
                          className="flex min-h-[32px] w-full items-center justify-center rounded-lg border border-dashed border-[var(--rm-border)] text-[var(--rm-muted)] transition-colors hover:border-[var(--rm-muted)] hover:text-[var(--rm-fg)]"
                        >
                          +
                        </button>
                        {isOverAllocated && (
                          <span className="text-xs text-[var(--rm-warning)]">
                            {totalPct}%
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-12 text-center text-[var(--rm-muted)]">
            No {view === "project" ? "projects" : "resources"}. Add some first.
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
