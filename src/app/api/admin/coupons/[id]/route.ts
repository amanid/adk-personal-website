import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { couponSchema } from "@/lib/validations";
import { couponData } from "../route";

async function requireAdmin() {
  const session = await auth();
  return !!session && (session.user as { role?: string })?.role === "ADMIN";
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = couponSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }
    const data = couponData(validation.data);

    // Guard against code collisions with a different coupon.
    const clash = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (clash && clash.id !== id) {
      return NextResponse.json({ error: "A coupon with that code already exists." }, { status: 409 });
    }

    const coupon = await prisma.coupon.update({ where: { id }, data });
    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Coupon update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    // Orders keep couponCode/discount snapshots; the FK is set null on delete.
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Coupon delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
