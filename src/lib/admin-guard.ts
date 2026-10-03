import { NextResponse } from "next/server";
import { auth } from "./auth";

/** null when the caller is an admin, otherwise the 401 response to return. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (session && (session.user as { role?: string })?.role === "ADMIN") return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
