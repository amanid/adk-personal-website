import path from "node:path";
import { readFile } from "node:fs/promises";
import { auth } from "./auth";
import { checkPublicationAccess } from "./subscription";
import { publications as staticPublications } from "@/data/publications";

/**
 * Server-side paywall for publication files.
 *
 * The subscription gate in the UI only hides a link; it cannot protect a URL
 * the browser has already been sent. So for a GATED publication the real file
 * URL never leaves the server: every response swaps it for the access-checked
 * route below, which looks the file up again and serves it only to a viewer
 * with an active subscription.
 */

export type FileKind = "pdf" | "data" | "supplementary";

// Gated entries of the static catalogue: their public URL is this route, so
// the file they point at has to be recorded server-side.
export const STATIC_GATED_FILES: Record<string, string> = {
  "africa-10trillion-opportunity-regional-dynamics-2010-2025":
    "Africa 10Trillion Opportunity Regional Dynamics 2010-2025.pdf",
  "africa-trade-finance-infrastructure-growth": "Africa Trade Finance Infrastructure Growth.pdf",
  "africa-ai-leap-finance-sovereignty": "Africa’s AI Leap - Finance & Sovereignty.pdf",
  "fintech-digital-payments-africa-mobile-money-global-scale":
    "Fintech and Digital Payments in Africa - From Mobile Money to Global Scale.pdf",
};

/** Folder for gated PDFs: outside /public, so they have no static URL. */
export const PRIVATE_PUBLICATIONS_DIR = ["private", "publications"];

/** Gated if either the DB row or the static catalogue says so. */
export function isGated(slug: string, dbLevel?: string | null): boolean {
  if (dbLevel === "GATED") return true;
  return staticPublications.find((p) => p.slug === slug)?.accessLevel === "GATED";
}

export function gatedFileUrl(slug: string, kind: FileKind): string {
  return `/api/publications/${encodeURIComponent(slug)}/file?kind=${kind}`;
}

/** Whether the current viewer may open gated documents. */
export async function viewerHasGatedAccess(): Promise<boolean> {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
    if (!userId) return false;
    if ((session?.user as { role?: string } | undefined)?.role === "ADMIN") return true;
    return (await checkPublicationAccess(userId, "GATED")).hasDocumentAccess;
  } catch {
    return false;
  }
}

type WithFiles = {
  slug: string;
  accessLevel?: string | null;
  pdfUrl?: string | null;
  dataUrl?: string | null;
  supplementaryUrl?: string | null;
};

/**
 * Replace a gated publication's file URLs with the access-checked route.
 * A URL that was empty stays empty, so the UI still knows which files exist.
 */
export function protectFiles<T extends WithFiles>(pub: T): T {
  if (!isGated(pub.slug, pub.accessLevel)) return pub;
  const out = { ...pub, accessLevel: "GATED" };
  if ("pdfUrl" in pub) out.pdfUrl = pub.pdfUrl ? gatedFileUrl(pub.slug, "pdf") : pub.pdfUrl;
  if ("dataUrl" in pub) out.dataUrl = pub.dataUrl ? gatedFileUrl(pub.slug, "data") : pub.dataUrl;
  if ("supplementaryUrl" in pub)
    out.supplementaryUrl = pub.supplementaryUrl ? gatedFileUrl(pub.slug, "supplementary") : pub.supplementaryUrl;
  return out;
}

/** Read a file from the private folder, tolerating ’ vs ' in the stored name. */
export async function readPrivatePublication(fileName: string): Promise<Buffer | null> {
  const candidates = [...new Set([fileName, fileName.replace(/'/g, "’"), fileName.replace(/’/g, "'")])];
  for (const name of candidates) {
    // basename() drops any directory part, so a crafted name can't escape the folder.
    const safe = path.basename(name);
    if (!safe || safe !== name) continue;
    try {
      return await readFile(path.join(process.cwd(), ...PRIVATE_PUBLICATIONS_DIR, safe));
    } catch {
      /* try the next spelling */
    }
  }
  return null;
}
