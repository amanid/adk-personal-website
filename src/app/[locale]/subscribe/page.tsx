import { staticPageMetadata } from "@/lib/seo";
import SubscribeClient from "./SubscribeClient";

export const generateMetadata = staticPageMetadata({ namespace: "subscribe", path: "/subscribe" });

export default function SubscribePage() {
  return <SubscribeClient />;
}
