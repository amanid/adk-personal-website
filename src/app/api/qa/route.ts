import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { questionSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "recent";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ];
    }
    if (sort === "unanswered") {
      where.isAnswered = false;
    }

    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "popular") {
      orderBy = { votes: "desc" };
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: { select: { name: true } },
          answers: {
            orderBy: [{ isBestAnswer: "desc" }, { votes: "desc" }, { createdAt: "asc" }],
            include: { author: { select: { name: true, role: true } } },
          },
          _count: { select: { answers: true } },
        },
      }),
      prisma.question.count({ where }),
    ]);

    return NextResponse.json({
      questions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
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
