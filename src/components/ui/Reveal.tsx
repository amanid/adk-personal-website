"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

let observer: IntersectionObserver | null = null;

function getObserver() {
  if (observer) return observer;
  // Arm the hidden state only once JS is running, so server HTML (and
  // visitors without JS) always show the content.
  document.documentElement.classList.add("js-reveal");
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          observer?.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  return observer;
}

/** Fades its content in once, the first time it scrolls into view. */
export default function Reveal({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Already on screen at mount: show it now rather than flash it hidden.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight) {
      el.classList.add("is-visible");
    }
    const o = getObserver();
    o.observe(el);
    return () => o.unobserve(el);
  }, []);

  return (
    <div ref={ref} className={cn("reveal", className)}>
      {children}
    </div>
  );
}
