"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, BookOpen, Briefcase, User, ArrowRight, Command, X } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { publications } from "@/data/publications";

interface SearchResult {
  type: "page" | "publication" | "blog";
  title: string;
  href: string;
  subtitle?: string;
  icon: typeof Search;
}

const PAGES: SearchResult[] = [
  { type: "page", title: "Home", href: "/", icon: User },
  { type: "page", title: "About", href: "/about", icon: User },
  { type: "page", title: "Experience", href: "/experience", icon: Briefcase },
  { type: "page", title: "Services", href: "/services", icon: Briefcase },
  { type: "page", title: "Projects", href: "/projects", icon: FileText },
  { type: "page", title: "Publications", href: "/publications", icon: BookOpen },
  { type: "page", title: "Research", href: "/research", icon: BookOpen },
  { type: "page", title: "Blog", href: "/blog", icon: FileText },
  { type: "page", title: "Contact", href: "/contact", icon: User },
];

export default function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const locale = useLocale();

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useCallback((): SearchResult[] => {
    if (!query.trim()) return PAGES;
    const q = query.toLowerCase();

    const pageResults = PAGES.filter((p) => p.title.toLowerCase().includes(q));

    const pubResults: SearchResult[] = publications
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (locale === "fr" ? p.titleFr : p.title).toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.authors.some((a) => a.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map((p) => ({
        type: "publication" as const,
        title: locale === "fr" ? p.titleFr : p.title,
        href: `/publications/${p.slug}`,
        subtitle: `${p.year} · ${p.authors[0]}`,
        icon: BookOpen,
      }));

    return [...pageResults, ...pubResults];
  }, [query, locale])();

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <>
      {/* Trigger button for mobile */}
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-text-secondary hover:text-gold transition-colors"
        aria-label="Search"
      >
        <Search className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 bg-charcoal/80 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="w-full max-w-lg glass rounded-2xl overflow-hidden shadow-2xl"
              onKeyDown={handleKeyDown}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-glass-border">
                <Search className="w-5 h-5 text-text-muted shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder={locale === "fr" ? "Rechercher..." : "Search pages, publications..."}
                  className="flex-1 bg-transparent text-text-primary focus:outline-none text-sm placeholder:text-text-muted"
                />
                <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-navy/50 text-text-muted text-[10px] border border-glass-border">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[50vh] overflow-y-auto p-2">
                {results.length === 0 ? (
                  <div className="py-8 text-center text-text-muted text-sm">
                    {locale === "fr" ? "Aucun résultat" : "No results found"}
                  </div>
                ) : (
                  results.map((result, i) => (
                    <button
                      key={`${result.type}-${result.href}`}
                      onClick={() => handleSelect(result)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        i === selectedIndex
                          ? "bg-gold/10 text-gold"
                          : "text-text-secondary hover:bg-gold/5"
                      }`}
                    >
                      <result.icon className="w-4 h-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-text-muted truncate">{result.subtitle}</p>
                        )}
                      </div>
                      <ArrowRight className="w-3 h-3 shrink-0 opacity-50" />
                    </button>
                  ))
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2 border-t border-glass-border flex items-center gap-4 text-[10px] text-text-muted">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-navy/50 border border-glass-border">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-navy/50 border border-glass-border">↵</kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-navy/50 border border-glass-border">esc</kbd>
                  close
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
