import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { publications as staticPublications } from "@/data/publications";
import { checkPublicationAccess } from "@/lib/subscription";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Check if publication is gated
    const staticPub = staticPublications.find((p) => p.slug === slug);
    const accessLevel = staticPub?.accessLevel || "FREE";

    if (accessLevel === "GATED") {
      const session = await auth();
      const userId = (session?.user as { id?: string })?.id || null;
      const access = await checkPublicationAccess(userId, "GATED");

      if (!access.hasDocumentAccess) {
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
