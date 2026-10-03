import { prisma } from "./prisma";
import type { z } from "zod";
import type { bundleSchema } from "./validations";

/** Every product in a bundle must exist and share the bundle's currency. */
export async function checkBundleBooks(input: z.infer<typeof bundleSchema>): Promise<string | null> {
  const ids = [...new Set(input.bookIds)];
  const books = await prisma.book.findMany({ where: { id: { in: ids } }, select: { id: true, currency: true, title: true } });
  if (books.length !== ids.length) return "Some selected products no longer exist.";
  const odd = books.find((b) => b.currency !== input.currency);
  if (odd) return `"${odd.title}" is priced in ${odd.currency}; a bundle is in one currency (${input.currency}).`;
  return null;
}
