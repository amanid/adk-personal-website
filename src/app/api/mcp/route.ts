/**
 * MCP server (Model Context Protocol, Streamable HTTP transport, stateless).
 *
 * Lets AI assistants and agents query the public catalogue directly:
 * publications, store products, consulting services and blog posts. It is
 * read-only and serves only what the public pages already show, so it needs
 * no key; it is rate-limited per IP. Each POST carries one JSON-RPC message
 * and gets a plain JSON reply (no SSE stream, no session).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { SITE, getPublication, listPosts, listProducts, listServices, searchPublications } from "@/lib/ai-catalogue";
import { BASE_URL } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26"];
const MAX_BODY = 64 * 1024;
const PRODUCT_KINDS = ["BOOK", "REPORT", "DATASET", "TEMPLATE", "TOOLKIT", "COURSE", "BUNDLE"] as const;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id",
};

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };

interface Tool {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  args: z.ZodType;
  run: (args: never) => Promise<unknown>;
}

const TOOLS: Tool[] = [
  {
    name: "search_publications",
    title: "Search publications",
    description: `Search ${SITE.name}'s research publications (reports, papers, briefs) by keyword, category or year. Returns title, year, category, abstract, access level and URL.`,
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Words to find in the title, abstract or category" },
        category: { type: "string", description: "Exact category, e.g. \"Africa Economics\"" },
        year: { type: "integer" },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
      },
    },
    args: z.object({ query: z.string().max(100).optional(), category: z.string().max(100).optional(), year: z.number().int().optional(), limit: z.number().int().min(1).max(50).optional() }),
    run: (a: { query?: string; category?: string; year?: number; limit?: number }) => searchPublications(a),
  },
  {
    name: "get_publication",
    title: "Get a publication",
    description: "Full metadata and abstract of one publication, by slug.",
    inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
    args: z.object({ slug: z.string().min(1).max(200) }),
    run: async (a: { slug: string }) => (await getPublication(a.slug)) ?? { error: "No publication with that slug." },
  },
  {
    name: "list_products",
    title: "List store products",
    description: "Books, reports, datasets, templates, toolkits, courses and bundles for sale, with current prices and store links.",
    inputSchema: { type: "object", properties: { kind: { type: "string", enum: [...PRODUCT_KINDS], description: "Optional filter" } } },
    args: z.object({ kind: z.enum(PRODUCT_KINDS).optional() }),
    run: (a: { kind?: string }) => listProducts(a.kind),
  },
  {
    name: "list_consulting_services",
    title: "List consulting sessions",
    description: "Bookable consulting sessions with duration, price and a booking link. Larger projects are quoted individually.",
    inputSchema: { type: "object", properties: {} },
    args: z.object({}),
    run: async () => ({ sessions: await listServices(), quote_request_url: `${BASE_URL}/en/services` }),
  },
  {
    name: "list_blog_posts",
    title: "List blog posts",
    description: "The most recent blog posts with date, excerpt and URL.",
    inputSchema: { type: "object", properties: { limit: { type: "integer", minimum: 1, maximum: 50, default: 10 } } },
    args: z.object({ limit: z.number().int().min(1).max(50).optional() }),
    run: (a: { limit?: number }) => listPosts(a.limit ?? 10),
  },
  {
    name: "get_profile",
    title: "About the author",
    description: `Who ${SITE.name} is, and where to find the main pages.`,
    inputSchema: { type: "object", properties: {} },
    args: z.object({}),
    run: async () => ({
      name: SITE.name,
      roles: SITE.roles,
      summary: SITE.summary,
      pages: {
        about: `${BASE_URL}/en/about`,
        experience: `${BASE_URL}/en/experience`,
        publications: `${BASE_URL}/en/publications`,
        store: `${BASE_URL}/en/store`,
        consulting: `${BASE_URL}/en/consulting`,
        contact: `${BASE_URL}/en/contact`,
        data_api: `${BASE_URL}/en/developers`,
      },
    }),
  },
];

type Id = string | number | null;
const reply = (id: Id, result: unknown) => NextResponse.json({ jsonrpc: "2.0", id, result }, { headers: CORS });
const fail = (id: Id, code: number, message: string, status = 200) =>
  NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } }, { status, headers: CORS });

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** No server-initiated stream: this server only answers requests. */
export function GET() {
  return new NextResponse(null, { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } });
}

export async function POST(request: Request) {
  const limited = rateLimit(request, { limit: 60, windowSeconds: 60 });
  if (limited) return limited;

  const raw = await request.text();
  if (raw.length > MAX_BODY) return fail(null, -32600, "Request too large", 413);
  let msg: { jsonrpc?: string; id?: Id; method?: string; params?: Record<string, unknown> };
  try {
    msg = JSON.parse(raw);
  } catch {
    return fail(null, -32700, "Parse error", 400);
  }
  if (!msg || typeof msg !== "object" || Array.isArray(msg) || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return fail(null, -32600, "Invalid request: send one JSON-RPC 2.0 message per POST", 400);
  }
  // Notifications (no id) need no answer.
  if (msg.id === undefined) return new NextResponse(null, { status: 202, headers: CORS });
  const id = msg.id;

  switch (msg.method) {
    case "initialize": {
      const asked = typeof msg.params?.protocolVersion === "string" ? msg.params.protocolVersion : "";
      return reply(id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(asked) ? asked : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "konanamanidieudonne-catalogue", title: `${SITE.name} — catalogue`, version: "1.0.0" },
        instructions:
          `Public catalogue of ${SITE.name}: research publications, store products, consulting sessions and blog posts. ` +
          "Read-only. Quote prices and links exactly as returned; publications with access \"subscription\" need a research subscription to read in full.",
      });
    }
    case "ping":
      return reply(id, {});
    case "tools/list":
      return reply(id, {
        tools: TOOLS.map((t) => ({ name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema, annotations: READ_ONLY })),
      });
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === msg.params?.name);
      if (!tool) return fail(id, -32602, `Unknown tool: ${String(msg.params?.name)}`);
      const parsed = tool.args.safeParse(msg.params?.arguments ?? {});
      if (!parsed.success) {
        return reply(id, { isError: true, content: [{ type: "text", text: `Invalid arguments: ${parsed.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ")}` }] });
      }
      try {
        const data = await tool.run(parsed.data as never);
        return reply(id, { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
      } catch (e) {
        console.error("[mcp] tool failed", tool.name, (e as Error).message);
        return reply(id, { isError: true, content: [{ type: "text", text: "The catalogue is temporarily unavailable. Try again shortly." }] });
      }
    }
    default:
      return fail(id, -32601, `Method not found: ${msg.method}`);
  }
}
