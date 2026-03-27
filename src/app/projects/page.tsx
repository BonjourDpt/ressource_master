import { db } from "@/lib/db";
import { ProjectList } from "@/components/projects/ProjectList";

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  return <ProjectList projects={projects} />;
}
