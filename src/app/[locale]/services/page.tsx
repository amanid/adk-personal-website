import { staticPageMetadata } from "@/lib/seo";
import ServicesClient from "./ServicesClient";

export const generateMetadata = staticPageMetadata({ namespace: "services", path: "/services" });

export default function ServicesPage() {
  return <ServicesClient />;
}
