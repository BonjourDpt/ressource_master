import { Suspense } from "react";
import { db } from "@/lib/db";
import { PlanningGrid } from "@/components/planning/PlanningGrid";
import { getIsoMonday, addWeeks } from "@/lib/weeks";

interface PageProps {
  searchParams: Promise<{ weekStart?: string; view?: string; span?: string }>;
}

export default async function PlanningPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const span = Math.min(12, Math.max(4, parseInt(params.span ?? "8", 10) || 8));
  const startWeek = params.weekStart
    ? getIsoMonday(new Date(params.weekStart))
    : getIsoMonday(new Date());
  const endWeek = addWeeks(startWeek, span);

  const [projects, resources, bookings] = await Promise.all([
    db.project.findMany({ orderBy: { name: "asc" } }),
    db.resource.findMany({ orderBy: { name: "asc" } }),
    db.booking.findMany({
      where: {
        weekStart: { gte: startWeek, lt: endWeek },
      },
      include: { project: true, resource: true },
    }),
  ]);

  return (
    <Suspense fallback={<div className="text-[var(--rm-muted)]">Loading…</div>}>
      <PlanningGrid
        projects={projects}
        resources={resources}
        bookings={bookings}
        startWeek={startWeek}
        span={span}
      />
    </Suspense>
  );
}
