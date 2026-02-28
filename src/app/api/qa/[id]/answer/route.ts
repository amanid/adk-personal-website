import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
    const { content } = await request.json();

    if (!content || content.length < 2) {
      return NextResponse.json({ error: "Answer is required" }, { status: 400 });
    }

    const answer = await prisma.answer.create({
      data: {
        content,
        questionId: id,
        authorId: (session.user as { id: string }).id,
      },
      include: { author: { select: { name: true } } },
    });

    // Mark question as answered
    await prisma.question.update({
      where: { id },
      data: { isAnswered: true },
    });

    return NextResponse.json({ answer }, { status: 201 });
  } catch (error) {
    console.error("Answer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
