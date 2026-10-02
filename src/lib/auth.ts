import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { clientIp, rateLimitKey } from "./rate-limit";

// Brute-force protection for the credentials provider, at three levels:
//  - email + IP: 5 failures lock that pair out. Keying on the pair means a
//    stranger can no longer lock the real owner out of their own account.
//  - email alone: a much higher ceiling, for guessing spread across many IPs.
//  - IP alone (rateLimitKey below): caps password spraying across accounts.
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_MAX_ATTEMPTS_PER_EMAIL = 50;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function loginAllowed(key: string, max = LOGIN_MAX_ATTEMPTS): boolean {
  const entry = loginAttempts.get(key);
  if (!entry || Date.now() > entry.resetAt) return true;
  return entry.count < max;
}

function recordLoginFailure(key: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    entry.count++;
  }
}

function clearLoginFailures(key: string): void {
  loginAttempts.delete(key);
}

// A bcrypt hash compared against when the account doesn't exist (or has no
// password), so "no such user" takes as long as "wrong password". It must be a
// VALID hash at the SAME cost as real ones: the previous hard-coded string was
// 59 characters, which bcrypt rejects in about a millisecond, so the timing
// difference it was meant to hide was ~50x. Generated once, lazily.
let dummyHash: string | null = null;
function getDummyHash(): string {
  dummyHash ??= bcrypt.hashSync(crypto.randomUUID(), 12);
  return dummyHash;
}

// How often a session re-reads its role, so a demoted or deleted account loses
// access within minutes rather than at token expiry.
const ROLE_REFRESH_MS = 5 * 60 * 1000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;
        if (typeof credentials.email !== "string" || typeof credentials.password !== "string") return null;
        // bcrypt only reads 72 bytes; refuse anything absurd before hashing.
        if (credentials.email.length > 254 || credentials.password.length > 256) return null;

        const email = credentials.email.toLowerCase().trim();
        const ip = (request instanceof Request ? clientIp(request) : null) || "unknown";
        const pairKey = `${email}|${ip}`;
        const emailKey = `${email}|*`;

        // Throttle repeated failures to blunt password guessing.
        if (rateLimitKey(`login-ip:${ip}`, { limit: 30, windowSeconds: 15 * 60 })) return null;
        if (!loginAllowed(pairKey) || !loginAllowed(emailKey, LOGIN_MAX_ATTEMPTS_PER_EMAIL)) return null;

        // Emails were historically stored as typed, so match case-insensitively.
        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });

        // Always run a bcrypt comparison (against a dummy hash when the user or
        // password is absent) so success and failure take the same time — this
        // denies a timing oracle for account enumeration.
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user?.hashedPassword || getDummyHash()
        );

        if (!user || !user.hashedPassword || !isValid) {
          recordLoginFailure(pairKey);
          recordLoginFailure(emailKey);
          return null;
        }

        clearLoginFailures(pairKey);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      // Read the role from the DB — Google users arrive without one — and keep
      // re-reading it, so a demotion or deletion takes effect within minutes.
      const checkedAt = typeof token.roleCheckedAt === "number" ? token.roleCheckedAt : 0;
      if (token.email && (!token.role || Date.now() - checkedAt > ROLE_REFRESH_MS)) {
        const dbUser = await prisma.user.findFirst({
          where: { email: { equals: token.email, mode: "insensitive" } },
          select: { id: true, role: true },
        });
        // Account deleted: end the session.
        if (!dbUser) return null;
        token.role = dbUser.role;
        token.id = token.id || dbUser.id;
        token.roleCheckedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // Sessions are matched to accounts by email, so only accept an email
        // Google has verified.
        if (!user.email || profile?.email_verified !== true) return false;

        const existingUser = await prisma.user.findFirst({
          where: { email: { equals: user.email, mode: "insensitive" } },
          include: { accounts: { where: { provider: "google" }, select: { id: true } } },
        });

        // Pre-hijack defence. Password sign-up never verifies the email, so a
        // stranger could register someone's address, wait for the real owner
        // to arrive through Google, and keep a password into the account they
        // then use. The first verified Google sign-in therefore invalidates a
        // password it did not set. Admin accounts are exempt: they are created
        // by the operator, not by public sign-up.
        if (
          existingUser &&
          existingUser.accounts.length === 0 &&
          existingUser.hashedPassword &&
          existingUser.role !== "ADMIN"
        ) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              hashedPassword: null,
              accounts: {
                create: {
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
            },
          });
        }

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              accounts: {
                create: {
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              },
            },
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
});
