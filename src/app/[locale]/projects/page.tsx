import { staticPageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import ProjectsClient from "./ProjectsClient";

export const generateMetadata = staticPageMetadata({ namespace: "projects", path: "/projects" });

// Content changes rarely; server-render it (in the initial HTML) and revalidate.
export const revalidate = 300;

export default async function ProjectsPage() {
  let projects: Awaited<ReturnType<typeof getProjects>> = [];
  try {
    projects = await getProjects();
  } catch {
    // Fall back to the client's static seed data if the DB is unavailable.
  }
  return <ProjectsClient initialProjects={projects} />;
}

function getProjects() {
  return prisma.project.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      titleFr: true,
      description: true,
      descriptionFr: true,
      technologies: true,
      category: true,
      coverImage: true,
      liveUrl: true,
      githubUrl: true,
      featured: true,
    },
  });
}
