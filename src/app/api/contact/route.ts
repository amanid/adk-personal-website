import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";

export async function POST(request: Request) {
  try {
    const rateLimited = rateLimit(request, { limit: 3, windowSeconds: 300 });
    if (rateLimited) return rateLimited;

    const originBlocked = checkOrigin(request);
    if (originBlocked) return originBlocked;

    const body = await request.json();
    const validation = contactSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const message = await prisma.contactMessage.create({
      data: validation.data,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Contact error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
