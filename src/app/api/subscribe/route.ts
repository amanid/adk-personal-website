import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildConfirmationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const rateLimited = rateLimit(request, { limit: 3, windowSeconds: 300 });
    if (rateLimited) return rateLimited;

    const originBlocked = checkOrigin(request);
    if (originBlocked) return originBlocked;

    const body = await request.json();
    const validation = subscribeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email, name } = validation.data;

    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing) {
      if (existing.confirmed) {
        return NextResponse.json(
          { error: "already_subscribed" },
          { status: 409 }
        );
      }
      // Resend confirmation email for unconfirmed subscriber
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const confirmUrl = `${appUrl}/api/subscribe?token=${existing.token}&action=confirm`;
      await sendEmail(
        email,
        "Confirm Your Subscription",
        buildConfirmationEmail(confirmUrl)
      );
      return NextResponse.json({ message: "confirmation_resent" });
    }

    const subscriber = await prisma.subscriber.create({
      data: { email, name: name || null },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const confirmUrl = `${appUrl}/api/subscribe?token=${subscriber.token}&action=confirm`;

    await sendEmail(
      email,
      "Confirm Your Subscription",
      buildConfirmationEmail(confirmUrl)
    );

    return NextResponse.json({ message: "confirmation_sent" }, { status: 201 });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const action = searchParams.get("action");

    if (!token || !action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (action === "confirm") {
      const subscriber = await prisma.subscriber.findUnique({ where: { token } });
      if (!subscriber) {
        return NextResponse.redirect(`${appUrl}/?newsletter=invalid`);
      }

      await prisma.subscriber.update({
        where: { token },
        data: { confirmed: true },
      });

      return NextResponse.redirect(`${appUrl}/?newsletter=confirmed`);
    }

    if (action === "unsubscribe") {
      const subscriber = await prisma.subscriber.findUnique({ where: { token } });
      if (!subscriber) {
        return NextResponse.redirect(`${appUrl}/?newsletter=invalid`);
      }

      await prisma.subscriber.delete({ where: { token } });

      return NextResponse.redirect(`${appUrl}/?newsletter=unsubscribed`);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Subscribe action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
