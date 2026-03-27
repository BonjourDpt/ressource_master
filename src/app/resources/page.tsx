import { db } from "@/lib/db";
import { ResourceList } from "@/components/resources/ResourceList";

export default async function ResourcesPage() {
  const resources = await db.resource.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  return (
    <ResourceList
      resources={resources.map((r) => ({
        ...r,
        capacity: (r as { capacity?: number }).capacity ?? 37.5,
      }))}
    />
  );
}
