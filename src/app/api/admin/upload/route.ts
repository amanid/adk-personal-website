import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// The stored MIME type comes from this map, never from the browser: `file.type`
// is whatever the client declares, and it is what /api/uploads/[id] later uses
// to decide whether a file may render inline. Anything not listed is refused.
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  txt: "text/plain",
  tex: "application/x-tex",
  bib: "text/x-bibtex",
  sty: "application/x-tex",
  cls: "application/x-tex",
  bst: "application/x-tex",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  zip: "application/zip",
  tar: "application/x-tar",
  gz: "application/gzip",
  "7z": "application/x-7z-compressed",
  rar: "application/vnd.rar",
  json: "application/json",
  xml: "application/xml",
  r: "text/x-r",
  rmd: "text/x-r-markdown",
  py: "text/x-python",
  ipynb: "application/x-ipynb+json",
  do: "text/x-stata-do",
  sas: "text/x-sas",
  sps: "text/x-spss-syntax",
  dta: "application/x-stata-dta",
  sav: "application/x-spss-sav",
};

// Raster images are checked against their magic bytes as well: a renamed
// HTML or SVG file must not be stored under an inline-capable image type.
const IMAGE_MAGIC: Record<string, (b: Buffer) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/gif": (b) => b.subarray(0, 4).toString("latin1") === "GIF8",
  "image/webp": (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
};

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
    const mimeType = MIME_BY_EXTENSION[ext];
    if (!mimeType) {
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

    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const magic = IMAGE_MAGIC[mimeType];
    if (magic && !magic(buffer)) {
      return NextResponse.json({ error: `The file is not a valid ${ext.toUpperCase()} image.` }, { status: 400 });
    }

    const upload = await prisma.upload.create({
      data: {
        filename,
        mimeType,
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
