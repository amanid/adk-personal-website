/**
 * llms.txt (https://llmstxt.org): a Markdown map of the site for AI
 * assistants. The short form links everything; the full form adds abstracts
 * and descriptions so an assistant can answer without fetching each page.
 */
import { BASE_URL } from "./seo";
import { SITE, listPosts, listProducts, listServices, searchPublications } from "./ai-catalogue";

const line = (s: string | null | undefined) => (s || "").replace(/\s+/g, " ").trim();

export async function buildLlmsTxt(full: boolean): Promise<string> {
  const [pubs, products, services, posts] = await Promise.all([
    searchPublications({ limit: 50 }),
    listProducts(),
    listServices(),
    listPosts(full ? 50 : 15),
  ]);
  const out: string[] = [];
  out.push(`# ${SITE.name}`, "", `> ${line(SITE.roles)}`, "", line(SITE.summary), "");
  out.push(
    "Content is available in English (/en/…) and French (/fr/…). Prices are in the currency shown. " +
      "Publications marked \"subscription\" need a research subscription to read in full; their metadata is public.",
    ""
  );

  out.push(`## Publications (${pubs.total})`, "");
  for (const p of pubs.results) {
    out.push(`- [${line(p.title)}](${p.url}): ${p.year}${p.category ? ` · ${p.category}` : ""} · ${p.access}${full ? ` — ${line(p.abstract)}` : ""}`);
  }
  if (pubs.total > pubs.results.length) out.push(`- [All publications](${BASE_URL}/en/publications)`);
  out.push("");

  if (products.length) {
    out.push("## Store", "");
    for (const p of products) out.push(`- [${line(p.title)}](${p.url}): ${p.kind} · ${p.price}${full ? ` — ${line(p.description)}` : ""}`);
    out.push("");
  }

  out.push("## Consulting", "");
  for (const s of services) out.push(`- [${line(s.title)}](${s.book_url}): ${s.duration_minutes} min · ${s.price}${full ? ` — ${line(s.description)}` : ""}`);
  out.push(
    `- [Consulting overview](${BASE_URL}/en/consulting)`,
    `- [Request a quote](${BASE_URL}/en/services): scoped projects, priced individually`,
    ""
  );

  if (posts.length) {
    out.push("## Blog", "");
    for (const p of posts) out.push(`- [${line(p.title)}](${p.url}): ${p.date}${full && p.excerpt ? ` — ${line(p.excerpt)}` : ""}`);
    out.push("");
  }

  out.push(
    "## For developers and AI agents",
    "",
    `- [Data & Research API](${BASE_URL}/en/developers): REST API for publications and datasets (free key; Pro adds dataset downloads)`,
    `- [OpenAPI document](${BASE_URL}/api/v1/openapi.json)`,
    `- [MCP server](${BASE_URL}/api/mcp): Model Context Protocol, Streamable HTTP, no key needed — tools to search publications, list products and consulting services`,
    `- [Full version of this file](${BASE_URL}/llms-full.txt)`,
    "",
    "## Optional",
    "",
    `- [About](${BASE_URL}/en/about)`,
    `- [Experience](${BASE_URL}/en/experience)`,
    `- [Projects](${BASE_URL}/en/projects)`,
    `- [Contact](${BASE_URL}/en/contact)`,
    `- [Blog RSS](${BASE_URL}/feed.xml)`,
    ""
  );
  return out.join("\n");
}

export function llmsResponse(body: string) {
  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
