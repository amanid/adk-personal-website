import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { sendTestEmail, verifyEmailTransport } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const testSchema = z.object({
  // "verify" only opens/authenticates the SMTP connection; "send" delivers a message.
  mode: z.enum(["verify", "send"]).default("verify"),
  to: z.string().trim().email().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sending is an outbound side effect; keep it from being hammered.
  const limited = rateLimit(request, { limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  const parsed = testSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid recipient address is required" }, { status: 400 });
  }
  const { mode, to } = parsed.data;

  if (mode === "send" && !to) {
    return NextResponse.json({ error: "A recipient address is required" }, { status: 400 });
  }

  try {
    if (mode === "verify") {
      await verifyEmailTransport();
      return NextResponse.json({ success: true, message: "Connected and authenticated successfully." });
    }
    await sendTestEmail(to!);
    return NextResponse.json({ success: true, message: `Test email sent to ${to}.` });
  } catch (error) {
    // Surface the SMTP error verbatim — it's the whole point of the test.
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Email test failed" },
      { status: 502 }
    );
  }
}
