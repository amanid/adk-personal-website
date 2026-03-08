"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, Record<string, string>> = {
  en: {
    about: "About",
    experience: "Experience",
    services: "Services",
    projects: "Projects",
    publications: "Publications",
    blog: "Blog",
    qa: "Q&A",
    contact: "Contact",
    research: "Research",
  },
  fr: {
    about: "À propos",
    experience: "Expérience",
    services: "Services",
    projects: "Projets",
    publications: "Publications",
    blog: "Blog",
    qa: "Q&R",
    contact: "Contact",
    research: "Recherche",
  },
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const locale = useLocale();

  // Remove locale prefix
  const path = pathname.replace(`/${locale}`, "") || "/";
  if (path === "/") return null;

  const segments = path.split("/").filter(Boolean);
  const labels = LABELS[locale] || LABELS.en;

  const crumbs = segments.map((seg, i) => ({
    label: labels[seg] || decodeURIComponent(seg).replace(/-/g, " "),
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
        name: "Home",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex items-center gap-1 text-xs text-text-muted">
          <li>
            <Link href="/" className="hover:text-gold transition-colors flex items-center gap-1">
              <Home className="w-3 h-3" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          {crumbs.map((crumb) => (
            <li key={crumb.href} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />
              {crumb.isLast ? (
                <span className="text-text-secondary font-medium truncate max-w-[200px]">
                  {crumb.label.charAt(0).toUpperCase() + crumb.label.slice(1)}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-gold transition-colors truncate max-w-[200px]">
                  {crumb.label.charAt(0).toUpperCase() + crumb.label.slice(1)}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
