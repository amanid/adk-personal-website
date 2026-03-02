import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { value } = await request.json();
    const userId = (session.user as { id: string }).id;

    if (value !== 1 && value !== -1) {
      return NextResponse.json({ error: "Value must be 1 or -1" }, { status: 400 });
    }

    const existing = await prisma.questionVote.findUnique({
      where: { questionId_userId: { questionId: id, userId } },
    });

    if (existing) {
      if (existing.value === value) {
        // Remove vote (toggle off)
        await prisma.questionVote.delete({ where: { id: existing.id } });
        await prisma.question.update({
          where: { id },
          data: { votes: { decrement: value } },
        });
      } else {
        // Change vote direction
        await prisma.questionVote.update({
          where: { id: existing.id },
          data: { value },
        });
        await prisma.question.update({
          where: { id },
          data: { votes: { increment: value * 2 } },
        });
      }
    } else {
      // New vote
      await prisma.questionVote.create({
        data: { questionId: id, userId, value },
      });
      await prisma.question.update({
        where: { id },
        data: { votes: { increment: value } },
      });
    }

    const question = await prisma.question.findUnique({
      where: { id },
      select: { votes: true },
    });

    return NextResponse.json({ votes: question?.votes ?? 0 });
  } catch (error) {
    console.error("Question vote error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
