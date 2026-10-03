import type { Book, Publication } from "@prisma/client";
import { BASE_URL } from "./seo";
import { effectivePrice } from "./pricing";
import { fileFormatLabel } from "./utils";

/** Public API shape of a publication: metadata only, never a file URL. */
export function serializePublication(p: Publication) {
  return {
    slug: p.slug,
    title: p.title,
    title_fr: p.titleFr,
    abstract: p.abstract,
    abstract_fr: p.abstractFr,
    authors: p.authors,
    year: p.year,
    month: p.month,
    type: p.publicationType,
    category: p.category,
    tags: p.tags,
    journal: p.journal,
    publisher: p.publisher,
    institution: p.institution,
    doi: p.doi,
    citation_count: p.citationCount,
    access: p.accessLevel === "GATED" ? "subscription" : "free",
    url: `${BASE_URL}/en/publications/${p.slug}`,
    updated_at: p.updatedAt.toISOString(),
  };
}

export function serializeDataset(b: Book, sizeBytes: number | null) {
  const price = effectivePrice(b);
  return {
    slug: b.slug,
    title: b.title,
    title_fr: b.titleFr,
    description: b.description,
    category: b.category,
    tags: b.tags,
    year: b.publicationYear,
    format: fileFormatLabel(b.fileMimeType),
    size_bytes: sizeBytes,
    price_cents: price.priceCents,
    currency: b.currency,
    store_url: `${BASE_URL}/en/store/${b.slug}`,
    download_endpoint: `/api/v1/datasets/${b.slug}/download`,
    updated_at: b.updatedAt.toISOString(),
  };
}
