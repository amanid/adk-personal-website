import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()" },
  // "0" is the current recommendation: the legacy XSS auditor this enabled
  // could itself be abused to selectively disable scripts on a page.
  { key: "X-XSS-Protection", value: "0" },
  // allow-popups: PayPal's checkout runs in a popup that must reach its opener.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Robots-Tag", value: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-eval' only in development (React Refresh needs it); production
      // Next.js, GA and the PayPal SDK run without it. 'unsafe-inline' stays:
      // removing it needs per-request nonces, i.e. no static/ISR pages, which
      // the 512MB host can't afford.
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"} https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://www.paypal.com https://*.paypal.com https://www.paypalobjects.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' https: data: blob:",
      // Only the hosts the browser code actually talks to (was "https:", any host).
      "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://stats.g.doubleclick.net https://pagead2.googlesyndication.com https://*.paypal.com https://*.paypalobjects.com",
      "frame-src 'self' https://googleads.g.doubleclick.net https://*.paypal.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      // Production only: on http://localhost it would rewrite dev requests to https.
      ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Keep these server-only parsers/image libs out of the bundle
  // (pdfjs/zip internals + native sharp/canvas binaries).
  serverExternalPackages: ["unpdf", "pdf-lib", "jszip", "sharp", "@napi-rs/canvas"],
  experimental: {
    // /api/admin requests pass through the middleware's admin gate, which
    // buffers the body and by default cuts it off at 10MB, breaking every
    // larger book upload ("Failed to parse body as FormData"). Cloudflare
    // already caps request bodies at 100MB, so match that.
    proxyClientMaxBodySize: "100mb",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "www.konanamanidieudonne.org" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    const noIndex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Keep private/utility routes out of search indexes (the global header
      // above allows indexing; a noindex directive here wins where they overlap).
      { source: "/:locale(en|fr)/admin/:path*", headers: noIndex },
      { source: "/:locale(en|fr)/admin", headers: noIndex },
      { source: "/:locale(en|fr)/auth/:path*", headers: noIndex },
      { source: "/:locale(en|fr)/store/cart", headers: noIndex },
      { source: "/:locale(en|fr)/store/receipt/:path*", headers: noIndex },
    ];
  },
};

export default withNextIntl(nextConfig);
