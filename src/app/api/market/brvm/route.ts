import { NextResponse } from "next/server";
import { getBrvmSnapshot } from "@/lib/brvm";

/** Public BRVM snapshot for the market ticker (see lib/brvm for caching and backoff). */
export async function GET() {
  return NextResponse.json(await getBrvmSnapshot());
}
