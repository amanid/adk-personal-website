import { NextResponse } from "next/server";
import { BASE_URL } from "@/lib/seo";

/** OpenAPI 3.1 description of the Data & Research API (public). */
export function GET() {
  const err = { $ref: "#/components/schemas/Error" };
  const page = (name: string) => ({ name, in: "query", required: false, schema: { type: "integer" } });
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "KONAN Amani Dieudonné — Data & Research API",
      version: "1.0.0",
      description:
        "Publication metadata and datasets on African economics, trade, commodities, AI and data governance. Free and Pro plans; quotas reset monthly (UTC). Get a key at " +
        `${BASE_URL}/en/developers.`,
    },
    servers: [{ url: BASE_URL }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", description: "Your API key (adk_…)" } },
      schemas: {
        Error: { type: "object", properties: { error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" } } } } },
        Publication: {
          type: "object",
          properties: {
            slug: { type: "string" }, title: { type: "string" }, title_fr: { type: ["string", "null"] },
            abstract: { type: "string" }, abstract_fr: { type: ["string", "null"] },
            authors: { type: "array", items: { type: "string" } }, year: { type: "integer" }, month: { type: ["integer", "null"] },
            type: { type: "string" }, category: { type: ["string", "null"] }, tags: { type: "array", items: { type: "string" } },
            journal: { type: ["string", "null"] }, publisher: { type: ["string", "null"] }, institution: { type: ["string", "null"] },
            doi: { type: ["string", "null"] }, citation_count: { type: ["integer", "null"] },
            access: { type: "string", enum: ["free", "subscription"] }, url: { type: "string", format: "uri" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Dataset: {
          type: "object",
          properties: {
            slug: { type: "string" }, title: { type: "string" }, title_fr: { type: ["string", "null"] }, description: { type: "string" },
            category: { type: ["string", "null"] }, tags: { type: "array", items: { type: "string" } }, year: { type: "integer" },
            format: { type: ["string", "null"] }, size_bytes: { type: ["integer", "null"] },
            price_cents: { type: "integer" }, currency: { type: "string" }, store_url: { type: "string", format: "uri" },
            download_endpoint: { type: "string" }, updated_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
    paths: {
      "/api/v1/publications": {
        get: {
          summary: "List publications",
          parameters: [
            { name: "q", in: "query", schema: { type: "string" }, description: "Search title, abstract and tags" },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "year", in: "query", schema: { type: "integer" } },
            { name: "type", in: "query", schema: { type: "string" }, description: "e.g. ANALYTICAL_REPORT, WORKING_PAPER" },
            page("page"),
            { ...page("per_page"), description: "1–100, default 20" },
          ],
          responses: {
            "200": { description: "A page of publications", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Publication" } }, page: { type: "integer" }, per_page: { type: "integer" }, total: { type: "integer" } } } } } },
            "401": { description: "Missing or invalid key", content: { "application/json": { schema: err } } },
            "429": { description: "Rate limit or monthly quota reached", content: { "application/json": { schema: err } } },
          },
        },
      },
      "/api/v1/publications/{slug}": {
        get: {
          summary: "One publication",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "The publication", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Publication" } } } } } }, "404": { description: "Not found", content: { "application/json": { schema: err } } } },
        },
      },
      "/api/v1/datasets": {
        get: {
          summary: "List datasets",
          responses: { "200": { description: "Published datasets", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Dataset" } }, plan: { type: "string" } } } } } } },
        },
      },
      "/api/v1/datasets/{slug}/download": {
        get: {
          summary: "Download a dataset file (Pro plan)",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "The file, as an attachment" }, "403": { description: "Requires the Pro plan", content: { "application/json": { schema: err } } } },
        },
      },
      "/api/v1/usage": {
        get: {
          summary: "This key's usage this month",
          responses: { "200": { description: "Plan and quota", content: { "application/json": { schema: { type: "object", properties: { data: { type: "object", properties: { plan: { type: "string" }, period: { type: "string" }, used: { type: "integer" }, quota: { type: "integer" }, remaining: { type: "integer" } } } } } } } } },
        },
      },
    },
  };
  return NextResponse.json(spec, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" } });
}
