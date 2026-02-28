"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, LogIn, LogOut, User, Shield } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import ThemeSwitcher from "@/components/ThemeSwitcher";

const navItems = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "experience", href: "/experience" },
  { key: "services", href: "/services" },
  { key: "projects", href: "/projects" },
  { key: "publications", href: "/publications" },
  { key: "blog", href: "/blog" },
  { key: "qa", href: "/qa" },
  { key: "contact", href: "/contact" },
];

export default function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const locale = useLocale();
  const switchLocale = () => {
    const newLocale = locale === "en" ? "fr" : "en";
    router.replace(pathname, { locale: newLocale });
  };

  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold font-[family-name:var(--font-display)]">
              <span className="gradient-text">ADK</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300",
                  pathname === item.href
                    ? "text-gold bg-gold/10"
                    : "text-text-secondary hover:text-gold hover:bg-white/5"
                )}
              >
                {t(item.key)}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-2 text-sm font-medium rounded-lg text-gold hover:bg-gold/10 transition-all flex items-center gap-1"
              >
                <Shield className="w-3 h-3" />
                {t("admin")}
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center space-x-3">
            <button
              onClick={switchLocale}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-secondary hover:text-gold rounded-lg hover:bg-white/5 transition-all"
              aria-label="Switch language"
            >
              <Globe className="w-4 h-4" />
              {t("language")}
            </button>

            <ThemeSwitcher />

            {session ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">
                  <User className="w-4 h-4 inline mr-1" />
                  {session.user?.name?.split(" ")[0]}
                </span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-glass-border rounded-lg hover:border-gold/50 hover:text-gold transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  {t("logout")}
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-1 px-4 py-1.5 text-sm bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all"
              >
                <LogIn className="w-4 h-4" />
                {t("login")}
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-text-secondary hover:text-gold transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-strong border-t border-glass-border"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block px-3 py-2 text-sm font-medium rounded-lg transition-all",
                    pathname === item.href
                      ? "text-gold bg-gold/10"
                      : "text-text-secondary hover:text-gold"
                  )}
                >
                  {t(item.key)}
                </Link>
              ))}
              <div className="pt-2 border-t border-glass-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={switchLocale}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-gold"
                  >
                    <Globe className="w-4 h-4" />
                    {t("language")}
                  </button>
                  <ThemeSwitcher />
                </div>
                {session ? (
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-gold"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("logout")}
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-1 px-4 py-1.5 text-sm bg-gold text-charcoal font-medium rounded-lg"
                  >
                    <LogIn className="w-4 h-4" />
                    {t("login")}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
