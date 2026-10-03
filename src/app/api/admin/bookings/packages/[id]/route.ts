import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { servicePackageSchema } from "@/lib/validations";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const parsed = servicePackageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;
  const pkg = await prisma.servicePackage
    .update({ where: { id }, data: { ...d, titleFr: d.titleFr || null, descriptionFr: d.descriptionFr || null } })
    .catch(() => null);
  if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ package: pkg });
}

/** Delete a package nobody has booked; one with bookings can only be deactivated. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const used = await prisma.booking.count({ where: { packageId: id } });
  if (used > 0) {
    return NextResponse.json({ error: "This session has bookings; deactivate it instead." }, { status: 409 });
  }
  await prisma.servicePackage.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
