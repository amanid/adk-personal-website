import { NextResponse } from "next/server";

export function checkOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowedOrigins = [
    "https://www.konanamanidieudonne.org",
    "https://konanamanidieudonne.org",
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean);

  // Allow in development
  if (process.env.NODE_ENV === "development") return null;

  // At least one of origin or referer must match
  const source = origin || referer;
  if (!source) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const matches = allowedOrigins.some((allowed) => source.startsWith(allowed!));
  if (!matches) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
