"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";
import { Download, X, Check } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/Button";

interface LeadMagnetProps {
  title: string;
  description: string;
  pdfUrl: string;
  buttonText?: string;
}

const field =
  "w-full min-h-11 px-4 py-2.5 rounded-[var(--radius-md)] bg-navy border border-glass-border text-text-primary text-sm " +
  "placeholder:text-text-muted focus:border-gold focus:outline-none transition-colors";

export default function LeadMagnet({ title, description, pdfUrl, buttonText }: LeadMagnetProps) {
  const fr = useLocale() === "fr";
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;

  const L = fr
    ? {
        open: buttonText ?? "Télécharger le rapport gratuit",
        close: "Fermer",
        name: "Votre nom (facultatif)",
        email: "Votre adresse email",
        submit: "Recevoir le rapport",
        consent: "En téléchargeant, vous acceptez de recevoir des emails occasionnels. Désinscription possible à tout moment.",
        doneTitle: "Téléchargement en cours",
        doneText: "Le téléchargement devrait démarrer tout seul. Sinon, utilisez le bouton ci-dessous.",
        doneCta: "Télécharger",
      }
    : {
        open: buttonText ?? "Download the free report",
        close: "Close",
        name: "Your name (optional)",
        email: "Your email address",
        submit: "Get the report",
        consent: "By downloading, you agree to receive occasional emails. You can unsubscribe at any time.",
        doneTitle: "Your download is starting",
        doneText: "The download should start on its own. If it doesn't, use the button below.",
        doneCta: "Download",
      };

  const close = () => setShowModal(false);

  // Escape closes, Tab stays inside the dialog, and focus returns to the
  // opener on close (same pattern as the cart drawer in StoreUI).
  useEffect(() => {
    if (!showModal) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => el.offsetParent !== null);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) {
        e.preventDefault();
        panelRef.current?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    // Move focus into the dialog: the first field, or the panel itself.
    requestAnimationFrame(() => {
      const target = panelRef.current?.querySelector<HTMLElement>("input") ?? panelRef.current;
      target?.focus();
    });
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [showModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Subscribe the user
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      });
      setSubmitted(true);
      // Track conversion
      if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).gtag) {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "lead_magnet_download", {
          event_category: "conversion",
          event_label: title,
        });
      }
      // Auto-download after short delay
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = "";
        link.click();
      }, 1000);
    } catch {
      // Still allow download
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type="button" onClick={() => setShowModal(true)} aria-haspopup="dialog">
        <Download className="w-4 h-4" aria-hidden />
        {L.open}
      </Button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && close()}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descId}
              tabIndex={-1}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="card bg-surface-1 p-6 md:p-8 max-w-md w-full relative focus:outline-none"
            >
              <button
                type="button"
                onClick={close}
                aria-label={L.close}
                className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-[var(--radius-md)] text-text-muted hover:text-text-primary hover:bg-[var(--hover-wash)] transition-colors"
              >
                <X className="w-5 h-5" aria-hidden />
              </button>

              {!submitted ? (
                <>
                  <h2 id={titleId} className="font-display text-2xl leading-tight pr-10 mb-2">
                    {title}
                  </h2>
                  <p id={descId} className="text-text-secondary text-sm mb-6">
                    {description}
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor={`${uid}-email`} className="block text-sm text-text-secondary mb-1.5">
                        {L.email} <span aria-hidden>*</span>
                      </label>
                      <input
                        id={`${uid}-email`}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        className={field}
                      />
                    </div>
                    <div>
                      <label htmlFor={`${uid}-name`} className="block text-sm text-text-secondary mb-1.5">
                        {L.name}
                      </label>
                      <input
                        id={`${uid}-name`}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        className={field}
                      />
                    </div>
                    <Button type="submit" size="lg" loading={loading} className="w-full">
                      {!loading && <Download className="w-4 h-4" aria-hidden />}
                      {L.submit}
                    </Button>
                    <p className="text-text-muted text-xs">{L.consent}</p>
                  </form>
                </>
              ) : (
                <div role="status">
                  <Check className="w-8 h-8 text-success mb-4" aria-hidden />
                  <h2 id={titleId} className="font-display text-2xl leading-tight pr-10 mb-2">
                    {L.doneTitle}
                  </h2>
                  <p id={descId} className="text-text-secondary text-sm mb-6">
                    {L.doneText}
                  </p>
                  <a href={pdfUrl} download className={buttonClass("primary", "md")}>
                    <Download className="w-4 h-4" aria-hidden />
                    {L.doneCta}
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
