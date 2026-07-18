"use client";

import { useEffect, useRef } from "react";

/**
 * Fire-and-forget book view counter. Runs once on mount so the detail page can
 * stay statically cacheable instead of writing to the DB during render.
 */
export default function BookViewBeacon({ slug }: { slug: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch(`/api/store/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
