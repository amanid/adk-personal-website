import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

/**
 * A second, central admin gate. Every /api/admin handler already checks the
 * role itself; this means a future handler that forgets to is still not
 * reachable. It reads the signed session JWT only — no database — so it is
 * cheap and runs at the edge.
 */
async function isAdmin(request: NextRequest): Promise<boolean> {
  // TLS ends at the proxy, so the protocol seen here can't be trusted to say
  // whether next-auth used the __Secure- cookie name; try both.
  for (const secureCookie of [true, false]) {
    try {
      const token = await getToken({ req: request, secret: process.env.AUTH_SECRET, secureCookie });
      if (token) return token.role === "ADMIN";
    } catch {
      /* try the other cookie name */
    }
  }
  return false;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/admin")) {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const adminPage = pathname.match(/^\/(en|fr)\/admin(\/|$)/);
  if (adminPage && !(await isAdmin(request))) {
    const login = new URL(`/${adminPage[1]}/auth/login`, request.url);
    return NextResponse.redirect(login);
  }

  return intl(request);
}

export const config = {
  matcher: ["/", "/(en|fr)/:path*", "/api/admin/:path*"],
};
