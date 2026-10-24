"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteFacts } from "./career-data";

const SiteFactsContext = createContext<SiteFacts | null>(null);

/** Server-computed career facts, so client components never hard-code a figure. */
export function SiteFactsProvider({ facts, children }: { facts: SiteFacts; children: ReactNode }) {
  return <SiteFactsContext.Provider value={facts}>{children}</SiteFactsContext.Provider>;
}

export function useSiteFacts(): SiteFacts {
  const facts = useContext(SiteFactsContext);
  if (!facts) {
    throw new Error("useSiteFacts must be used inside SiteFactsProvider (see src/app/[locale]/layout.tsx)");
  }
  return facts;
}
