"use client";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { safeJsonLd } from "@/lib/utils";
import { Link } from "@/i18n/routing";

// Never label a crumb with these nav keys: they are UI strings, not pages.
const NOT_PAGES = new Set(["language", "more", "logout"]);

export default function Breadcrumbs() {
  const pathname = usePathname();
  const locale = useLocale();
  const tNav = useTranslations("nav");

  // Remove locale prefix
  const path = pathname.replace(`/${locale}`, "") || "/";
  if (path === "/") return null;

  const segments = path.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => ({
    label:
      !NOT_PAGES.has(seg) && tNav.has(seg) ? tNav(seg) : decodeURIComponent(seg).replace(/-/g, " "),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  // BreadcrumbList structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: tNav("home"),
        item: `https://www.konanamanidieudonne.org/${locale}`,
      },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.label.charAt(0).toUpperCase() + c.label.slice(1),
        item: `https://www.konanamanidieudonne.org/${locale}${c.href}`,
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-text-muted">
          <li>
            <Link href="/" className="hover:text-text-primary transition-colors">
              {tNav("home")}
            </Link>
          </li>
          {crumbs.map((crumb) => {
            const label = crumb.label.charAt(0).toUpperCase() + crumb.label.slice(1);
            return (
              <li key={crumb.href} className="flex items-center gap-2 min-w-0">
                <span aria-hidden className="text-glass-border">/</span>
                {crumb.isLast ? (
                  <span aria-current="page" className="text-text-secondary truncate max-w-[200px]">
                    {label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="hover:text-text-primary transition-colors truncate max-w-[200px]">
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
