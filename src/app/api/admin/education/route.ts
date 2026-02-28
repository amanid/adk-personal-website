import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { educationSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const education = await prisma.education.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ education });
  } catch (error) {
    console.error("Education fetch error:", error);
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
    const validation = educationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const education = await prisma.education.create({ data: validation.data });
    return NextResponse.json({ education }, { status: 201 });
  } catch (error) {
    console.error("Education create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
