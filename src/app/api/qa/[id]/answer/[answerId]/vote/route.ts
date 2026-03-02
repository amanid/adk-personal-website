import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; answerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { answerId } = await params;
    const { value } = await request.json();
    const userId = (session.user as { id: string }).id;

    if (value !== 1 && value !== -1) {
      return NextResponse.json({ error: "Value must be 1 or -1" }, { status: 400 });
    }

    const existing = await prisma.answerVote.findUnique({
      where: { answerId_userId: { answerId, userId } },
    });

    if (existing) {
      if (existing.value === value) {
        await prisma.answerVote.delete({ where: { id: existing.id } });
        await prisma.answer.update({
          where: { id: answerId },
          data: { votes: { decrement: value } },
        });
      } else {
        await prisma.answerVote.update({
          where: { id: existing.id },
          data: { value },
        });
        await prisma.answer.update({
          where: { id: answerId },
          data: { votes: { increment: value * 2 } },
        });
      }
    } else {
      await prisma.answerVote.create({
        data: { answerId, userId, value },
      });
      await prisma.answer.update({
        where: { id: answerId },
        data: { votes: { increment: value } },
      });
    }

    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      select: { votes: true },
    });

    return NextResponse.json({ votes: answer?.votes ?? 0 });
  } catch (error) {
    console.error("Answer vote error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
