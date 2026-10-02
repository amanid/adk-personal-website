import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isGated, viewerHasGatedAccess } from "@/lib/publication-access";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Gating comes from the DB row as well as the static catalogue: a
    // publication gated in the admin panel was previously treated as free.
    const row = await prisma.publication.findUnique({ where: { slug }, select: { accessLevel: true } });
    if (isGated(slug, row?.accessLevel)) {
      if (!(await viewerHasGatedAccess())) {
        return NextResponse.json(
          { error: "Subscription required" },
          { status: 403 }
        );
      }
    }

    await prisma.publication.update({
      where: { slug },
      data: { downloadCount: { increment: 1 } },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
