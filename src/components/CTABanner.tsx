"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLocale } from "next-intl";

interface CTABannerProps {
  variant?: "consulting" | "newsletter" | "services" | "premium";
}

export default function CTABanner({ variant = "consulting" }: CTABannerProps) {
  const locale = useLocale();

  const content = {
    consulting: {
      badge: locale === "fr" ? "Services de Conseil" : "Consulting Services",
      title: locale === "fr"
        ? "Besoin d'Expertise en Donn\u00e9es & IA ?"
        : "Need Expert Data & AI Guidance?",
      description: locale === "fr"
        ? "13+ ans d'exp\u00e9rience internationale. De la strat\u00e9gie \u00e0 l'impl\u00e9mentation."
        : "13+ years of international experience. From strategy to implementation.",
      cta: locale === "fr" ? "Voir les Forfaits" : "View Packages",
      href: "/consulting",
    },
    newsletter: {
      badge: locale === "fr" ? "Restez Inform\u00e9" : "Stay Updated",
      title: locale === "fr"
        ? "Recevez les Derni\u00e8res Publications & Analyses"
        : "Get Latest Publications & Insights",
      description: locale === "fr"
        ? "Rejoignez la communaut\u00e9 de professionnels data et IA."
        : "Join the community of data and AI professionals.",
      cta: locale === "fr" ? "S'abonner" : "Subscribe",
      href: "/contact",
    },
    services: {
      badge: locale === "fr" ? "Services Professionnels" : "Professional Services",
      title: locale === "fr"
        ? "Transformez Vos Donn\u00e9es en R\u00e9sultats"
        : "Transform Your Data Into Results",
      description: locale === "fr"
        ? "Statistique, IA, ing\u00e9nierie de donn\u00e9es et d\u00e9veloppement full-stack."
        : "Statistics, AI, data engineering, and full-stack development.",
      cta: locale === "fr" ? "Demander un Devis" : "Request a Quote",
      href: "/services",
    },
    premium: {
      badge: locale === "fr" ? "Acc\u00e8s Premium" : "Premium Access",
      title: locale === "fr"
        ? "Acc\u00e9dez aux Donn\u00e9es & Analyses Compl\u00e8tes"
        : "Access Full Data & Analytics",
      description: locale === "fr"
        ? "D\u00e9bloquez les rapports complets, les jeux de donn\u00e9es et les analyses approfondies."
        : "Unlock full reports, datasets, and in-depth analytics behind our publications.",
      cta: locale === "fr" ? "En Savoir Plus" : "Learn More",
      href: "/subscribe",
    },
  };

  const c = content[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-8 glass rounded-2xl p-6 md:p-8 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl" />
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-medium mb-3">
        <Sparkles className="w-3 h-3" />
        {c.badge}
      </span>
      <h3 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-display)] mb-2">
        {c.title}
      </h3>
      <p className="text-text-secondary text-sm mb-4 max-w-xl">
        {c.description}
      </p>
      <Link
        href={c.href}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-charcoal font-semibold text-sm rounded-lg hover:bg-gold-light transition-colors"
      >
        {c.cta}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}
