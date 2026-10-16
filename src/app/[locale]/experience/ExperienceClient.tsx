"use client";

import { useTranslations, useLocale } from "next-intl";
import { experiences as staticExperiences } from "@/data/experience";
import { Container } from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";

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

export default function ExperienceClient({
  initialExperiences,
}: {
  initialExperiences: ExperienceEntry[];
}) {
  const t = useTranslations("experience");
  const fr = useLocale() === "fr";
  const experiences: ExperienceEntry[] = initialExperiences.length
    ? initialExperiences
    : staticExperiences;
  // The span shown above the title comes from the records, never typed in.
  const years = experiences
    .map((e) => Number(e.startDate.match(/\d{4}/)?.[0]))
    .filter((y) => Number.isFinite(y) && y > 0);
  const firstYear = years.length ? Math.min(...years) : null;

  return (
    <>
      <header className="pt-10 pb-12 md:pt-16 md:pb-16">
        <Container>
          {firstYear && (
            <p className="eyebrow mb-5 tabular-nums">
              {firstYear} – {t("present")}
            </p>
          )}
          <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight max-w-3xl">
            {t("title")}
          </h1>
          <p className="lede mt-5 max-w-2xl">{t("subtitle")}</p>
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
                      <p className="font-mono text-xs text-text-muted mt-1">{location}</p>
                    </div>
                    <div className="md:col-span-9 relative md:border-l md:border-glass-border md:pl-10 pb-12 md:pb-14">
                      <span className={`${dot} hidden md:block`} aria-hidden />
                      <h2 className="font-display text-2xl md:text-3xl leading-tight tracking-tight">{role}</h2>
                      <p className="mt-1.5 text-gold">{exp.organization}</p>
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
