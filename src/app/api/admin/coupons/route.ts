import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { couponSchema } from "@/lib/validations";
import { normalizeCouponCode } from "@/lib/coupon";
import { majorToMinor } from "@/lib/currency";

async function requireAdmin() {
  const session = await auth();
  return !!session && (session.user as { role?: string })?.role === "ADMIN";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });
  return NextResponse.json({ coupons });
}

/** Build the persisted fields from validated input (converts major → minor units). */
export function couponData(data: import("@/lib/validations").CouponInput) {
  const currency = data.currency || null;
  const isFixed = data.type === "FIXED";
  return {
    code: normalizeCouponCode(data.code),
    type: data.type,
    percentOff: data.type === "PERCENT" ? data.percentOff ?? null : null,
    amountOffCents:
      isFixed && data.amountOff != null && currency
        ? majorToMinor(data.amountOff, currency)
        : null,
    currency,
    // Minimum only makes sense in a specific currency.
    minSubtotalCents:
      data.minSubtotal && currency ? majorToMinor(data.minSubtotal, currency) : 0,
    maxRedemptions: data.maxRedemptions ?? null,
    active: data.active ?? true,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
  };
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const validation = couponSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }
    const data = couponData(validation.data);

    const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (existing) {
      return NextResponse.json({ error: "A coupon with that code already exists." }, { status: 409 });
    }

    const coupon = await prisma.coupon.create({ data });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error("Coupon create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
