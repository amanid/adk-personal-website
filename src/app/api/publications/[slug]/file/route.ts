import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requiresPlan, viewerHasGatedAccess, STATIC_GATED_FILES, readPrivatePublication, resolvePublicPublication, type FileKind } from "@/lib/publication-access";
import { appUrl } from "@/lib/orders";

/**
 * Serves a publication's file only to viewers allowed to open it.
 *
 * Gated PDFs live in /private/publications, outside /public, so they have no
 * static URL at all. Uploaded files are streamed from here rather than by
 * redirect: /api/uploads refuses gated ids, so a paying viewer never sees a
 * reusable public address to share.
 */

export const dynamic = "force-dynamic";


const KINDS: Record<string, FileKind> = { pdf: "pdf", data: "data", supplementary: "supplementary" };
const RA_PREFIX = "research-activity-";

async function lookup(slug: string, kind: FileKind) {
  if (slug.startsWith(RA_PREFIX)) {
    const a = await prisma.researchActivity.findUnique({
      where: { id: slug.slice(RA_PREFIX.length) },
      select: { published: true, accessLevel: true, paperUrl: true, dataUrl: true, supplementaryUrl: true },
    });
    if (!a || !a.published) return null;
    const url = kind === "pdf" ? a.paperUrl : kind === "data" ? a.dataUrl : a.supplementaryUrl;
    return { level: a.accessLevel as string, url };
  }
  const p = await prisma.publication
    .findUnique({
      where: { slug },
      select: { accessLevel: true, pdfUrl: true, dataUrl: true, supplementaryUrl: true },
    })
    .catch(() => null);
  const url = p ? (kind === "pdf" ? p.pdfUrl : kind === "data" ? p.dataUrl : p.supplementaryUrl) : null;
  return { level: p?.accessLevel ?? null, url };
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const limited = rateLimit(request, { limit: 30, windowSeconds: 60 });
  if (limited) return limited;

  const { slug } = await params;
  const kind = KINDS[new URL(request.url).searchParams.get("kind") ?? "pdf"];
  if (!kind || slug.length > 300) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const found = await lookup(slug, kind);
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Resolve the stored location. A row whose URL is this route itself (the
  // static catalogue's gated entries) is resolved through the server-side map.
  // A file that does not exist is 404 before any access check, so the paywall
  // never confirms or denies a file that was never there.
  let stored = found.url && !found.url.startsWith("/api/publications/") ? found.url : null;
  if (!stored && kind === "pdf" && STATIC_GATED_FILES[slug]) stored = `/publications/${STATIC_GATED_FILES[slug]}`;
  if (!stored) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Reports follow the publication's access level; data files always need a data plan.
  if (requiresPlan(kind, slug, found.level) && !(await viewerHasGatedAccess(kind))) {
    return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  }

  if (stored.startsWith("/publications/")) {
    const fileName = decodeURIComponent(stored.slice("/publications/".length));
    const data = await readPrivatePublication(fileName);
    if (data) {
      return new NextResponse(new Uint8Array(data), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${fileName.replace(/[^\w.\- ]/g, "_")}"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    // Not a private file: a public one under /public/publications. Redirect on
    // the public origin — request.url is the server's internal address behind
    // the host's proxy (https://localhost:10000/…), which no browser can open —
    // to the file's real name on disk.
    const publicName = await resolvePublicPublication(fileName);
    if (!publicName) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.redirect(`${appUrl()}/publications/${encodeURIComponent(publicName)}`, 302);
  }

  if (stored.startsWith("/api/uploads/")) {
    const upload = await prisma.upload.findUnique({
      where: { id: stored.slice("/api/uploads/".length) },
      select: { data: true, filename: true, mimeType: true },
    });
    if (!upload) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const isPdf = upload.mimeType === "application/pdf";
    const name = upload.filename.replace(/[^\w.\- ]/g, "_");
    return new NextResponse(upload.data, {
      headers: {
        "Content-Type": isPdf ? "application/pdf" : "application/octet-stream",
        "Content-Disposition": `${isPdf ? "inline" : "attachment"}; filename="${name}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (/^https:\/\//i.test(stored)) {
    const res = NextResponse.redirect(stored, 302);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
