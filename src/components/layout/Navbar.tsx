"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, LogIn, LogOut, Shield, ChevronDown } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import SearchPalette from "@/components/SearchPalette";
import CartButton from "@/components/store/CartButton";

// Six primary destinations fit on a laptop; the rest sit under "More".
const primaryItems = [
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "projects", href: "/projects" },
  { key: "publications", href: "/publications" },
  { key: "store", href: "/store" },
  { key: "blog", href: "/blog" },
];

const moreItems = [
  { key: "experience", href: "/experience" },
  { key: "research", href: "/research" },
  { key: "dba", href: "/dba" },
  { key: "qa", href: "/qa" },
  { key: "topics", href: "/topics" },
];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export default function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();

  const switchLocale = () => {
    router.replace(pathname, { locale: locale === "en" ? "fr" : "en" });
  };

  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  const moreActive = moreItems.some((i) => isActive(pathname, i.href));

  // Escape closes either menu; a click outside closes "More".
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMoreOpen(false);
        setMobileOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const linkClass = (href: string) =>
    cn(
      "relative px-3 py-2 text-sm transition-colors whitespace-nowrap",
      "after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-px after:bg-gold after:transition-transform after:origin-left",
      isActive(pathname, href)
        ? "text-text-primary after:scale-x-100"
        : "text-text-secondary hover:text-text-primary after:scale-x-0"
    );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong" aria-label="Main">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="inline-flex items-center min-h-11 px-1 -mx-1 font-display text-2xl leading-none tracking-tight shrink-0" aria-label="KONAN Amani Dieudonné, home">
            ADK<span className="text-gold">.</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center">
            {primaryItems.map((item) => (
              <Link key={item.key} href={item.href} className={linkClass(item.href)}>
                {t(item.key)}
              </Link>
            ))}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen((o) => !o)}
                aria-expanded={moreOpen}
                aria-controls="nav-more"
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-sm transition-colors",
                  moreActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
                )}
              >
                {t("more")}
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", moreOpen && "rotate-180")} />
              </button>
              {moreOpen && (
                <ul
                  id="nav-more"
                  className="absolute left-0 top-full mt-2 min-w-52 card p-1.5 shadow-[var(--elev-lg)]"
                >
                  {moreItems.map((item) => (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex items-center min-h-10 px-3 rounded-[var(--radius-sm)] text-sm transition-colors",
                          isActive(pathname, item.href)
                            ? "text-gold bg-[var(--hover-wash)]"
                            : "text-text-secondary hover:text-text-primary hover:bg-[var(--hover-wash)]"
                        )}
                      >
                        {t(item.key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-1 px-3 py-2 text-sm text-gold">
                <Shield className="w-3.5 h-3.5" />
                {t("admin")}
              </Link>
            )}
          </div>

          {/* Right cluster: search and cart at every width (one SearchPalette
              only, since it owns the global ⌘K shortcut). */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={switchLocale}
              className="hidden lg:flex items-center gap-1 min-h-11 px-2.5 text-sm text-text-secondary hover:text-text-primary rounded-[var(--radius-md)] hover:bg-[var(--hover-wash)] transition-colors"
              aria-label={locale === "en" ? "Passer en français" : "Switch to English"}
            >
              <Globe className="w-4 h-4" />
              {t("language")}
            </button>
            <SearchPalette />
            <CartButton compact />
            <div className="hidden lg:block">
              <ThemeSwitcher />
            </div>
            <div className="hidden lg:flex items-center gap-2 ml-2">
              {session ? (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-1.5 min-h-11 px-3 text-sm text-text-secondary hover:text-text-primary"
                >
                  <LogOut className="w-4 h-4" />
                  {t("logout")}
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 min-h-11 px-3 text-sm text-text-secondary hover:text-text-primary"
                >
                  <LogIn className="w-4 h-4" />
                  {t("login")}
                </Link>
              )}
              <ButtonLink href="/contact" size="sm">
                {t("contact")}
              </ButtonLink>
            </div>
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden flex items-center justify-center min-h-11 min-w-11 text-text-secondary hover:text-text-primary"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-glass-border overflow-y-auto max-h-[calc(100dvh-4rem)]"
          >
            <ul className="px-4 py-3">
              {[{ key: "home", href: "/" }, ...primaryItems, ...moreItems, { key: "contact", href: "/contact" }].map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center min-h-12 px-3 text-base rounded-[var(--radius-md)] transition-colors",
                      isActive(pathname, item.href)
                        ? "text-gold bg-[var(--hover-wash)]"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
              {isAdmin && (
                <li>
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 min-h-12 px-3 text-base text-gold">
                    <Shield className="w-4 h-4" />
                    {t("admin")}
                  </Link>
                </li>
              )}
            </ul>
            <div className="px-4 py-3 border-t border-glass-border flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={switchLocale}
                  className="flex items-center gap-1.5 min-h-11 px-3 text-sm text-text-secondary hover:text-text-primary"
                >
                  <Globe className="w-4 h-4" />
                  {t("language")}
                </button>
                <ThemeSwitcher />
              </div>
              {session ? (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-1.5 min-h-11 px-3 text-sm text-text-secondary hover:text-text-primary"
                >
                  <LogOut className="w-4 h-4" />
                  {t("logout")}
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-1.5 min-h-11 px-3 text-sm text-text-secondary hover:text-text-primary"
                >
                  <LogIn className="w-4 h-4" />
                  {t("login")}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
