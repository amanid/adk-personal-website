"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight, Download, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useState, useEffect } from "react";
import ParticleBackground from "./ParticleBackground";
import TypingEffect from "./TypingEffect";

export default function HeroSection() {
  const t = useTranslations("hero");
  const [profilePhoto, setProfilePhoto] = useState("/images/profile.jpg");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings?.profilePhoto) setProfilePhoto(data.settings.profilePhoto);
      })
      .catch(() => {});
  }, []);

  const roles = [
    "Full-Stack Senior Statistician",
    "Data Science & Analytics Leader",
    "Machine Learning & AI Architect",
    "Data Engineering & Architecture Expert",
    "Full-Stack Developer & MLOps Engineer",
    "Econometrician & Causal Inference Specialist",
    "Strategic AI & Data Consultant",
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <ParticleBackground />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal via-transparent to-charcoal z-[1]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse-gold" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/3 rounded-full blur-3xl animate-pulse-gold" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Profile Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="shrink-0"
          >
            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-gold/40 shadow-2xl shadow-gold/10">
              <Image
                src={profilePhoto}
                alt="KONAN Amani Dieudonné"
                fill
                className="object-cover"
                priority
              />
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center md:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-gold mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>13+ Years of International Experience</span>
            </motion.div>

            {/* Greeting */}
            <p className="text-text-secondary text-lg mb-2">{t("greeting")}</p>

            {/* Name */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-display)] mb-4">
              <span className="gradient-text">{t("name")}</span>
            </h1>

            {/* Typing roles */}
            <div className="text-xl md:text-2xl text-text-secondary h-8 mb-6">
              <TypingEffect texts={roles} />
            </div>

            {/* Description */}
            <p className="text-text-secondary max-w-2xl text-base md:text-lg leading-relaxed mb-8">
              {t("description")}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center md:items-start gap-4">
              <Link
                href="/services"
                className="group flex items-center gap-2 px-8 py-3 bg-gold text-charcoal font-semibold rounded-lg hover:bg-gold-light transition-all duration-300 hover:shadow-lg hover:shadow-gold/20"
              >
                {t("cta_services")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-2 px-8 py-3 border border-gold/30 text-gold rounded-lg hover:bg-gold/10 transition-all duration-300"
              >
                {t("cta_contact")}
              </Link>
              <a
                href="/cv/CV-Amani-Konan-Senior-Data-Scientist.pdf"
                download
                className="flex items-center gap-2 px-6 py-3 text-text-secondary hover:text-gold transition-colors"
              >
                <Download className="w-4 h-4" />
                {t("download_cv")}
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="w-6 h-10 rounded-full border-2 border-gold/30 flex justify-center pt-2">
          <div className="w-1 h-2 bg-gold rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}
