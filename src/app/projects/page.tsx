import { db } from "@/lib/db";
import { ProjectList } from "@/components/projects/ProjectList";

/** Avoid build-time snapshot lists; always load fresh data (matches CRUD + revalidatePath). */
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  return <ProjectList projects={projects} />;
}
