import { prisma } from "./prisma";

/** Look up a quote by its client token; null for anything malformed or unknown. */
export async function quoteByToken(token: string) {
  if (!token || token.length > 100) return null;
  return prisma.quote.findUnique({ where: { token } });
}
