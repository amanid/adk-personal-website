import { useTranslations, useLocale } from "next-intl";
import { education } from "@/data/skills";

// Formal degrees; everything else in the list is a certificate or programme.
const DEGREE = /\b(Master|Ingénieur|Bachelor|Licence)\b/;
import { Section } from "@/components/ui/Section";

/** Degrees and certificates as a two-column register, newest first. */
export default function CertificationsShowcase() {
  const t = useTranslations("certifications_showcase");
  const tHome = useTranslations("homeV2");
  const fr = useLocale() === "fr";
  const columns = [
    { title: t("education_title"), items: education.filter((e) => DEGREE.test(e.degree)) },
    { title: t("certifications_title"), items: education.filter((e) => !DEGREE.test(e.degree)) },
  ];

  return (
    <Section eyebrow={tHome("creds_eyebrow")} title={t("title")} intro={t("subtitle")}>
      <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="eyebrow text-text-muted mb-2">{col.title}</h3>
            <ul>
              {col.items.map((e) => (
                <li key={`${e.institution}-${e.year}-${e.degree}`} className="grid grid-cols-[4rem_1fr] gap-4 py-4 border-b border-glass-border">
                  <span className="font-mono text-sm text-text-muted pt-0.5">{e.year}</span>
                  <span>
                    <span className="block text-text-primary leading-snug">{fr ? e.degreeFr : e.degree}</span>
                    <span className="block text-sm text-text-muted mt-1">{e.institution}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
