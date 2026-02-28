"use client";

import { useState, useRef, useEffect } from "react";
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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-secondary hover:text-gold rounded-lg hover:bg-white/5 transition-all"
        aria-label="Switch theme"
      >
        <Palette className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-xl p-2 shadow-xl z-50"
          >
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-left"
              >
                <div className="flex gap-1">
                  <span
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: t.swatch[0] }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: t.swatch[1] }}
                  />
                </div>
                <span className="text-sm text-text-secondary flex-1">
                  {locale === "fr" ? t.labelFr : t.label}
                </span>
                {theme === t.id && (
                  <Check className="w-4 h-4 text-gold" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
