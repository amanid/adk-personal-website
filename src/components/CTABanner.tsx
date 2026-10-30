"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import { buttonClass } from "@/components/ui/Button";
import { useSiteFacts } from "@/lib/site-facts";
import { formatPriceShort } from "@/lib/utils";

interface CTABannerProps {
  variant?: "consulting" | "newsletter" | "services" | "premium";
}

export default function CTABanner({ variant = "consulting" }: CTABannerProps) {
  const fr = useLocale() === "fr";
  const { years, advisory } = useSiteFacts();

  // The paid session, priced from the booking packages; the free call as the
  // low-friction alternative. With no packages the banner falls back to the
  // consulting overview.
  const paid = advisory.paid;
  const free = advisory.free;
  const sessionLabel = paid
    ? fr
      ? `Réserver une session conseil de ${paid.durationMinutes} min · ${formatPriceShort(paid.priceCents, paid.currency)}`
      : `Book a ${paid.durationMinutes}-minute advisory session · ${formatPriceShort(paid.priceCents, paid.currency)}`
    : fr
      ? "Voir les formules"
      : "View packages";

  const content = {
    consulting: {
      badge: fr ? "Conseil" : "Consulting",
      title: fr ? "Un problème de données ou d'IA à régler ?" : "Working on a data or AI problem?",
      description: fr
        ? `J'ai ${years} ans de pratique en statistique, science des données et IA dans des organisations internationales. Une heure suffit souvent pour débloquer un modèle, un pipeline ou une décision.`
        : `I have ${years} years of practice in statistics, data science and AI at international organisations. An hour is often enough to unblock a model, a pipeline or a decision.`,
      cta: sessionLabel,
      href: paid ? `/book?package=${encodeURIComponent(paid.slug)}` : "/consulting",
      secondary: free
        ? {
            label: fr
              ? `Ou commencez par un appel découverte gratuit de ${free.durationMinutes} min`
              : `Or start with a free ${free.durationMinutes}-minute discovery call`,
            href: `/book?package=${encodeURIComponent(free.slug)}`,
          }
        : null,
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
      title: fr ? "Un projet de statistique, d'IA ou de données ?" : "A statistics, AI or data project?",
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

  const c = content[variant] as (typeof content)[typeof variant] & {
    secondary?: { label: string; href: string } | null;
  };

  return (
    <aside className={`my-8 card p-6 md:p-8 ${variant === "consulting" ? "card-feature" : ""}`} aria-label={c.badge}>
      <p className="eyebrow mb-3">{c.badge}</p>
      <h2 className="font-display text-2xl md:text-3xl leading-tight mb-2">{c.title}</h2>
      <p className="text-text-secondary mb-5 max-w-xl">{c.description}</p>
      <div className="flex flex-col sm:flex-row sm:items-center gap-x-5 gap-y-3">
        <Link href={c.href} className={buttonClass("primary", "md", "group")}>
          {c.cta}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden />
        </Link>
        {c.secondary && (
          <Link href={c.secondary.href} className="text-sm text-text-secondary hover:text-gold underline underline-offset-4 decoration-glass-border hover:decoration-gold transition-colors">
            {c.secondary.label}
          </Link>
        )}
      </div>
    </aside>
  );
}
