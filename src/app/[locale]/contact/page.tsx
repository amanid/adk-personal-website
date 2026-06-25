import { staticPageMetadata } from "@/lib/seo";
import ContactClient from "./ContactClient";

export const generateMetadata = staticPageMetadata({ namespace: "contact", path: "/contact" });

export default function ContactPage() {
  return <ContactClient />;
}
