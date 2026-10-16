import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Download } from "lucide-react";
import Image from "next/image";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import type { TimelineBar } from "@/lib/capabilities";

interface HeroSectionProps {
  showCvDownload?: boolean;
  cvUrl?: string;
  /** Portrait URL from the site settings (server-provided, no client fetch). */
  profilePhoto?: string;
  /** The role with no end date, taken from the experience records. */
  currentRole?: { role: string; organization: string; location: string } | null;
  /** Every figure here is computed from the records, never typed in. */
  figures: { value: number; suffix?: string; label: string }[];
  timeline: TimelineBar[];
  rangeStart: number;
  rangeEnd: number;
}

/*
 * Editorial: the name carries the page, set large in the display serif with
 * the given names in italic. Beneath it, the career itself drawn as a line —
 * one stroke per role, from the experience records — is the only ornament.
 */
export default function HeroSection({
  showCvDownload = false,
  cvUrl,
  profilePhoto,
  currentRole,
  figures,
  timeline,
  rangeStart,
  rangeEnd,
}: HeroSectionProps) {
  const t = useTranslations("hero");
  const fr = useLocale() === "fr";
  const roles = t("roles").split("|").map((r) => r.trim()).filter(Boolean);
  const [surname, ...given] = t("name").split(" ");
  const photo = profilePhoto || "/images/profile.jpg?v2";

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="hero-grid absolute inset-0 pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 md:pt-24 md:pb-20">
        <div className="grid md:grid-cols-12 gap-10 md:gap-14 items-end">
          <div className="md:col-span-7 order-2 md:order-1">
            {currentRole && (
              <p className="eyebrow mb-6 rise" style={{ ["--i" as string]: 0 }}>
                {currentRole.role}
              </p>
            )}

            <h1 className="display-name mb-8 rise" style={{ ["--i" as string]: 1 }}>
              {surname}
              <br />
              <em className="font-normal text-text-secondary">{given.join(" ")}</em>
            </h1>

            <ul
              className="flex flex-wrap gap-x-3 gap-y-2 mb-7 font-mono text-xs uppercase tracking-[0.08em] text-text-muted rise"
              style={{ ["--i" as string]: 2 }}
            >
              {roles.map((r, i) => (
                <li key={r} className="flex items-center gap-3">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-gold" aria-hidden />}
                  {r}
                </li>
              ))}
            </ul>

            <p className="lede max-w-xl mb-10 rise" style={{ ["--i" as string]: 3 }}>
              {t("description")}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 rise" style={{ ["--i" as string]: 4 }}>
              <ButtonLink href="/services" size="lg" className="group">
                {t("cta_services")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary" size="lg">
                {t("cta_contact")}
              </ButtonLink>
              {showCvDownload && (
                <a
                  href={cvUrl || "/cv/CV-Amani-Konan-Senior-Data-Scientist.pdf"}
                  download
                  className={buttonClass("ghost", "lg")}
                >
                  <Download className="w-4 h-4" />
                  {t("download_cv")}
                </a>
              )}
            </div>
          </div>

          <figure className="md:col-span-5 order-1 md:order-2 max-w-[18rem] sm:max-w-sm md:max-w-none rise" style={{ ["--i" as string]: 1 }}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] border border-glass-border bg-surface-1 shadow-[var(--elev-lg)]">
              <Image
                src={photo}
                alt="KONAN Amani Dieudonné"
                fill
                // The source photo has a thin white strip on its bottom and right
                // edges; a slight zoom anchored top-left keeps it out of frame.
                className="object-cover scale-[1.04] origin-top-left"
                priority
                sizes="(max-width: 768px) 288px, 420px"
                // Settings URLs carry a ?v cache-buster, which Next 16 rejects
                // for optimised local images; the optimiser also costs RAM on
                // the 512MB host.
                unoptimized
              />
            </div>
            {currentRole && (
              <figcaption className="mt-3 flex gap-3 text-xs leading-relaxed">
                <span className="text-gold shrink-0 pt-px" aria-hidden>●</span>
                <span className="text-text-secondary">
                  {currentRole.organization}
                  <br />
                  {currentRole.location}
                </span>
              </figcaption>
            )}
          </figure>
        </div>

        {/* Figures and the career line */}
        <div className="mt-16 md:mt-20 pt-8 hairline grid md:grid-cols-12 gap-10 items-end">
          <dl className="md:col-span-5 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
            {figures.map((f) => (
              <div key={f.label}>
                <dd className="font-mono text-3xl md:text-4xl text-text-primary tabular-nums tracking-tight">
                  {f.value}
                  {f.suffix && <span className="text-gold">{f.suffix}</span>}
                </dd>
                <dt className="mt-1 text-xs text-text-muted">{f.label}</dt>
              </div>
            ))}
          </dl>
          <div className="md:col-span-7">
            <CareerLine timeline={timeline} rangeStart={rangeStart} rangeEnd={rangeEnd} fr={fr} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** One hairline per role across the career span; the current role in accent. */
function CareerLine({
  timeline,
  rangeStart,
  rangeEnd,
  fr,
}: {
  timeline: TimelineBar[];
  rangeStart: number;
  rangeEnd: number;
  fr: boolean;
}) {
  if (!timeline.length || rangeEnd <= rangeStart) return null;
  const W = 640;
  const LANE = 9;
  const lanes = 4;
  const H = lanes * LANE + 22;
  const span = rangeEnd - rangeStart;
  const x = (m: number) => ((m - rangeStart) / span) * W;
  const firstYear = Math.floor(rangeStart / 12);
  const lastYear = Math.floor(rangeEnd / 12);
  const step = lastYear - firstYear > 8 ? 3 : 1;
  const years: number[] = [];
  for (let y = Math.ceil(firstYear / step) * step; y <= lastYear; y += step) years.push(y);

  // Oldest first, so overlapping roles stack into lanes left to right.
  const bars = [...timeline].sort((a, b) => a.start - b.start);
  const label = fr
    ? `${bars.length} postes de ${firstYear} à aujourd'hui`
    : `${bars.length} roles from ${firstYear} to today`;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible" role="img" aria-label={label}>
        {bars.map((b, i) => {
          const y = (i % lanes) * LANE + 4;
          const x1 = x(b.start);
          const x2 = Math.max(x(b.end + 1), x1 + 3);
          return (
            <line
              key={`${b.organization}-${b.start}`}
              x1={x1}
              x2={x2}
              y1={y}
              y2={y}
              strokeWidth={b.current ? 3 : 1.5}
              strokeLinecap="round"
              className={b.current ? "stroke-gold draw" : "stroke-text-muted/70 draw"}
              style={{ ["--len" as string]: Math.ceil(x2 - x1) + 2 }}
            >
              <title>{`${fr && b.roleFr ? b.roleFr : b.role} · ${b.organization}`}</title>
            </line>
          );
        })}
        <line x1={0} x2={W} y1={lanes * LANE + 4} y2={lanes * LANE + 4} className="stroke-glass-border" strokeWidth={1} />
        {years.map((y) => (
          <text
            key={y}
            x={Math.min(Math.max(x(y * 12), 0), W)}
            y={H}
            textAnchor={x(y * 12) < 20 ? "start" : x(y * 12) > W - 20 ? "end" : "middle"}
            className="fill-text-muted font-mono"
            fontSize={10}
          >
            {y}
          </text>
        ))}
      </svg>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}
