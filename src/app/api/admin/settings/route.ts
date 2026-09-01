import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SMTP_SETTING_PREFIX } from "@/lib/email-config";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const records = await prisma.siteSetting.findMany();

    const settings: Record<string, string> = {};
    for (const record of records) {
      // SMTP credentials are owned by /api/admin/email, which never returns the
      // (encrypted) password. Keep them out of the generic settings payload.
      if (record.key.startsWith(SMTP_SETTING_PREFIX)) continue;
      settings[record.key] = record.value;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const entries = (Object.entries(body) as [string, string][]).filter(
      // Writing these through the generic endpoint would store the password in
      // plaintext; they must go through /api/admin/email.
      ([key]) => !key.startsWith(SMTP_SETTING_PREFIX)
    );

    await Promise.all(
      entries.map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
