import { db } from "@/lib/db";
import { ResourceList } from "@/components/resources/ResourceList";

export default async function ResourcesPage() {
  const resources = await db.resource.findMany({ orderBy: { name: "asc" } });
  return <ResourceList resources={resources} />;
}
