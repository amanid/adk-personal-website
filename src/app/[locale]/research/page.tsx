import { staticPageMetadata } from "@/lib/seo";
import ResearchClient from "./ResearchClient";

export const generateMetadata = staticPageMetadata({ namespace: "research", path: "/research" });

export default function ResearchPage() {
  return <ResearchClient />;
}
