import { NextResponse } from "next/server";
import { BASE_URL } from "@/lib/seo";

/** API index: what's available and where the docs are. No key needed. */
export function GET() {
  return NextResponse.json(
    {
      name: "KONAN Amani Dieudonné — Data & Research API",
      version: "v1",
      docs: `${BASE_URL}/en/developers`,
      openapi: `${BASE_URL}/api/v1/openapi.json`,
      auth: "Authorization: Bearer <your API key>",
      endpoints: ["/api/v1/publications", "/api/v1/publications/{slug}", "/api/v1/datasets", "/api/v1/datasets/{slug}/download", "/api/v1/usage"],
    },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" } }
  );
}
