"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import {
  dbaThesis,
  keyFacts,
  abstractParagraphs,
  claimStatement,
  frameworkLenses,
  designMetrics,
  findings,
  contributions,
  practicalMessage,
  keywords,
  declarationIntro,
  declarationPoints,
  type Bilingual,
} from "@/data/dba";

type Locale = "en" | "fr";

export default function DbaClient() {
  const t = useTranslations("dba");
  const locale = useLocale() as Locale;
  const pick = (b: Bilingual) => b[locale] ?? b.en;
  const [declarationOpen, setDeclarationOpen] = useState(false);

  return (
    <div className="pt-16 md:pt-24 pb-24">
      {/* ===== Header ===== */}
      <Container>
        <header className="max-w-4xl mb-14">
          <p className="eyebrow mb-4">{t("eyebrow")}</p>
          <p className="text-text-secondary mb-1">
            {pick(dbaThesis.degree)} · {dbaThesis.institution}
          </p>
          <p className="text-sm text-text-muted mb-8">{pick(dbaThesis.option)}</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[1] tracking-tight mb-5">{pick(dbaThesis.title)}</h1>
          <p className="font-display text-xl md:text-2xl leading-snug text-text-secondary max-w-3xl">
            {pick(dbaThesis.subtitle)}
          </p>
          <p className="text-text-muted mt-6 max-w-2xl italic">{pick(dbaThesis.thesisLine)}</p>
        </header>

        {/* Thesis cover facts */}
        <dl className="grid grid-cols-1 sm:grid-cols-3 border-t border-glass-border mb-4">
          {[
            { k: t("candidate"), v: dbaThesis.candidate },
            { k: t("supervisor"), v: dbaThesis.supervisor },
            { k: t("date"), v: pick(dbaThesis.date) },
          ].map((item) => (
            <div key={item.k} className="py-4 sm:pr-6 border-b border-glass-border">
              <dt className="eyebrow text-text-muted mb-1">{item.k}</dt>
              <dd className="text-text-primary">{item.v}</dd>
            </div>
          ))}
        </dl>
        <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-20">
          {keyFacts.map((fact) => (
            <div key={fact.label.en} className="py-4 sm:pr-6 border-b border-glass-border">
              <dt className="eyebrow text-text-muted mb-1">{pick(fact.label)}</dt>
              <dd className="text-text-primary leading-snug">{pick(fact.value)}</dd>
            </div>
          ))}
        </dl>
      </Container>

      {/* ===== Central claim ===== */}
      <Container size="prose">
        <Reveal className="mb-20">
          <figure className="card card-feature p-8 md:p-10">
            <figcaption className="eyebrow mb-4">{t("central_claim")}</figcaption>
            <blockquote className="font-display text-2xl md:text-[1.75rem] leading-[1.4] text-text-primary">
              {pick(claimStatement)}
            </blockquote>
          </figure>
        </Reveal>

        {/* ===== Abstract ===== */}
        <section aria-labelledby="dba-abstract" className="mb-20">
          <SectionHeading id="dba-abstract" title={t("abstract_title")} />
          <div className="space-y-5">
            {abstractParagraphs.map((para, i) => (
              <p key={i} className="text-text-secondary text-[1.0625rem] leading-[1.75]">
                {pick(para)}
              </p>
            ))}
          </div>
        </section>
      </Container>

      <Container>
        {/* ===== Theoretical framework ===== */}
        <section aria-labelledby="dba-framework" className="hairline pt-14 mb-20">
          <SectionHeading id="dba-framework" title={t("framework_title")} subtitle={t("framework_subtitle")} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {frameworkLenses.map((lens) => (
              <div key={lens.name.en} className="py-6 border-t border-glass-border">
                <p className="eyebrow text-text-muted mb-2">{pick(lens.role)}</p>
                <h3 className="font-display text-2xl leading-snug mb-2">{pick(lens.name)}</h3>
                <p className="text-text-secondary leading-relaxed">{pick(lens.description)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Research design ===== */}
        <section aria-labelledby="dba-design" className="hairline pt-14 mb-20">
          <SectionHeading id="dba-design" title={t("design_title")} subtitle={t("design_subtitle")} />
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-12">
            {designMetrics.map((m) => (
              <div key={m.label.en} className="py-4 border-t border-glass-border">
                <dt className="eyebrow text-text-muted mb-1">{pick(m.label)}</dt>
                <dd className="text-text-primary leading-snug">{pick(m.value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Container>

      <Container size="prose">
        {/* ===== Findings ===== */}
        <section aria-labelledby="dba-findings" className="hairline pt-14 mb-20">
          <SectionHeading id="dba-findings" title={t("findings_title")} subtitle={t("findings_subtitle")} />
          <ol>
            {findings.map((f, i) => (
              <li key={f.title.en} className="grid grid-cols-[2.5rem_1fr] gap-4 py-6 border-t border-glass-border">
                <span className="font-mono text-sm tabular-nums text-gold pt-1">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display text-xl leading-snug mb-2">{pick(f.title)}</h3>
                  <p className="text-text-secondary leading-relaxed">{pick(f.body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ===== Contributions ===== */}
        <section aria-labelledby="dba-contributions" className="hairline pt-14 mb-20">
          <SectionHeading id="dba-contributions" title={t("contributions_title")} />
          <ol>
            {contributions.map((c) => (
              <li key={c.index} className="grid grid-cols-[2.5rem_1fr] gap-4 py-6 border-t border-glass-border">
                <span className="font-mono text-sm tabular-nums text-gold pt-1">{c.index}</span>
                <div>
                  <h3 className="font-display text-xl leading-snug mb-2">{pick(c.title)}</h3>
                  <p className="text-text-secondary leading-relaxed">{pick(c.body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ===== Practical message ===== */}
        <section aria-labelledby="dba-practical" className="hairline pt-14 mb-20">
          <h2 id="dba-practical" className="eyebrow mb-4">
            {t("practical_title")}
          </h2>
          <p className="font-display text-xl md:text-2xl leading-[1.45] text-text-primary">{pick(practicalMessage)}</p>
        </section>

        {/* ===== Keywords ===== */}
        <section aria-labelledby="dba-keywords" className="hairline pt-14 mb-20">
          <h2 id="dba-keywords" className="eyebrow mb-4">
            {t("keywords_title")}
          </h2>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-sm text-text-secondary">
            {keywords.map((kw) => (
              <li key={kw.en}>{pick(kw)}</li>
            ))}
          </ul>
        </section>

        {/* ===== Declaration (collapsible) ===== */}
        <section className="card overflow-hidden">
          <button
            type="button"
            onClick={() => setDeclarationOpen((v) => !v)}
            className="w-full min-h-11 flex items-center justify-between gap-4 p-6 text-left hover:bg-[var(--hover-wash)] transition-colors"
            aria-expanded={declarationOpen}
            aria-controls="dba-declaration"
          >
            <span className="font-display text-xl">{t("declaration_title")}</span>
            <ChevronDown
              aria-hidden
              className={`w-5 h-5 text-text-secondary transition-transform ${declarationOpen ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence initial={false}>
            {declarationOpen && (
              <motion.div
                id="dba-declaration"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">
                  <p className="text-text-secondary leading-relaxed mb-4">{pick(declarationIntro)}</p>
                  <ul className="space-y-2.5 mb-6 list-disc pl-5 marker:text-gold">
                    {declarationPoints.map((p, i) => (
                      <li key={i} className="text-text-secondary leading-relaxed">
                        {pick(p)}
                      </li>
                    ))}
                  </ul>
                  <dl className="flex flex-col sm:flex-row gap-6 border-t border-glass-border pt-5">
                    <div>
                      <dt className="eyebrow text-text-muted mb-1">{t("signed")}</dt>
                      <dd className="font-display text-lg text-gold">{dbaThesis.candidate}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow text-text-muted mb-1">{t("date")}</dt>
                      <dd className="text-text-primary">{pick(dbaThesis.date)}</dd>
                    </div>
                  </dl>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </Container>
    </div>
  );
}

function SectionHeading({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h2 id={id} className="h-section">
        {title}
      </h2>
      {subtitle && <p className="lede mt-3">{subtitle}</p>}
    </div>
  );
}
