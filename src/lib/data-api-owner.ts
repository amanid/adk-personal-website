import { prisma } from "./prisma";

/** The key behind a manage-page token (the token is the owner's credential). */
export async function keyByManageToken(token: string) {
  if (!token || token.length > 100) return null;
  return prisma.apiKey.findUnique({ where: { manageToken: token } });
}
