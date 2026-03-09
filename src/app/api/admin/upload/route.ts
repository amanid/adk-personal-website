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
  "text/csv",
  "text/plain",
  "text/x-tex",
  "application/x-tex",
  "application/x-latex",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-tar",
  "application/gzip",
  "application/json",
  "application/xml",
  "text/xml",
];

// Also allow by file extension for types browsers misidentify
const ALLOWED_EXTENSIONS = [
  "jpg", "jpeg", "png", "webp", "gif",
  "pdf", "csv", "tsv", "txt",
  "tex", "bib", "sty", "cls", "bst",
  "xls", "xlsx", "ppt", "pptx", "doc", "docx",
  "zip", "tar", "gz", "tar.gz", "7z", "rar",
  "json", "xml", "r", "rmd", "py", "ipynb", "do", "sas", "sps", "dta", "sav",
];

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

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

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Invalid file type "${ext || file.type}". Allowed: images, PDF, CSV, Excel, Word, PowerPoint, LaTeX, code, ZIP, JSON, XML` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 25MB" },
        { status: 400 }
      );
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "bin";
    const filename = `${randomUUID()}.${fileExt}`;
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
