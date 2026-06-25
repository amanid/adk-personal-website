import { staticPageMetadata } from "@/lib/seo";
import ExperienceClient from "./ExperienceClient";

export const generateMetadata = staticPageMetadata({ namespace: "experience", path: "/experience" });

export default function ExperiencePage() {
  return <ExperienceClient />;
}
