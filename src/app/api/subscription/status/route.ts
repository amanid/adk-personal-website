import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        tier: null,
        status: null,
        hasDocumentAccess: false,
        hasDataAccess: false,
      });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({
        tier: null,
        status: null,
        hasDocumentAccess: false,
        hasDataAccess: false,
      });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || subscription.status !== "ACTIVE") {
      return NextResponse.json({
        tier: null,
        status: subscription?.status || null,
        hasDocumentAccess: false,
        hasDataAccess: false,
        currentPeriodEnd: subscription?.currentPeriodEnd || null,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
      });
    }

    return NextResponse.json({
      tier: subscription.tier,
      status: subscription.status,
      hasDocumentAccess:
        subscription.tier === "DOCUMENT_ACCESS" ||
        subscription.tier === "FULL_ACCESS",
      hasDataAccess:
        subscription.tier === "DATA_ACCESS" ||
        subscription.tier === "FULL_ACCESS",
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to check subscription" },
      { status: 500 }
    );
  }
}
