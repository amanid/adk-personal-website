"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useState, useEffect } from "react";

interface HeroSectionProps {
  showCvDownload?: boolean;
  cvUrl?: string;
  /** The role with no end date, taken from the experience records. */
  currentRole?: { role: string; organization: string; location: string } | null;
}

/*
 * Editorial rather than ambient: no particles, glow orbs, typing effect or
 * bouncing scroll cue. The name carries the page, the roles are stated once,
 * and the portrait is captioned with the current position from the records.
 */
export default function HeroSection({ showCvDownload = false, cvUrl, currentRole }: HeroSectionProps) {
  const t = useTranslations("hero");
  // The owner's own role list, as written in messages/{en,fr}.json.
  const roles = t("roles").split("|").map((r) => r.trim()).filter(Boolean);
  const cacheBust = "v2";
  const [profilePhoto, setProfilePhoto] = useState(`/images/profile.jpg?${cacheBust}`);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings?.profilePhoto) {
          const url = data.settings.profilePhoto;
          setProfilePhoto(url.includes("?") ? url : `${url}?${cacheBust}`);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-glass-border">
      <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid md:grid-cols-12 gap-10 md:gap-12 items-end">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
            className="md:col-span-7 order-2 md:order-1"
          >
            <p className="eyebrow mb-6">{t("greeting")}</p>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold font-[family-name:var(--font-display)] leading-[0.95] tracking-tight mb-8">
              {t("name")}
            </h1>

            <ul className="flex flex-wrap gap-x-4 gap-y-2 mb-8 text-sm text-text-secondary" >
              {roles.map((r, i) => (
                <li key={r} className="flex items-center gap-4">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-gold" aria-hidden />}
                  {r}
                </li>
              ))}
            </ul>

            <p className="text-text-secondary max-w-2xl text-base md:text-lg leading-relaxed mb-10">
              {t("description")}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Link
                href="/services"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold text-charcoal font-semibold rounded-md hover:bg-gold-light transition-colors"
              >
                {t("cta_services")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-glass-border text-text-primary rounded-md hover:border-text-muted transition-colors"
              >
                {t("cta_contact")}
              </Link>
              {showCvDownload && (
                <a
                  href={cvUrl || "/cv/CV-Amani-Konan-Senior-Data-Scientist.pdf"}
                  download
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t("download_cv")}
                </a>
              )}
            </div>
          </motion.div>

          <motion.figure
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="md:col-span-5 order-1 md:order-2 max-w-xs sm:max-w-sm md:max-w-none"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-glass-border bg-surface-1">
              <Image
                src={profilePhoto}
                alt="KONAN Amani Dieudonné"
                fill
                // The source photo has a thin white strip on its bottom and right
                // edges; a slight zoom anchored top-left keeps it out of frame.
                className="object-cover scale-[1.04] origin-top-left"
                priority
                sizes="(max-width: 768px) 320px, 420px"
                unoptimized
              />
            </div>
            {currentRole && (
              <figcaption className="mt-3 flex gap-3 text-xs leading-relaxed">
                <span className="figure text-gold shrink-0 pt-px">●</span>
                <span className="text-text-secondary">
                  <span className="text-text-primary">{currentRole.role}</span>
                  <br />
                  {currentRole.organization} · {currentRole.location}
                </span>
              </figcaption>
            )}
          </motion.figure>
        </div>
      </div>
    </section>
  );
}
