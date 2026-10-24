import { createHash } from "crypto";
import { prisma } from "./prisma";

/** SHA-256 of a manage token: what is stored, so a database read yields no usable credential. */
export const hashManageToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * The key behind a manage-page token (the token is the owner's credential).
 * Tokens are stored hashed. Rows written before hashing still hold the plain
 * token; they are recognised once more and rewritten as a hash on the spot.
 */
export async function keyByManageToken(token: string) {
  if (!token || token.length > 100) return null;
  const hashed = await prisma.apiKey.findUnique({ where: { manageToken: hashManageToken(token) } });
  if (hashed) return hashed;
  const legacy = await prisma.apiKey.findUnique({ where: { manageToken: token } });
  if (!legacy) return null;
  return prisma.apiKey.update({ where: { id: legacy.id }, data: { manageToken: hashManageToken(token) } });
}
