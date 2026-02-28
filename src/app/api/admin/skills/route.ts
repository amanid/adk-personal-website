import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { skillCategorySchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.skillCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { skills: true },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Skills fetch error:", error);
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
    const validation = skillCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const category = await prisma.skillCategory.create({ data: validation.data });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Skill category create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
