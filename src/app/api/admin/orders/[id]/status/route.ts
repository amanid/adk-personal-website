import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deliverReceipt, fulfilPaidOrder } from "@/lib/order-fulfillment";

export const runtime = "nodejs";

/**
 * Admin action on an order. "mark-paid" confirms a manual (mobile-money)
 * payment — it marks the order PAID, creates the secure download grants and
 * emails the receipt. "resend-receipt" re-sends the receipt for an order that is
 * already PAID — the recovery path when the first attempt failed (bad SMTP
 * settings, a typo'd address that has since been corrected). "cancel" / "fail"
 * just update the status.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const action = body?.action;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (action === "mark-paid") {
      if (order.status === "PAID") {
        return NextResponse.json({ status: "PAID" });
      }
      await fulfilPaidOrder(id);
      return NextResponse.json({ status: "PAID" });
    }

    if (action === "resend-receipt") {
      if (order.status !== "PAID") {
        return NextResponse.json(
          { error: "Only a paid order has a receipt to send." },
          { status: 400 }
        );
      }
      const error = await deliverReceipt(id);
      if (error) return NextResponse.json({ error }, { status: 502 });
      return NextResponse.json({ status: order.status, message: `Receipt re-sent to ${order.email}.` });
    }

    if (action === "cancel" || action === "fail") {
      const status = action === "cancel" ? "CANCELLED" : "FAILED";
      await prisma.order.update({ where: { id }, data: { status } });
      return NextResponse.json({ status });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Order status update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
