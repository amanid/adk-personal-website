import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEmailConfig, saveEmailConfig, toPublicConfig } from "@/lib/email-config";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

const configSchema = z.object({
  host: z.string().trim().min(1, "SMTP host is required").max(255),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().trim().min(1, "SMTP username is required").max(255),
  // Empty means "keep the stored password".
  password: z.string().max(500).optional(),
  from: z.string().trim().min(1, "From address is required").max(255),
  replyTo: z.string().trim().max(255).optional(),
});

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const config = toPublicConfig(await getEmailConfig());

    // Recent delivery problems, so the admin can see failures without digging
    // through the orders table.
    const [failedCount, recentFailures] = await Promise.all([
      prisma.order.count({ where: { lastEmailError: { not: null } } }),
      prisma.order.findMany({
        where: { lastEmailError: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          orderNumber: true,
          email: true,
          createdAt: true,
          lastEmailError: true,
        },
      }),
    ]);

    return NextResponse.json({ config, failedCount, recentFailures });
  } catch (error) {
    console.error("Email settings fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const parsed = configSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    await saveEmailConfig(parsed.data);
    return NextResponse.json({
      success: true,
      config: toPublicConfig(await getEmailConfig()),
    });
  } catch (error) {
    console.error("Email settings update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
