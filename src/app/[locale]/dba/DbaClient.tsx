"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Quote,
  Layers,
  FlaskConical,
  Sparkles,
  Trophy,
  Tags,
  FileSignature,
  ChevronDown,
  Building2,
  Target,
} from "lucide-react";
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

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export default function DbaClient() {
  const t = useTranslations("dba");
  const locale = useLocale() as Locale;
  const pick = (b: Bilingual) => b[locale] ?? b.en;
  const [declarationOpen, setDeclarationOpen] = useState(false);

  return (
    <div className="section-padding">
      <div className="max-w-5xl mx-auto">
        {/* ===== Hero ===== */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative glass rounded-3xl overflow-hidden mb-14"
        >
          {/* decorative gradient glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold/10 blur-3xl animate-pulse-gold" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gold/5 blur-3xl" />

          <div className="relative p-8 md:p-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-gold mb-6">
              <GraduationCap className="w-4 h-4" />
              {t("eyebrow")}
            </div>

            <div className="flex items-center justify-center gap-2 text-text-secondary text-sm mb-2">
              <Building2 className="w-4 h-4 text-gold" />
              {dbaThesis.institution}
            </div>
            <p className="text-text-muted text-sm mb-1">{pick(dbaThesis.degree)}</p>
            <p className="text-gold/90 text-xs uppercase tracking-wider mb-8">
              {pick(dbaThesis.option)}
            </p>

            <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
              {pick(dbaThesis.title)}
            </h1>
            <p className="text-text-secondary text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              {pick(dbaThesis.subtitle)}
            </p>

            <p className="text-text-muted text-sm max-w-2xl mx-auto mt-6 italic">
              {pick(dbaThesis.thesisLine)}
            </p>

            {/* candidate / supervisor / date */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { k: t("candidate"), v: dbaThesis.candidate },
                { k: t("supervisor"), v: dbaThesis.supervisor },
                { k: t("date"), v: pick(dbaThesis.date) },
              ].map((item) => (
                <div key={item.k} className="rounded-xl bg-navy/40 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wider text-text-muted mb-1">
                    {item.k}
                  </p>
                  <p className="text-sm font-medium text-text-primary">{item.v}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.header>

        {/* ===== Key facts ===== */}
        <motion.section {...fadeUp} className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {keyFacts.map((fact) => (
              <div
                key={fact.label.en}
                className="glass rounded-xl p-5 hover:border-gold/30 transition-colors"
              >
                <p className="text-[11px] uppercase tracking-wider text-text-muted mb-1.5">
                  {pick(fact.label)}
                </p>
                <p className="text-sm font-medium text-text-primary leading-snug">
                  {pick(fact.value)}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ===== Central claim ===== */}
        <motion.section {...fadeUp} className="mb-16">
          <div className="relative glass rounded-2xl p-8 md:p-10 gradient-border">
            <Quote className="w-8 h-8 text-gold/40 mb-4" />
            <p className="text-xl md:text-2xl font-[family-name:var(--font-display)] leading-relaxed text-text-primary">
              {pick(claimStatement)}
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gold">
              {t("central_claim")}
            </p>
          </div>
        </motion.section>

        {/* ===== Abstract ===== */}
        <motion.section {...fadeUp} className="mb-16">
          <SectionHeading icon={<FileSignature className="w-5 h-5" />} title={t("abstract_title")} />
          <div className="glass rounded-2xl p-8 md:p-10 space-y-5">
            {abstractParagraphs.map((para, i) => (
              <p key={i} className="text-text-secondary leading-relaxed text-[15px]">
                {pick(para)}
              </p>
            ))}
          </div>
        </motion.section>

        {/* ===== Theoretical framework ===== */}
        <motion.section {...fadeUp} className="mb-16">
          <SectionHeading
            icon={<Layers className="w-5 h-5" />}
            title={t("framework_title")}
            subtitle={t("framework_subtitle")}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {frameworkLenses.map((lens, i) => (
              <motion.div
                key={lens.name.en}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass rounded-xl p-6 flex flex-col"
              >
                <span className="self-start rounded-full bg-gold/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-gold mb-3">
                  {pick(lens.role)}
                </span>
                <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] mb-2">
                  {pick(lens.name)}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {pick(lens.description)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ===== Research design ===== */}
        <motion.section {...fadeUp} className="mb-16">
          <SectionHeading
            icon={<FlaskConical className="w-5 h-5" />}
            title={t("design_title")}
            subtitle={t("design_subtitle")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {designMetrics.map((m) => (
              <div
                key={m.label.en}
                className="glass rounded-xl p-5 border-l-2 border-gold/40"
              >
                <p className="text-[11px] uppercase tracking-wider text-text-muted mb-1.5">
                  {pick(m.label)}
                </p>
                <p className="text-sm font-medium text-text-primary leading-snug">
                  {pick(m.value)}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ===== Findings ===== */}
        <motion.section {...fadeUp} className="mb-16">
          <SectionHeading
            icon={<Sparkles className="w-5 h-5" />}
            title={t("findings_title")}
            subtitle={t("findings_subtitle")}
          />
          <div className="space-y-4">
            {findings.map((f, i) => (
              <motion.div
                key={f.title.en}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="glass rounded-xl p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold text-sm font-semibold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary mb-1.5">
                      {pick(f.title)}
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {pick(f.body)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ===== Contributions ===== */}
        <motion.section {...fadeUp} className="mb-16">
          <SectionHeading icon={<Trophy className="w-5 h-5" />} title={t("contributions_title")} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {contributions.map((c, i) => (
              <motion.div
                key={c.index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass rounded-xl p-6 relative overflow-hidden"
              >
                <span className="absolute -top-3 -right-1 text-6xl font-bold font-[family-name:var(--font-display)] text-gold/10 select-none">
                  {c.index}
                </span>
                <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] mb-2 relative">
                  {pick(c.title)}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed relative">
                  {pick(c.body)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ===== Practical message ===== */}
        <motion.section {...fadeUp} className="mb-16">
          <div className="relative glass-strong rounded-2xl p-8 md:p-10 text-center">
            <Target className="w-8 h-8 text-gold mx-auto mb-4" />
            <p className="text-xs uppercase tracking-[0.2em] text-gold mb-3">
              {t("practical_title")}
            </p>
            <p className="text-lg md:text-xl font-[family-name:var(--font-display)] leading-relaxed text-text-primary max-w-3xl mx-auto">
              {pick(practicalMessage)}
            </p>
          </div>
        </motion.section>

        {/* ===== Keywords ===== */}
        <motion.section {...fadeUp} className="mb-16">
          <SectionHeading icon={<Tags className="w-5 h-5" />} title={t("keywords_title")} />
          <div className="flex flex-wrap gap-2.5">
            {keywords.map((kw) => (
              <span
                key={kw.en}
                className="rounded-full border border-glass-border bg-navy/40 px-4 py-2 text-sm text-text-secondary hover:text-gold hover:border-gold/30 transition-colors"
              >
                {pick(kw)}
              </span>
            ))}
          </div>
        </motion.section>

        {/* ===== Declaration (collapsible) ===== */}
        <motion.section {...fadeUp}>
          <div className="glass rounded-2xl overflow-hidden">
            <button
              onClick={() => setDeclarationOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-white/5 transition-colors"
              aria-expanded={declarationOpen}
            >
              <span className="flex items-center gap-3">
                <FileSignature className="w-5 h-5 text-gold" />
                <span className="text-lg font-semibold font-[family-name:var(--font-display)]">
                  {t("declaration_title")}
                </span>
              </span>
              <ChevronDown
                className={`w-5 h-5 text-text-secondary transition-transform ${
                  declarationOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <motion.div
              initial={false}
              animate={{ height: declarationOpen ? "auto" : 0, opacity: declarationOpen ? 1 : 0 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-0">
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  {pick(declarationIntro)}
                </p>
                <ul className="space-y-2.5 mb-6">
                  {declarationPoints.map((p, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      <span className="leading-relaxed">{pick(p)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-6 border-t border-glass-border pt-5 text-sm">
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                      {t("signed")}
                    </p>
                    <p className="font-[family-name:var(--font-display)] text-gold">
                      {dbaThesis.candidate}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                      {t("date")}
                    </p>
                    <p className="text-text-primary">{pick(dbaThesis.date)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="text-gold">{icon}</span>
        <h2 className="text-2xl font-bold font-[family-name:var(--font-display)]">{title}</h2>
      </div>
      {subtitle && <p className="text-text-secondary text-sm">{subtitle}</p>}
    </div>
  );
}
