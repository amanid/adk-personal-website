import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: jpg, png, webp, gif, pdf" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 10MB" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const upload = await prisma.upload.create({
      data: {
        filename,
        mimeType: file.type,
        data: buffer,
      },
    });

    return NextResponse.json({ url: `/api/uploads/${upload.id}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
