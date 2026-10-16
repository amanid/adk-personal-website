"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, BookOpen, Briefcase, User, ArrowRight, X } from "lucide-react";
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
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
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

  // Remember what had focus before opening and hand it back on close, as the
  // cart drawer does, so a keyboard user lands where they started.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open]);

  // Reset the palette state each time it is opened.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  // Keep the highlighted option in view while arrowing through a long list.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`#search-option-${selectedIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keep Tab inside the dialog (same trap as the cart drawer). Escape is
    // handled by the global listener above.
    if (e.key === "Tab") {
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center min-h-11 min-w-11 text-text-secondary hover:text-gold rounded-[var(--radius-md)] hover:bg-[var(--hover-wash)] transition-colors"
        aria-label="Search"
        aria-haspopup="dialog"
      >
        <Search className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] p-4 bg-charcoal/80 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={locale === "fr" ? "Rechercher sur le site" : "Search the site"}
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.15 }}
              className="glass-strong w-full max-w-lg overflow-hidden rounded-[var(--radius-md)] border border-glass-border shadow-[var(--elev-lg)]"
              onKeyDown={handleKeyDown}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 pl-4 pr-1.5 border-b border-glass-border">
                <Search aria-hidden="true" className="w-5 h-5 text-text-muted shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  role="combobox"
                  aria-expanded={results.length > 0}
                  aria-controls="search-results"
                  aria-autocomplete="list"
                  aria-activedescendant={results[selectedIndex] ? `search-option-${selectedIndex}` : undefined}
                  aria-label={locale === "fr" ? "Rechercher" : "Search"}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder={locale === "fr" ? "Rechercher pages et publications…" : "Search pages and publications…"}
                  className="flex-1 min-w-0 min-h-14 bg-transparent text-text-primary focus:outline-none text-base sm:text-sm placeholder:text-text-muted"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={locale === "fr" ? "Fermer" : "Close"}
                  className="flex items-center justify-center min-h-11 min-w-11 rounded-[var(--radius-md)] text-text-muted hover:text-text-primary hover:bg-[var(--hover-wash)] transition-colors shrink-0"
                >
                  <X aria-hidden="true" className="w-4 h-4" />
                </button>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-2">
                {results.length === 0 ? (
                  <p role="status" className="py-8 text-center text-text-muted text-sm">
                    {locale === "fr" ? "Aucun résultat" : "No results found"}
                  </p>
                ) : (
                  <div
                    id="search-results"
                    role="listbox"
                    aria-label={locale === "fr" ? "Résultats" : "Results"}
                  >
                    {results.map((result, i) => (
                      <div
                        key={`${result.type}-${result.href}`}
                        id={`search-option-${i}`}
                        role="option"
                        aria-selected={i === selectedIndex}
                        onClick={() => handleSelect(result)}
                        onMouseMove={() => i !== selectedIndex && setSelectedIndex(i)}
                        className={`w-full flex items-center gap-3 min-h-11 px-3 py-2 rounded-[var(--radius-md)] text-left cursor-pointer transition-colors ${
                          i === selectedIndex
                            ? "bg-[var(--hover-wash)] text-text-primary"
                            : "text-text-secondary"
                        }`}
                      >
                        <result.icon aria-hidden="true" className={`w-4 h-4 shrink-0 ${i === selectedIndex ? "text-gold" : ""}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="font-mono text-xs text-text-muted truncate">{result.subtitle}</p>
                          )}
                        </div>
                        <ArrowRight aria-hidden="true" className={`w-3.5 h-3.5 shrink-0 ${i === selectedIndex ? "opacity-70" : "opacity-0"}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer hint (pointer/keyboard users only) */}
              <div className="hidden sm:flex px-4 py-2.5 border-t border-glass-border items-center gap-4 text-xs text-text-muted" aria-hidden="true">
                <span className="flex items-center gap-1.5">
                  <kbd className="font-mono px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-navy border border-glass-border">↑↓</kbd>
                  {locale === "fr" ? "naviguer" : "navigate"}
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="font-mono px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-navy border border-glass-border">↵</kbd>
                  {locale === "fr" ? "ouvrir" : "open"}
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="font-mono px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-navy border border-glass-border">esc</kbd>
                  {locale === "fr" ? "fermer" : "close"}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
