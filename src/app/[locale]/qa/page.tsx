import { staticPageMetadata } from "@/lib/seo";
import QAClient from "./QAClient";

export const generateMetadata = staticPageMetadata({ namespace: "qa", path: "/qa" });

export default function QAPage() {
  return <QAClient />;
}
