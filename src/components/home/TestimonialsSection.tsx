"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useLocale } from "next-intl";

const testimonials = [
  {
    quote: "Amani delivered an enterprise-grade AI analytics platform that transformed how we process trade data across Africa. His unique blend of statistical expertise and engineering skill is rare.",
    quoteFr: "Amani a livr\u00e9 une plateforme d'analytique IA de classe entreprise qui a transform\u00e9 notre traitement des donn\u00e9es commerciales en Afrique. Sa combinaison unique d'expertise statistique et de comp\u00e9tences en ing\u00e9nierie est rare.",
    author: "Senior Director",
    authorFr: "Directeur Senior",
    org: "International Development Finance Institution",
    orgFr: "Institution Internationale de Finance de D\u00e9veloppement",
  },
  {
    quote: "The econometric models and predictive analytics he built for our commodity market analysis continue to be used years later. Truly best-in-class statistical work.",
    quoteFr: "Les mod\u00e8les \u00e9conom\u00e9triques et l'analytique pr\u00e9dictive qu'il a construits pour notre analyse des march\u00e9s de mati\u00e8res premi\u00e8res continuent d'\u00eatre utilis\u00e9s des ann\u00e9es plus tard. Un travail statistique v\u00e9ritablement de premier ordre.",
    author: "Head of Research",
    authorFr: "Chef de Recherche",
    org: "International Commodity Organization",
    orgFr: "Organisation Internationale de Mati\u00e8res Premi\u00e8res",
  },
  {
    quote: "From data strategy to full-stack implementation, Amani's holistic approach to digital transformation is exactly what our research unit needed. Exceptional professionalism.",
    quoteFr: "De la strat\u00e9gie de donn\u00e9es \u00e0 l'impl\u00e9mentation full-stack, l'approche holistique d'Amani \u00e0 la transformation num\u00e9rique est exactement ce dont notre unit\u00e9 de recherche avait besoin. Professionnalisme exceptionnel.",
    author: "Programme Manager",
    authorFr: "Chef de Programme",
    org: "United Nations Agency",
    orgFr: "Agence des Nations Unies",
  },
];

export default function TestimonialsSection() {
  const locale = useLocale();

  return (
    <section className="section-padding bg-navy/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text mb-3">
            {locale === "fr" ? "T\u00e9moignages Clients" : "Client Testimonials"}
          </h2>
          <p className="text-text-secondary">
            {locale === "fr"
              ? "Ce que disent les dirigeants avec lesquels j'ai collabor\u00e9"
              : "What leaders I've worked with have to say"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass rounded-xl p-6 relative"
            >
              <Quote className="w-8 h-8 text-gold/20 absolute top-4 right-4" />
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-gold fill-gold" />
                ))}
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-6 italic">
                &ldquo;{locale === "fr" ? t.quoteFr : t.quote}&rdquo;
              </p>
              <div className="border-t border-glass-border pt-4">
                <p className="font-medium text-sm">{locale === "fr" ? t.authorFr : t.author}</p>
                <p className="text-text-muted text-xs">{locale === "fr" ? t.orgFr : t.org}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
