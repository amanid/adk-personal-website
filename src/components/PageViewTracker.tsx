"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTracked = useRef("");

  useEffect(() => {
    if (pathname === lastTracked.current) return;
    if (pathname.includes("/admin")) return;

    lastTracked.current = pathname;

    const data = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([data], { type: "application/json" }));
    } else {
      fetch("/api/track", {
        method: "POST",
        body: data,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}

// Export helper for tracking conversions site-wide
export function trackConversion(type: string, details?: Record<string, string>) {
  try {
    navigator.sendBeacon(
      "/api/track",
      JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer,
        conversionType: type,
        ...details,
      })
    );
  } catch {
    // Silent fail
  }
}
