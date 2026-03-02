"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error" | "already_subscribed";

export default function NewsletterSignup() {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      });

      if (res.status === 409) {
        setStatus("already_subscribed");
        return;
      }

      if (!res.ok) throw new Error();

      setStatus("success");
      setEmail("");
      setName("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="mb-4">
      <h5 className="text-sm font-semibold text-text-primary mb-2">
        {t("title")}
      </h5>
      <p className="text-xs text-text-muted mb-3">{t("subtitle")}</p>

      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-3 py-2.5 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-xs"
          >
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{t("success")}</span>
          </motion.div>
        ) : status === "already_subscribed" ? (
          <motion.div
            key="already"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-3 py-2.5 bg-gold/10 border border-gold/30 rounded-lg text-gold text-xs"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{t("already")}</span>
          </motion.div>
        ) : status === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 px-3 py-2.5 mb-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{t("error")}</span>
            </div>
            <button
              onClick={() => setStatus("idle")}
              className="text-xs text-gold hover:underline"
            >
              {t("subscribe")}
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-2"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("placeholder_email")}
              required
              className="w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-lg text-text-primary text-xs placeholder:text-text-muted focus:border-gold/50 focus:outline-none transition-colors"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("placeholder_name")}
              className="w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-lg text-text-primary text-xs placeholder:text-text-muted focus:border-gold/50 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-xs disabled:opacity-50"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t("subscribing")}
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  {t("subscribe")}
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
