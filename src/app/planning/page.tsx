import { Suspense } from "react";
import { db } from "@/lib/db";
import { PlanningGrid } from "@/components/planning/PlanningGrid";
import { getIsoMonday, addWeeks } from "@/lib/weeks";

interface PageProps {
  searchParams: Promise<{ weekStart?: string; view?: string; span?: string }>;
}

export default async function PlanningPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const span = Math.min(12, Math.max(4, parseInt(params.span ?? "12", 10) || 12));
  const startWeek = params.weekStart
    ? getIsoMonday(new Date(params.weekStart))
    : getIsoMonday(new Date());
  const endWeek = addWeeks(startWeek, span);

  const [projects, resources, bookings] = await Promise.all([
    db.project.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.resource.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.booking.findMany({
      where: {
        weekStart: { gte: startWeek, lt: endWeek },
        project: { status: "ACTIVE" },
        resource: { status: "ACTIVE" },
      },
      include: { project: true, resource: true },
    }),
  ]);

  const resourcesWithCapacity = resources.map((r) => ({
    ...r,
    capacity: (r as { capacity?: number }).capacity ?? 37.5,
  }));
  const bookingsWithCapacity = bookings.map((b) => ({
    ...b,
    resource: {
      ...b.resource,
      capacity: (b.resource as { capacity?: number }).capacity ?? 37.5,
    },
  }));

  return (
    <Suspense fallback={<div className="text-[var(--rm-muted)]">Loading…</div>}>
      <PlanningGrid
        projects={projects}
        resources={resourcesWithCapacity}
        bookings={bookingsWithCapacity}
        startWeek={startWeek}
        span={span}
      />
    </Suspense>
  );
}
