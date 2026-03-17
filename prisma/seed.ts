import { PrismaClient, LifecycleStatus } from "@prisma/client";

const prisma = new PrismaClient();

function isoMonday(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0..6 (Sun..Sat)
  const diff = (day === 0 ? -6 : 1) - day; // ISO Monday
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

async function main() {
  const now = new Date();
  const w0 = isoMonday(now);
  const w1 = isoMonday(new Date(w0.getTime() + 7 * 24 * 60 * 60 * 1000));

  const [p1, p2] = await Promise.all([
    prisma.project.upsert({
      where: { name: "Apollo" },
      update: {},
      create: { name: "Apollo", color: "#2563eb", status: LifecycleStatus.ACTIVE },
    }),
    prisma.project.upsert({
      where: { name: "Orion" },
      update: {},
      create: { name: "Orion", color: "#16a34a", status: LifecycleStatus.ACTIVE },
    }),
  ]);

  const [r1, r2] = await Promise.all([
    prisma.resource.upsert({
      where: { id: "seed-alex" },
      update: {},
      create: { id: "seed-alex", name: "Alex", role: "Engineer", team: "Core" },
    }),
    prisma.resource.upsert({
      where: { id: "seed-sam" },
      update: {},
      create: { id: "seed-sam", name: "Sam", role: "Designer", team: "Product" },
    }),
  ]);

  await Promise.all([
    prisma.booking.upsert({
      where: {
        resourceId_projectId_weekStart: {
          resourceId: r1.id,
          projectId: p1.id,
          weekStart: w0,
        },
      },
      update: { allocationPct: 60 },
      create: { resourceId: r1.id, projectId: p1.id, weekStart: w0, allocationPct: 60 },
    }),
    prisma.booking.upsert({
      where: {
        resourceId_projectId_weekStart: {
          resourceId: r1.id,
          projectId: p2.id,
          weekStart: w0,
        },
      },
      update: { allocationPct: 50, note: "Over-allocated example" },
      create: {
        resourceId: r1.id,
        projectId: p2.id,
        weekStart: w0,
        allocationPct: 50,
        note: "Over-allocated example",
      },
    }),
    prisma.booking.upsert({
      where: {
        resourceId_projectId_weekStart: {
          resourceId: r2.id,
          projectId: p2.id,
          weekStart: w1,
        },
      },
      update: { allocationPct: 80 },
      create: { resourceId: r2.id, projectId: p2.id, weekStart: w1, allocationPct: 80 },
    }),
  ]);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

