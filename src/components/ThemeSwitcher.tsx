"use client";

import { useState, useRef, useEffect, useId } from "react";
import { useLocale } from "next-intl";
import { Palette, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";
import { themes } from "@/lib/themes";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // Close on a click or tap outside, and on Escape (returning focus to the
  // button so the keyboard user is not dropped at the top of the page).
  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center gap-1 min-h-11 min-w-11 text-sm text-text-secondary hover:text-gold rounded-[var(--radius-md)] hover:bg-[var(--hover-wash)] transition-colors"
        aria-label="Switch theme"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
      >
        <Palette aria-hidden="true" className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="card absolute right-0 top-full mt-2 w-60 max-w-[90vw] p-1.5 shadow-[var(--elev-lg)] z-50"
            id={panelId}
            role="group"
            aria-label={locale === "fr" ? "Thèmes" : "Themes"}
          >
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={theme === t.id}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 min-h-11 px-3 rounded-[var(--radius-sm)] hover:bg-[var(--hover-wash)] transition-colors text-left"
              >
                <div className="flex gap-1" aria-hidden="true">
                  <span
                    className="w-4 h-4 rounded-full border border-glass-border"
                    style={{ backgroundColor: t.swatch[0] }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-glass-border"
                    style={{ backgroundColor: t.swatch[1] }}
                  />
                </div>
                <span className={`text-sm flex-1 ${theme === t.id ? "text-text-primary" : "text-text-secondary"}`}>
                  {locale === "fr" ? t.labelFr : t.label}
                </span>
                {theme === t.id && (
                  <Check aria-hidden="true" className="w-4 h-4 text-gold" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
