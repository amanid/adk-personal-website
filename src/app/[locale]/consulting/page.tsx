"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import {
  Check,
  ArrowRight,
  Zap,
  Crown,
  Building2,
  Clock,
  Video,
  FileText,
  MessageSquare,
  Star,
  Shield,
  TrendingUp,
  Calendar,
  Users,
  Brain,
  Database,
  BarChart3,
  Code2,
} from "lucide-react";

const packages = [
  {
    id: "discovery",
    name: "Discovery Call",
    nameFr: "Appel Découverte",
    price: "Free",
    priceFr: "Gratuit",
    period: "",
    periodFr: "",
    description: "A 30-minute introductory call to discuss your needs and explore how I can help.",
    descriptionFr: "Un appel de 30 minutes pour discuter de vos besoins et explorer comment je peux vous aider.",
    icon: Video,
    color: "text-cyan-400",
    borderColor: "border-cyan-400/20",
    features: [
      { text: "30-minute video call", textFr: "Appel vidéo de 30 minutes" },
      { text: "Needs assessment", textFr: "Évaluation des besoins" },
      { text: "Strategic recommendations", textFr: "Recommandations stratégiques" },
      { text: "No obligation", textFr: "Sans engagement" },
    ],
    cta: "Book Free Call",
    ctaFr: "Réserver un appel gratuit",
    popular: false,
  },
  {
    id: "advisory",
    name: "Expert Advisory",
    nameFr: "Conseil Expert",
    price: "$150",
    priceFr: "150 $",
    period: "/ hour",
    periodFr: "/ heure",
    description: "Focused expert sessions for specific technical challenges, architecture reviews, or strategic guidance.",
    descriptionFr: "Sessions d'expertise ciblées pour des défis techniques, revues d'architecture ou guidance stratégique.",
    icon: Brain,
    color: "text-gold",
    borderColor: "border-gold/30",
    features: [
      { text: "1-on-1 expert sessions", textFr: "Sessions individuelles d'expertise" },
      { text: "Architecture & code review", textFr: "Revue d'architecture et de code" },
      { text: "AI/ML strategy guidance", textFr: "Stratégie IA/ML" },
      { text: "Data pipeline optimization", textFr: "Optimisation des pipelines de données" },
      { text: "Written summary & action items", textFr: "Résumé écrit et plan d'action" },
    ],
    cta: "Get Started",
    ctaFr: "Commencer",
    popular: true,
  },
  {
    id: "project",
    name: "Project Engagement",
    nameFr: "Engagement Projet",
    price: "Custom",
    priceFr: "Sur mesure",
    period: "",
    periodFr: "",
    description: "End-to-end project delivery for data platforms, AI systems, analytics solutions, and full-stack applications.",
    descriptionFr: "Livraison de projets de bout en bout : plateformes de données, systèmes IA, solutions analytiques et applications full-stack.",
    icon: Crown,
    color: "text-purple-400",
    borderColor: "border-purple-400/20",
    features: [
      { text: "Dedicated project management", textFr: "Gestion de projet dédiée" },
      { text: "Full-stack implementation", textFr: "Implémentation full-stack" },
      { text: "AI/ML model development", textFr: "Développement de modèles IA/ML" },
      { text: "Data architecture design", textFr: "Conception d'architecture de données" },
      { text: "Statistical & econometric analysis", textFr: "Analyse statistique et économétrique" },
      { text: "Documentation & training", textFr: "Documentation et formation" },
      { text: "Post-delivery support", textFr: "Support post-livraison" },
    ],
    cta: "Request Proposal",
    ctaFr: "Demander une proposition",
    popular: false,
  },
  {
    id: "retainer",
    name: "Monthly Retainer",
    nameFr: "Forfait Mensuel",
    price: "From $2,500",
    priceFr: "À partir de 2 500 $",
    period: "/ month",
    periodFr: "/ mois",
    description: "Ongoing strategic partnership with guaranteed availability for continuous guidance and implementation support.",
    descriptionFr: "Partenariat stratégique continu avec disponibilité garantie pour un accompagnement et un support continus.",
    icon: Shield,
    color: "text-emerald-400",
    borderColor: "border-emerald-400/20",
    features: [
      { text: "Priority response (< 4 hours)", textFr: "Réponse prioritaire (< 4 heures)" },
      { text: "Weekly strategy sessions", textFr: "Sessions stratégiques hebdomadaires" },
      { text: "Unlimited async support", textFr: "Support asynchrone illimité" },
      { text: "Team training & mentoring", textFr: "Formation et mentorat d'équipe" },
      { text: "Quarterly business reviews", textFr: "Revues trimestrielles" },
      { text: "Technology roadmap planning", textFr: "Planification de la feuille de route technologique" },
      { text: "Dedicated Slack/Teams channel", textFr: "Canal Slack/Teams dédié" },
      { text: "Monthly progress reports", textFr: "Rapports de progrès mensuels" },
    ],
    cta: "Discuss Partnership",
    ctaFr: "Discuter du partenariat",
    popular: false,
  },
];

const expertise = [
  { icon: BarChart3, label: "Statistics & Econometrics", labelFr: "Statistique & Économétrie" },
  { icon: Brain, label: "AI & Machine Learning", labelFr: "IA & Machine Learning" },
  { icon: Database, label: "Data Engineering", labelFr: "Ingénierie des Données" },
  { icon: Code2, label: "Full-Stack Development", labelFr: "Développement Full-Stack" },
  { icon: TrendingUp, label: "Strategic Advisory", labelFr: "Conseil Stratégique" },
  { icon: Users, label: "Training & Workshops", labelFr: "Formation & Ateliers" },
];

const testimonials = [
  {
    quote: "Amani's expertise in data architecture and AI transformed our approach to institutional analytics. His work at the intersection of statistics and technology is exceptional.",
    quoteFr: "L'expertise d'Amani en architecture de données et IA a transformé notre approche de l'analytique institutionnelle. Son travail à l'intersection de la statistique et de la technologie est exceptionnel.",
    name: "International Organization Executive",
    nameFr: "Cadre d'Organisation Internationale",
    role: "Director of Data & Analytics",
    roleFr: "Directeur des Données et de l'Analytique",
  },
  {
    quote: "The econometric analysis and predictive models delivered exceeded our expectations. A rare combination of statistical rigor and practical business insight.",
    quoteFr: "L'analyse économétrique et les modèles prédictifs livrés ont dépassé nos attentes. Une combinaison rare de rigueur statistique et de vision pratique des affaires.",
    name: "Senior Vice President, Development Finance",
    nameFr: "Vice-Président Senior, Finance de Développement",
    role: "Trade & Investment Division",
    roleFr: "Division Commerce et Investissement",
  },
  {
    quote: "From data strategy to full-stack implementation, Amani delivered a complete digital transformation for our research unit. Highly recommended for any data-intensive project.",
    quoteFr: "De la stratégie de données à l'implémentation full-stack, Amani a réalisé une transformation numérique complète pour notre unité de recherche. Hautement recommandé pour tout projet data-intensif.",
    name: "Research Unit Head",
    nameFr: "Chef d'Unité de Recherche",
    role: "UN Agency",
    roleFr: "Agence des Nations Unies",
  },
];

export default function ConsultingPage() {
  const locale = useLocale();
  const [billingView] = useState<"monthly" | "project">("monthly");

  return (
    <div className="section-padding">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-gold text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            {locale === "fr" ? "Conseil & Services Professionnels" : "Professional Consulting & Services"}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-display)] gradient-text mb-6">
            {locale === "fr"
              ? "Transformez Vos Données en Avantage Stratégique"
              : "Transform Your Data Into Strategic Advantage"}
          </h1>
          <p className="text-text-secondary text-lg max-w-3xl mx-auto mb-8">
            {locale === "fr"
              ? "13+ ans d'expertise à travers le système des Nations Unies, la finance de développement et les organisations internationales. De la statistique et l'IA au développement full-stack — des solutions de bout en bout pour vos défis les plus complexes."
              : "13+ years of expertise across the UN system, development finance, and international organizations. From statistics and AI to full-stack development — end-to-end solutions for your most complex challenges."}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-charcoal font-semibold rounded-lg hover:bg-gold-light transition-colors"
            >
              {locale === "fr" ? "Discuter de votre projet" : "Discuss Your Project"}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://calendly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 glass rounded-lg text-text-secondary hover:text-gold transition-colors"
            >
              <Calendar className="w-4 h-4" />
              {locale === "fr" ? "Réserver un appel" : "Schedule a Call"}
            </a>
          </div>
        </motion.div>

        {/* Expertise Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-16"
        >
          {expertise.map((item) => (
            <div key={item.label} className="glass rounded-xl p-4 text-center">
              <item.icon className="w-6 h-6 text-gold mx-auto mb-2" />
              <p className="text-xs text-text-secondary">{locale === "fr" ? item.labelFr : item.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className={`relative glass rounded-2xl p-6 flex flex-col ${
                pkg.popular ? "ring-2 ring-gold/50 scale-[1.02]" : ""
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-gold text-charcoal text-xs font-bold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {locale === "fr" ? "Populaire" : "Most Popular"}
                  </span>
                </div>
              )}
              <div className="mb-4">
                <pkg.icon className={`w-8 h-8 ${pkg.color} mb-3`} />
                <h3 className="text-lg font-bold">
                  {locale === "fr" ? pkg.nameFr : pkg.name}
                </h3>
                <p className="text-text-secondary text-xs mt-1 line-clamp-2">
                  {locale === "fr" ? pkg.descriptionFr : pkg.description}
                </p>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold">
                  {locale === "fr" ? pkg.priceFr : pkg.price}
                </span>
                {(pkg.period || pkg.periodFr) && (
                  <span className="text-text-muted text-sm">
                    {locale === "fr" ? pkg.periodFr : pkg.period}
                  </span>
                )}
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {pkg.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${pkg.color}`} />
                    {locale === "fr" ? f.textFr : f.text}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className={`w-full text-center py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  pkg.popular
                    ? "bg-gold text-charcoal hover:bg-gold-light"
                    : "glass hover:text-gold"
                }`}
              >
                {locale === "fr" ? pkg.ctaFr : pkg.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-center mb-8">
            {locale === "fr" ? "Ce Que Disent Les Clients" : "What Clients Say"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-6"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-gold fill-gold" />
                  ))}
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-4 italic">
                  &ldquo;{locale === "fr" ? t.quoteFr : t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-medium text-sm">{locale === "fr" ? t.nameFr : t.name}</p>
                  <p className="text-text-muted text-xs">{locale === "fr" ? t.roleFr : t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-center mb-8">
            {locale === "fr" ? "Comment Ça Marche" : "How It Works"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Discovery",
                titleFr: "Découverte",
                desc: "We discuss your challenges, goals, and current setup in a free 30-minute call.",
                descFr: "Nous discutons de vos défis, objectifs et situation actuelle lors d'un appel gratuit de 30 minutes.",
                icon: MessageSquare,
              },
              {
                step: "02",
                title: "Proposal",
                titleFr: "Proposition",
                desc: "I deliver a tailored proposal with clear scope, timeline, and deliverables.",
                descFr: "Je livre une proposition sur mesure avec périmètre, calendrier et livrables clairs.",
                icon: FileText,
              },
              {
                step: "03",
                title: "Execution",
                titleFr: "Exécution",
                desc: "Hands-on implementation with regular check-ins and transparent progress tracking.",
                descFr: "Implémentation pratique avec des points réguliers et un suivi transparent de l'avancement.",
                icon: Zap,
              },
              {
                step: "04",
                title: "Delivery",
                titleFr: "Livraison",
                desc: "Complete handoff with documentation, training, and post-delivery support.",
                descFr: "Livraison complète avec documentation, formation et support post-livraison.",
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-6 text-center relative"
              >
                <span className="text-4xl font-bold text-gold/10 absolute top-3 right-4">
                  {item.step}
                </span>
                <item.icon className="w-8 h-8 text-gold mx-auto mb-3" />
                <h3 className="font-semibold mb-2">
                  {locale === "fr" ? item.titleFr : item.title}
                </h3>
                <p className="text-text-secondary text-sm">
                  {locale === "fr" ? item.descFr : item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ - with structured data for SEO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <FAQSection locale={locale} />
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center glass rounded-2xl p-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
            {locale === "fr"
              ? "Prêt à Transformer Vos Données ?"
              : "Ready to Transform Your Data?"}
          </h2>
          <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
            {locale === "fr"
              ? "Discutons de comment mon expertise en statistique, IA et ingénierie de données peut accélérer vos objectifs."
              : "Let's discuss how my expertise in statistics, AI, and data engineering can accelerate your goals."}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-charcoal font-semibold rounded-lg hover:bg-gold-light transition-colors"
            >
              {locale === "fr" ? "Commencer Maintenant" : "Get Started Now"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// FAQ Section with Schema.org FAQPage structured data
function FAQSection({ locale }: { locale: string }) {
  const faqs = [
    {
      q: "What types of projects do you work on?",
      qFr: "Sur quels types de projets travaillez-vous ?",
      a: "I work on data strategy, AI/ML systems, statistical & econometric analysis, data engineering pipelines, full-stack web applications, and executive training. My experience spans the UN system, development finance, and private sector organizations.",
      aFr: "Je travaille sur la stratégie de données, les systèmes IA/ML, l'analyse statistique et économétrique, les pipelines d'ingénierie de données, les applications web full-stack et la formation de cadres. Mon expérience couvre le système des Nations Unies, la finance de développement et les organisations du secteur privé.",
    },
    {
      q: "What is your typical project timeline?",
      qFr: "Quel est votre délai de projet typique ?",
      a: "Advisory sessions are available immediately. Small projects typically take 2-4 weeks, medium projects 1-3 months, and large enterprise engagements 3-12 months. I provide detailed timelines in each project proposal.",
      aFr: "Les sessions de conseil sont disponibles immédiatement. Les petits projets prennent généralement 2-4 semaines, les projets moyens 1-3 mois, et les grands engagements d'entreprise 3-12 mois. Je fournis des calendriers détaillés dans chaque proposition de projet.",
    },
    {
      q: "Do you work remotely or on-site?",
      qFr: "Travaillez-vous à distance ou sur site ?",
      a: "I work both remotely and on-site depending on the project requirements. Based in Abidjan, Côte d'Ivoire, I have extensive experience working with international teams across multiple time zones.",
      aFr: "Je travaille à distance et sur site selon les besoins du projet. Basé à Abidjan, Côte d'Ivoire, j'ai une vaste expérience de travail avec des équipes internationales sur plusieurs fuseaux horaires.",
    },
    {
      q: "What technologies do you specialize in?",
      qFr: "Dans quelles technologies êtes-vous spécialisé ?",
      a: "My core stack includes Python (scikit-learn, TensorFlow, PyTorch), R, SQL, Next.js/React/TypeScript, PostgreSQL, Databricks/Delta Lake, AWS, and modern AI frameworks (LangChain, RAG systems). I also work with Stata, SPSS, and EViews for econometric analysis.",
      aFr: "Mon stack principal comprend Python (scikit-learn, TensorFlow, PyTorch), R, SQL, Next.js/React/TypeScript, PostgreSQL, Databricks/Delta Lake, AWS et les frameworks IA modernes (LangChain, systèmes RAG). Je travaille aussi avec Stata, SPSS et EViews pour l'analyse économétrique.",
    },
    {
      q: "How do you ensure project quality?",
      qFr: "Comment assurez-vous la qualité du projet ?",
      a: "Every engagement includes clear milestones, regular progress reviews, comprehensive documentation, and knowledge transfer. I follow best practices in code review, testing, and deployment. My 13+ years across 11 international organizations have built rigorous quality standards.",
      aFr: "Chaque engagement comprend des jalons clairs, des revues régulières, une documentation complète et un transfert de connaissances. Je suis les meilleures pratiques en matière de revue de code, de tests et de déploiement. Mes 13+ ans dans 11 organisations internationales ont développé des standards de qualité rigoureux.",
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-center mb-8">
        {locale === "fr" ? "Questions Fréquentes" : "Frequently Asked Questions"}
      </h2>
      <div className="max-w-3xl mx-auto space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="glass rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full text-left p-5 flex items-center justify-between hover:bg-gold/5 transition-colors"
            >
              <span className="font-medium text-sm pr-4">{locale === "fr" ? faq.qFr : faq.q}</span>
              <span className={`text-gold transition-transform ${openIndex === i ? "rotate-45" : ""}`}>+</span>
            </button>
            {openIndex === i && (
              <div className="px-5 pb-5">
                <p className="text-text-secondary text-sm leading-relaxed">
                  {locale === "fr" ? faq.aFr : faq.a}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
