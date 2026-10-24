import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SMTP_SETTING_PREFIX } from "@/lib/email-config";
import { z } from "zod";

/**
 * Only the keys the settings page edits. Everything else (API quotas and
 * plan ids, affiliate rates, booking windows, private.* secrets) has its own
 * validated endpoint, and this generic writer must not be a back door to it.
 */
const settingsSchema = z
  .object({
    profilePhoto: z.string().max(2000),
    heroGreeting: z.string().max(500),
    heroGreetingFr: z.string().max(500),
    heroDescription: z.string().max(5000),
    heroDescriptionFr: z.string().max(5000),
    aboutBio: z.string().max(20000),
    aboutBioFr: z.string().max(20000),
    whoIAmText: z.string().max(5000),
    whoIAmTextFr: z.string().max(5000),
    cvFileUrl: z.string().max(2000),
    sectionVisibility: z.string().max(5000),
  })
  .partial()
  .strict();

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

    const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings", details: parsed.error.flatten() }, { status: 400 });
    }
    if ("sectionVisibility" in parsed.data) {
      // Stored as JSON text; refuse anything that isn't a flat boolean map.
      try {
        const v = JSON.parse(parsed.data.sectionVisibility as string);
        if (!v || typeof v !== "object" || Array.isArray(v) || Object.values(v).some((x) => typeof x !== "boolean")) throw new Error();
      } catch {
        return NextResponse.json({ error: "sectionVisibility must be a JSON object of booleans" }, { status: 400 });
      }
    }
    const entries = (Object.entries(parsed.data) as [string, string][]).filter(
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
