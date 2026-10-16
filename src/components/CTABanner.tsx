"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import { buttonClass } from "@/components/ui/Button";

interface CTABannerProps {
  variant?: "consulting" | "newsletter" | "services" | "premium";
}

export default function CTABanner({ variant = "consulting" }: CTABannerProps) {
  const fr = useLocale() === "fr";

  const content = {
    consulting: {
      badge: fr ? "Conseil" : "Consulting",
      title: fr ? "Besoin d'aide sur un projet de données ou d'IA ?" : "Need help with a data or AI project?",
      description: fr
        ? "Plus de 13 ans d'expérience internationale en statistique, science des données et IA, de la stratégie à la mise en œuvre."
        : "13+ years of international experience in statistics, data science and AI, from strategy to implementation.",
      cta: fr ? "Voir les formules" : "View packages",
      href: "/consulting",
    },
    newsletter: {
      badge: fr ? "Newsletter" : "Newsletter",
      title: fr ? "Les nouvelles publications par email" : "New publications by email",
      description: fr
        ? "Recevez un email quand je publie une nouvelle analyse."
        : "Get an email when I publish new research.",
      cta: fr ? "S'abonner" : "Subscribe",
      href: "/contact",
    },
    services: {
      badge: fr ? "Services" : "Services",
      title: fr ? "Un projet en statistique, IA ou données ?" : "A statistics, AI or data project?",
      description: fr
        ? "Statistique, IA, ingénierie de données et développement full-stack."
        : "Statistics, AI, data engineering and full-stack development.",
      cta: fr ? "Demander un devis" : "Request a quote",
      href: "/services",
    },
    premium: {
      badge: fr ? "Premium" : "Premium",
      title: fr ? "Rapports complets et jeux de données" : "Full reports and datasets",
      description: fr
        ? "Le rapport complet, et les fichiers de données qui l'accompagnent, sont disponibles avec un abonnement."
        : "The full report, and any data files attached to it, are available with a subscription.",
      cta: fr ? "Voir les abonnements" : "See plans",
      href: "/subscribe",
    },
  };

  const c = content[variant];

  return (
    <aside className="my-8 card p-6 md:p-8" aria-label={c.badge}>
      <p className="eyebrow mb-3">{c.badge}</p>
      <h2 className="font-display text-2xl md:text-3xl leading-tight mb-2">{c.title}</h2>
      <p className="text-text-secondary mb-5 max-w-xl">{c.description}</p>
      <Link href={c.href} className={buttonClass("primary", "md", "group")}>
        {c.cta}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden />
      </Link>
    </aside>
  );
}
