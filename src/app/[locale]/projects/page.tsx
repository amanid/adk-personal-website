import { staticPageMetadata } from "@/lib/seo";
import ProjectsClient from "./ProjectsClient";

export const generateMetadata = staticPageMetadata({ namespace: "projects", path: "/projects" });

export default function ProjectsPage() {
  return <ProjectsClient />;
}
