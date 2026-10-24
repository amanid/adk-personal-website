import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getBrvmSnapshot } from "@/lib/brvm";

/** BRVM snapshot for the admin finance page: the same cached, backed-off fetch as the public ticker. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await getBrvmSnapshot());
}
