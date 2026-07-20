import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { questionSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { getQuestionsPage } from "@/lib/qa";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getQuestionsPage({
      q: searchParams.get("q") || "",
      sort: searchParams.get("sort") || "recent",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("QA fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const limited = rateLimit(request, { limit: 5, windowSeconds: 60 });
    if (limited) return limited;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = questionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const question = await prisma.question.create({
      data: {
        ...validation.data,
        authorId: (session.user as { id: string }).id,
      },
      include: {
        author: { select: { name: true } },
        answers: true,
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("QA create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
