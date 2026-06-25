import { staticPageMetadata } from "@/lib/seo";
import AboutClient from "./AboutClient";

export const generateMetadata = staticPageMetadata({ namespace: "about", path: "/about" });

export default function AboutPage() {
  return <AboutClient />;
}
