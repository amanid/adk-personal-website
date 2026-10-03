import { prisma } from "./prisma";
import { effectivePrice } from "./pricing";

/**
 * Published bundles whose every product is itself purchasable, with the
 * "bought separately" value (at today's prices) the saving is measured from.
 */
export async function loadBundles(where: { slug?: string } = {}) {
  const bundles = await prisma.bundle.findMany({
    where: { status: "PUBLISHED", ...where },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      items: {
        include: {
          book: {
            select: {
              id: true,
              slug: true,
              title: true,
              titleFr: true,
              status: true,
              fileId: true,
              coverImageId: true,
              priceCents: true,
              salePriceCents: true,
              saleStartsAt: true,
              saleEndsAt: true,
              payWhatYouWant: true,
              kind: true,
              currency: true,
            },
          },
        },
      },
    },
  });
  return bundles
    .filter((b) => b.items.length > 0 && b.items.every((i) => i.book.status === "PUBLISHED" && i.book.fileId))
    .map((b) => {
      const separateCents = b.items.reduce((s, i) => s + effectivePrice(i.book).priceCents, 0);
      return { ...b, separateCents, savingCents: Math.max(0, separateCents - b.priceCents) };
    });
}

export type LoadedBundle = Awaited<ReturnType<typeof loadBundles>>[number];
