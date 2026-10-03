import { prisma } from "@/lib/prisma";
import { BASE_URL } from "@/lib/seo";
import { effectivePrice } from "@/lib/pricing";
import { currencyDecimals, minorToMajor } from "@/lib/currency";

/**
 * Google Merchant Center product feed (RSS 2.0 + g: namespace), for Google's
 * free product listings. Add it in Merchant Center as a scheduled fetch:
 *   https://www.konanamanidieudonne.org/feeds/google-merchant.xml   (English)
 *   https://www.konanamanidieudonne.org/feeds/google-merchant.xml?locale=fr
 *
 * Only books and reports are included. Google's "Unsupported Shopping
 * content" policy disallows eBooks in Shopping *ads* but states that it does
 * not apply to free listings; other digital goods (datasets, templates…) are
 * left out rather than risk the account.
 */
export const revalidate = 3600;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
// Strip control characters XML 1.0 forbids, then escape.
const text = (s: string, max: number) => esc(s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").slice(0, max));

function money(minor: number, currency: string): string {
  return `${minorToMajor(minor, currency).toFixed(currencyDecimals(currency))} ${currency}`;
}

/** A 13-digit ISBN with a valid check digit doubles as a GTIN. */
function gtinFromIsbn(isbn: string | null): string | null {
  const d = (isbn || "").replace(/[^0-9]/g, "");
  if (d.length !== 13) return null;
  const sum = d
    .slice(0, 12)
    .split("")
    .reduce((s, c, i) => s + Number(c) * (i % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === Number(d[12]) ? d : null;
}

export async function GET(request: Request) {
  const fr = new URL(request.url).searchParams.get("locale") === "fr";
  const l = fr ? "fr" : "en";
  const books = await prisma.book
    .findMany({
      where: { status: "PUBLISHED", kind: { in: ["BOOK", "REPORT"] }, fileId: { not: null }, coverImageId: { not: null } },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    })
    .catch(() => []);

  const items = books.map((b) => {
    const p = effectivePrice(b);
    const title = (fr && b.titleFr) || b.title;
    const description = (fr && b.descriptionFr) || b.description;
    const gtin = gtinFromIsbn(b.isbn);
    const lines = [
      `<g:id>${esc(b.id)}</g:id>`,
      `<g:title>${text(title, 150)}</g:title>`,
      `<g:description>${text(description, 5000)}</g:description>`,
      `<g:link>${esc(`${BASE_URL}/${l}/store/${b.slug}`)}</g:link>`,
      `<g:image_link>${esc(`${BASE_URL}/api/uploads/${b.coverImageId}`)}</g:image_link>`,
      `<g:availability>in_stock</g:availability>`,
      `<g:condition>new</g:condition>`,
      // The regular price; a running launch offer goes in sale_price.
      `<g:price>${money(p.regularCents ?? p.priceCents, b.currency)}</g:price>`,
      ...(p.onSale
        ? [
            `<g:sale_price>${money(p.priceCents, b.currency)}</g:sale_price>`,
            ...(b.saleEndsAt
              ? [`<g:sale_price_effective_date>${(b.saleStartsAt ?? new Date()).toISOString()}/${b.saleEndsAt.toISOString()}</g:sale_price_effective_date>`]
              : []),
          ]
        : []),
      `<g:brand>${text(b.author, 70)}</g:brand>`,
      gtin ? `<g:gtin>${gtin}</g:gtin>` : `<g:identifier_exists>no</g:identifier_exists>`,
      `<g:google_product_category>Media &gt; Books</g:google_product_category>`,
      `<g:product_type>${b.kind === "REPORT" ? (fr ? "Rapports" : "Reports") : fr ? "Livres numériques" : "E-books"}</g:product_type>`,
    ];
    return `    <item>\n      ${lines.join("\n      ")}\n    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc("KONAN Amani Dieudonné — Store")}</title>
    <link>${BASE_URL}/${l}/store</link>
    <description>${fr ? "Ouvrages et rapports numériques" : "Digital books and reports"}</description>
${items.join("\n")}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
