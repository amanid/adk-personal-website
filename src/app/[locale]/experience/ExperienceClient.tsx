"use client";

import { useTranslations, useLocale } from "next-intl";
import { experiences as staticExperiences } from "@/data/experience";
import { countriesWorked } from "@/data/countries";
import { Container } from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { careerFacts, formatTenure, roleMonths } from "@/lib/career";
import { parseMonth } from "@/lib/capabilities";

export interface ExperienceEntry {
  id: string;
  role: string;
  roleFr: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string | null;
  description: string[];
  descriptionFr: string[];
}

const MONTHS_FR: Record<string, string> = {
  Jan: "janv.",
  Feb: "févr.",
  Mar: "mars",
  Apr: "avr.",
  May: "mai",
  Jun: "juin",
  Jul: "juil.",
  Aug: "août",
  Sep: "sept.",
  Oct: "oct.",
  Nov: "nov.",
  Dec: "déc.",
};

const LOCATIONS_FR: Record<string, string> = {
  Remote: "À distance",
  "Cairo, Egypt": "Le Caire, Égypte",
};

/** "Sep 2023" stays as is in English; in French the month is translated. */
function formatMonth(value: string, fr: boolean) {
  if (!fr) return value;
  const [m, y] = value.split(" ");
  return MONTHS_FR[m] && y ? `${MONTHS_FR[m]} ${y}` : value;
}

/** The short name in brackets when the record has one: "(ICCO)" → "ICCO". */
function shortOrg(org: string) {
  const m = org.match(/\(([^)]+)\)\s*$/);
  return m ? m[1] : org;
}

export default function ExperienceClient({
  initialExperiences,
  nowMonth,
}: {
  initialExperiences: ExperienceEntry[];
  /** Month index of "now", computed on the server so durations match across render passes. */
  nowMonth: number;
}) {
  const t = useTranslations("experience");
  const locale = useLocale();
  const fr = locale === "fr";
  const experiences: ExperienceEntry[] = initialExperiences.length ? initialExperiences : staticExperiences;

  // Every figure above the list is computed from the roles below it.
  const now = new Date(Date.UTC(Math.floor(nowMonth / 12), nowMonth % 12, 1));
  const facts = careerFacts(experiences, now);

  // A role overlapping a longer one is a concurrent engagement: the longer
  // role is the "main" one for the overlap note. Computed from dates only.
  const spans = experiences.map((e) => {
    const start = parseMonth(e.startDate);
    const end = e.endDate ? parseMonth(e.endDate) : nowMonth;
    return { id: e.id, start, end, org: e.organization, months: roleMonths(e, nowMonth) };
  });
  const concurrentWith = (id: string): string | null => {
    const me = spans.find((s) => s.id === id);
    if (!me || me.start === null || me.end === null || me.months === null) return null;
    const host = spans
      .filter((s) => s.id !== id && s.start !== null && s.end !== null && s.months !== null)
      .filter((s) => (s.start as number) <= me.start! && (s.end as number) >= me.end!)
      .filter((s) => (s.months as number) > (me.months as number))
      .sort((a, b) => (b.months as number) - (a.months as number))[0];
    return host ? shortOrg(host.org) : null;
  };

  return (
    <>
      <header className="pt-10 pb-10 md:pt-16 md:pb-12">
        <Container>
          {facts && (
            <p className="eyebrow mb-5 tabular-nums">
              {facts.firstYear} – {t("present")}
            </p>
          )}
          <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight max-w-3xl">
            {t("title")}
          </h1>
          <p className="lede mt-5 max-w-2xl">{t("subtitle")}</p>

          {facts && (
            <dl className="fact-strip mt-10 md:mt-12" aria-label={t("summary_note")}>
              {[
                { value: facts.years, suffix: "+", label: t("summary_years") },
                { value: facts.roles, label: t("summary_roles") },
                { value: facts.organizations, label: t("summary_orgs") },
                { value: countriesWorked.length, label: t("summary_countries") },
              ].map((f) => (
                <div key={f.label} className="flex flex-col-reverse">
                  <dt className="mb-1 text-xs text-text-muted">{f.label}</dt>
                  <dd className="font-mono text-3xl md:text-4xl text-text-primary tabular-nums tracking-tight">
                    {f.value}
                    {f.suffix && <span className="text-gold">{f.suffix}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {facts && <p className="mt-3 text-xs text-text-muted">{t("summary_note")}</p>}
        </Container>
      </header>

      <section className="pb-20 md:pb-28">
        <Container>
          <Reveal>
            <ol>
              {experiences.map((exp) => {
                const role = fr && exp.roleFr ? exp.roleFr : exp.role;
                const bullets = fr && exp.descriptionFr?.length ? exp.descriptionFr : exp.description;
                const start = formatMonth(exp.startDate, fr);
                const end = exp.endDate ? formatMonth(exp.endDate, fr) : t("present");
                const dates = exp.endDate && exp.endDate === exp.startDate ? start : `${start} – ${end}`;
                const location = fr ? (LOCATIONS_FR[exp.location] ?? exp.location) : exp.location;
                const current = !exp.endDate;
                const months = roleMonths(exp, nowMonth);
                const host = concurrentWith(exp.id);
                const dot = `absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${
                  current ? "bg-gold border-gold" : "bg-charcoal border-text-muted"
                }`;

                return (
                  <li
                    key={exp.id}
                    className="relative grid md:grid-cols-12 gap-2 md:gap-0 border-l md:border-l-0 border-glass-border pl-6 md:pl-0"
                  >
                    <span className={`${dot} md:hidden`} aria-hidden />
                    <div className="md:col-span-3 md:pr-8 md:text-right">
                      <p className="font-mono text-sm text-text-primary tabular-nums">{dates}</p>
                      {months !== null && (
                        <p className="font-mono text-xs text-text-muted mt-1 tabular-nums">
                          <span className="sr-only">{t("tenure_label")}: </span>
                          {formatTenure(months, locale)}
                        </p>
                      )}
                      <p className="font-mono text-xs text-text-muted mt-1">{location}</p>
                    </div>
                    <div className="md:col-span-9 relative md:border-l md:border-glass-border md:pl-10 pb-12 md:pb-14">
                      <span className={`${dot} hidden md:block`} aria-hidden />
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h2 className="font-display text-2xl md:text-3xl leading-tight tracking-tight">{role}</h2>
                        {current && (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-gold">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden />
                            {t("current")}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-gold">{exp.organization}</p>
                      {host && (
                        <p className="mt-1 text-xs text-text-muted">{t("concurrent", { org: host })}</p>
                      )}
                      {bullets.length > 0 && (
                        <ul className="mt-5 space-y-2.5 max-w-3xl">
                          {bullets.map((desc, i) => (
                            <li
                              key={i}
                              className="grid grid-cols-[1rem_1fr] text-sm md:text-[0.9375rem] text-text-secondary leading-relaxed"
                            >
                              <span className="mt-[0.75em] w-1.5 h-px bg-text-muted" aria-hidden />
                              {desc}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
