import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const upload = await prisma.upload.findUnique({
      where: { id },
    });

    if (!upload) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return new NextResponse(upload.data, {
      headers: {
        "Content-Type": upload.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Upload serve error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
