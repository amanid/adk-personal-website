import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { servicePackageSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = servicePackageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;
  let slug = slugify(d.title) || "session";
  for (let i = 2; await prisma.servicePackage.findUnique({ where: { slug } }); i++) slug = `${slugify(d.title)}-${i}`;
  const pkg = await prisma.servicePackage.create({
    data: { ...d, slug, titleFr: d.titleFr || null, descriptionFr: d.descriptionFr || null },
  });
  return NextResponse.json({ package: pkg }, { status: 201 });
}
