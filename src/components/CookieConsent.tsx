"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { useLocale } from "next-intl";

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
    // Enable analytics after consent
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).gtag) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
      });
    }
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50"
        >
          <div className="glass rounded-2xl p-5 shadow-2xl border border-glass-border">
            <div className="flex items-start gap-3">
              <Cookie className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-text-secondary leading-relaxed mb-3">
                  {locale === "fr"
                    ? "Ce site utilise des cookies pour améliorer votre expérience et analyser le trafic."
                    : "This site uses cookies to enhance your experience and analyze traffic."}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={accept}
                    className="px-4 py-1.5 bg-gold text-charcoal text-xs font-semibold rounded-lg hover:bg-gold-light transition-colors"
                  >
                    {locale === "fr" ? "Accepter" : "Accept"}
                  </button>
                  <button
                    onClick={decline}
                    className="px-4 py-1.5 glass text-xs text-text-muted hover:text-text-primary rounded-lg transition-colors"
                  >
                    {locale === "fr" ? "Refuser" : "Decline"}
                  </button>
                </div>
              </div>
              <button onClick={decline} className="text-text-muted hover:text-text-primary shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
