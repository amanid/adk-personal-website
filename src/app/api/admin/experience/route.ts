import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { experienceSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const experiences = await prisma.experience.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ experiences });
  } catch (error) {
    console.error("Experience fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const validation = experienceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten() }, { status: 400 });
    }
    const experience = await prisma.experience.create({ data: validation.data });
    return NextResponse.json({ experience }, { status: 201 });
  } catch (error) {
    console.error("Experience create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
