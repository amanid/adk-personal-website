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
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Robots-Tag", value: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://www.paypal.com https://www.paypalobjects.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' https: data: blob:",
      "connect-src 'self' https: https://www.google-analytics.com https://www.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com",
      "frame-src 'self' https://googleads.g.doubleclick.net https://www.paypal.com https://www.sandbox.paypal.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Keep these server-only parsers/image libs out of the bundle
  // (pdfjs/zip internals + native sharp/canvas binaries).
  serverExternalPackages: ["unpdf", "pdf-lib", "jszip", "sharp", "@napi-rs/canvas"],
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
