"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { safeJsonLd } from "@/lib/utils";
import { ArrowRight, Check, Plus } from "lucide-react";
import { Container, Section } from "@/components/ui/Section";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useSiteFacts } from "@/lib/site-facts";

/*
 * The four ways to work together. Prices and session lengths match the
 * ServicePackage rows seeded in prisma/migrations/20261003000200_consulting_bookings
 * (Discovery Call: 30 min, free; Expert Advisory: 60 min, $150).
 */
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
    descriptionFr: "Un appel de 30 minutes pour discuter de vos besoins et voir comment je peux vous aider.",
    audience: "If you are not sure yet what you need.",
    audienceFr: "Si vous ne savez pas encore précisément ce dont vous avez besoin.",
    features: [
      { text: "30-minute video call", textFr: "Appel vidéo de 30 minutes" },
      { text: "Needs assessment", textFr: "Évaluation des besoins" },
      { text: "First recommendations", textFr: "Premières recommandations" },
      { text: "No obligation", textFr: "Sans engagement" },
    ],
    // Bookable online: the slug of the matching ServicePackage.
    bookSlug: "discovery-call",
    cta: "Book a free call",
    ctaFr: "Réserver un appel gratuit",
  },
  {
    id: "advisory",
    name: "Expert Advisory",
    nameFr: "Conseil Expert",
    price: "$150",
    priceFr: "150 $",
    period: "/ hour",
    periodFr: "/ heure",
    description: "Focused sessions on a specific technical question, an architecture review or strategic guidance.",
    descriptionFr: "Sessions ciblées sur une question technique précise, une revue d'architecture ou un conseil stratégique.",
    audience: "If you have one clear question to work through.",
    audienceFr: "Si vous avez une question précise à traiter.",
    features: [
      { text: "One-to-one sessions", textFr: "Sessions individuelles" },
      { text: "Architecture & code review", textFr: "Revue d'architecture et de code" },
      { text: "AI/ML strategy guidance", textFr: "Conseil en stratégie IA/ML" },
      { text: "Data pipeline review", textFr: "Revue des pipelines de données" },
      { text: "Written summary & action items", textFr: "Résumé écrit et plan d'action" },
    ],
    bookSlug: "expert-advisory",
    cta: "Book a session",
    ctaFr: "Réserver une session",
  },
  {
    id: "project",
    name: "Project Engagement",
    nameFr: "Engagement Projet",
    price: "Custom",
    priceFr: "Sur mesure",
    period: "",
    periodFr: "",
    description: "A scoped project: a data platform, an AI system, an analysis or a web application.",
    descriptionFr: "Un projet cadré : plateforme de données, système d'IA, analyse ou application web.",
    audience: "If you need something built or analysed.",
    audienceFr: "Si vous avez besoin qu'on construise ou analyse quelque chose.",
    features: [
      { text: "Project management", textFr: "Gestion de projet" },
      { text: "Full-stack implementation", textFr: "Implémentation full-stack" },
      { text: "AI/ML model development", textFr: "Développement de modèles IA/ML" },
      { text: "Data architecture design", textFr: "Conception d'architecture de données" },
      { text: "Statistical & econometric analysis", textFr: "Analyse statistique et économétrique" },
      { text: "Documentation & training", textFr: "Documentation et formation" },
      { text: "Post-delivery support", textFr: "Support après livraison" },
    ],
    cta: "Request a proposal",
    ctaFr: "Demander une proposition",
  },
  {
    id: "retainer",
    name: "Monthly Retainer",
    nameFr: "Forfait Mensuel",
    price: "From $2,500",
    priceFr: "À partir de 2 500 $",
    period: "/ month",
    periodFr: "/ mois",
    description: "Ongoing advice and implementation support, month by month.",
    descriptionFr: "Conseil et support de mise en œuvre en continu, mois par mois.",
    audience: "If you want regular support over several months.",
    audienceFr: "Si vous voulez un accompagnement régulier sur plusieurs mois.",
    features: [
      { text: "Priority response", textFr: "Réponse prioritaire" },
      { text: "Weekly strategy sessions", textFr: "Sessions stratégiques hebdomadaires" },
      { text: "Async support between sessions", textFr: "Support asynchrone entre les sessions" },
      { text: "Team training & mentoring", textFr: "Formation et mentorat d'équipe" },
      { text: "Quarterly reviews", textFr: "Revues trimestrielles" },
      { text: "Technology roadmap planning", textFr: "Planification de la feuille de route technologique" },
      { text: "Dedicated Slack/Teams channel", textFr: "Canal Slack/Teams dédié" },
      { text: "Monthly progress reports", textFr: "Rapports d'avancement mensuels" },
    ],
    cta: "Discuss a retainer",
    ctaFr: "Discuter d'un forfait",
  },
];

const expertise = [
  { label: "Statistics & Econometrics", labelFr: "Statistique & Économétrie" },
  { label: "AI & Machine Learning", labelFr: "IA & Machine Learning" },
  { label: "Data Engineering", labelFr: "Ingénierie des Données" },
  { label: "Full-Stack Development", labelFr: "Développement Full-Stack" },
  { label: "Strategic Advisory", labelFr: "Conseil Stratégique" },
  { label: "Training & Workshops", labelFr: "Formation & Ateliers" },
];

const steps = [
  {
    title: "Discovery",
    titleFr: "Découverte",
    desc: "We talk through your problem, goals and current setup in a free 30-minute call.",
    descFr: "Nous parlons de votre problème, de vos objectifs et de votre situation lors d'un appel gratuit de 30 minutes.",
  },
  {
    title: "Proposal",
    titleFr: "Proposition",
    desc: "I send a written proposal with the scope, timeline, deliverables and price.",
    descFr: "Je vous envoie une proposition écrite avec le périmètre, le calendrier, les livrables et le prix.",
  },
  {
    title: "Execution",
    titleFr: "Exécution",
    desc: "I do the work, with regular check-ins so you always know where it stands.",
    descFr: "Je réalise le travail, avec des points réguliers pour que vous sachiez toujours où il en est.",
  },
  {
    title: "Delivery",
    titleFr: "Livraison",
    desc: "Handover with documentation, training and support after delivery.",
    descFr: "Remise du travail avec documentation, formation et support après livraison.",
  },
];

export default function ConsultingClient() {
  const locale = useLocale();
  const fr = locale === "fr";
  const { years } = useSiteFacts();

  return (
    <>
      <Container className="pt-14 pb-4 md:pt-20">
        <p className="eyebrow mb-4">{fr ? "Conseil" : "Consulting"}</p>
        <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5 max-w-4xl">
          {fr ? "Travailler avec moi" : "Work with me"}
        </h1>
        <p className="lede max-w-2xl mb-8">
          {fr
            ? `J'ai travaillé ${years} ans en statistique, science des données et IA, pour des organisations internationales, des agences des Nations Unies et une banque de financement du commerce. Voici comment nous pouvons travailler ensemble.`
            : `I have worked ${years} years in statistics, data science and AI, for international organisations, UN agencies and a trade finance bank. Here is how we can work together.`}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <ButtonLink href="/book" size="lg">
            {fr ? "Réserver un appel" : "Book a call"}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary" size="lg">
            {fr ? "Décrire votre projet" : "Describe your project"}
          </ButtonLink>
        </div>

        <ul className="mt-12 flex flex-wrap gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-[0.08em] text-text-muted">
          {expertise.map((item, i) => (
            <li key={item.label} className="flex items-center gap-3">
              {i > 0 && <span className="w-1 h-1 rounded-full bg-gold" aria-hidden />}
              {fr ? item.labelFr : item.label}
            </li>
          ))}
        </ul>
      </Container>

      <Section
        id="packages"
        index={1}
        eyebrow={fr ? "Formules" : "Packages"}
        title={fr ? "Quatre façons de travailler ensemble" : "Four ways to work together"}
        intro={
          fr
            ? "Les deux premières se réservent et se paient en ligne. Les projets et forfaits commencent par une discussion."
            : "The first two can be booked and paid online. Projects and retainers start with a conversation."
        }
      >
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {packages.map((pkg) => {
            const bookable = "bookSlug" in pkg && pkg.bookSlug;
            return (
              <li
                key={pkg.id}
                className={cn("card p-6 flex flex-col", pkg.id === "advisory" && "card-feature")}
              >
                <h3 className="font-display text-2xl leading-tight">{fr ? pkg.nameFr : pkg.name}</h3>
                <p className="mt-4 mb-1">
                  <span className="font-mono tabular-nums text-3xl text-text-primary">{fr ? pkg.priceFr : pkg.price}</span>
                  {pkg.period && (
                    <span className="font-mono text-sm text-text-muted"> {fr ? pkg.periodFr : pkg.period}</span>
                  )}
                </p>
                {bookable && (
                  <p className="font-mono text-xs uppercase tracking-[0.08em] text-gold mb-3">
                    {fr ? "Réservable en ligne" : "Bookable online"}
                  </p>
                )}
                <p className="text-text-secondary text-sm leading-relaxed mt-2">
                  {fr ? pkg.descriptionFr : pkg.description}
                </p>
                <p className="text-text-muted text-sm leading-relaxed mt-2 mb-5">{fr ? pkg.audienceFr : pkg.audience}</p>
                <ul className="space-y-2 mb-6 flex-1 pt-4 hairline">
                  {pkg.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-gold" aria-hidden />
                      {fr ? f.textFr : f.text}
                    </li>
                  ))}
                </ul>
                <Link
                  href={bookable ? `/book?package=${pkg.bookSlug}` : "/contact"}
                  className={buttonClass(pkg.id === "advisory" ? "primary" : "secondary", "md", "w-full")}
                >
                  {fr ? pkg.ctaFr : pkg.cta}
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section
        id="process"
        index={2}
        eyebrow={fr ? "Démarche" : "Process"}
        title={fr ? "Comment ça se passe" : "How it works"}
      >
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, i) => (
            <li key={item.title} className="pt-5 hairline">
              <p className="font-mono text-sm text-gold tabular-nums mb-3">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="font-display text-xl mb-2">{fr ? item.titleFr : item.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{fr ? item.descFr : item.desc}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="faq" index={3} eyebrow="FAQ" title={fr ? "Questions fréquentes" : "Common questions"} size="prose">
        <FAQSection fr={fr} />
      </Section>

      <Section size="prose">
        <div className="card p-8 md:p-10">
          <h2 className="h-section mb-4">{fr ? "Parlons de votre projet" : "Tell me about your project"}</h2>
          <p className="lede mb-7">
            {fr
              ? "Un court message ou un appel gratuit de 30 minutes suffit pour voir si je peux vous aider."
              : "A short message or a free 30-minute call is enough to see whether I can help."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <ButtonLink href="/contact" size="lg">
              {fr ? "Écrire un message" : "Send a message"}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/book?package=discovery-call" variant="secondary" size="lg">
              {fr ? "Réserver un appel gratuit" : "Book a free call"}
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}

// FAQ with Schema.org FAQPage structured data
function FAQSection({ fr }: { fr: boolean }) {
  const faqs = [
    {
      q: "What types of projects do you work on?",
      qFr: "Sur quels types de projets travaillez-vous ?",
      a: "Data strategy, AI and machine learning systems, statistical and econometric analysis, data engineering pipelines, web applications and training. My experience covers UN agencies, international organisations and a development finance institution.",
      aFr: "Stratégie de données, systèmes d'IA et d'apprentissage automatique, analyse statistique et économétrique, pipelines de données, applications web et formation. Mon expérience couvre des agences des Nations Unies, des organisations internationales et une institution de financement du développement.",
    },
    {
      q: "How long does a project take?",
      qFr: "Combien de temps dure un projet ?",
      a: "It depends on the scope. Advisory sessions can be booked online. For projects, each proposal includes a detailed timeline.",
      aFr: "Cela dépend du périmètre. Les sessions de conseil se réservent en ligne. Pour les projets, chaque proposition comprend un calendrier détaillé.",
    },
    {
      q: "Do you work remotely or on-site?",
      qFr: "Travaillez-vous à distance ou sur site ?",
      a: "Both, depending on the project. I have worked on fully remote engagements for international clients, with teams in several time zones.",
      aFr: "Les deux, selon le projet. J'ai mené des missions entièrement à distance pour des clients internationaux, avec des équipes sur plusieurs fuseaux horaires.",
    },
    {
      q: "Which tools do you use?",
      qFr: "Quels outils utilisez-vous ?",
      a: "Python (pandas, scikit-learn, PySpark, LangChain, FastAPI), R, SQL, PostgreSQL, Databricks (Delta Lake, MLflow), AWS (SageMaker, Bedrock, S3, Lambda), and RAG pipelines with LLMs. For econometrics I also use Stata, SPSS and EViews.",
      aFr: "Python (pandas, scikit-learn, PySpark, LangChain, FastAPI), R, SQL, PostgreSQL, Databricks (Delta Lake, MLflow), AWS (SageMaker, Bedrock, S3, Lambda) et des pipelines RAG avec des LLM. Pour l'économétrie, j'utilise aussi Stata, SPSS et EViews.",
    },
    {
      q: "How do you keep the work on track?",
      qFr: "Comment suivez-vous l'avancement du travail ?",
      a: "Each engagement has clear milestones, regular progress reviews, documentation and a handover so your team can keep the work going.",
      aFr: "Chaque mission comprend des jalons clairs, des points d'avancement réguliers, une documentation et une passation pour que votre équipe puisse poursuivre le travail.",
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />
      <div className="divide-y divide-glass-border border-y border-glass-border">
        {faqs.map((faq, i) => {
          const open = openIndex === i;
          return (
            <div key={faq.q}>
              <h3>
                <button
                  type="button"
                  id={`faq-q-${i}`}
                  aria-expanded={open}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="w-full min-h-11 text-left py-5 flex items-center justify-between gap-4 hover:text-gold transition-colors"
                >
                  <span className="font-medium">{fr ? faq.qFr : faq.q}</span>
                  <Plus
                    className={cn("w-4 h-4 text-gold shrink-0 transition-transform", open && "rotate-45")}
                    aria-hidden
                  />
                </button>
              </h3>
              <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} hidden={!open} className="pb-5">
                <p className="text-text-secondary text-sm leading-relaxed">{fr ? faq.aFr : faq.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
