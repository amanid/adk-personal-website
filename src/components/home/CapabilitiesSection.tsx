"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import type { CapabilityData, CategoryCount, TimelineBar } from "@/lib/capabilities";
import { UNCATEGORISED } from "@/lib/capabilities";

/*
 * Every number on this section is derived from the site's own records in
 * src/lib/capabilities.ts. Colour does one job per chart: signal blue for the
 * measure, vermilion only to single out the current role, violet for
 * credentials. Values and labels stay in text tokens, never the series colour.
 */

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function formatMonth(idx: number, fr: boolean) {
  return `${(fr ? MONTHS_FR : MONTHS_EN)[idx % 12]} ${Math.floor(idx / 12)}`;
}

function formatDuration(months: number, fr: boolean) {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y) parts.push(fr ? `${y} an${y > 1 ? "s" : ""}` : `${y} yr`);
  if (m) parts.push(fr ? `${m} mois` : `${m} mo`);
  return parts.join(" ") || (fr ? "1 mois" : "1 mo");
}

function Panel({
  index,
  title,
  note,
  children,
  className = "",
}: {
  index: string;
  title: string;
  note?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass p-5 md:p-7 ${className}`}>
      <div className="flex items-baseline justify-between gap-4 mb-6 border-b border-glass-border pb-4">
        <h3 className="text-base md:text-lg font-semibold text-text-primary">
          <span className="figure text-text-muted mr-3 text-sm">{index}</span>
          {title}
        </h3>
        {note && <p className="text-xs text-text-muted text-right shrink-0 max-w-[50%]">{note}</p>}
      </div>
      {children}
    </div>
  );
}

function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  const t = useTranslations("capabilities");
  return (
    <details className="mt-5 group">
      <summary className="cursor-pointer select-none text-xs text-text-muted hover:text-text-primary transition-colors w-fit">
        {t("view_table")}
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="text-left text-text-muted border-b border-glass-border">
              {head.map((h) => (
                <th key={h} scope="col" className="py-2 pr-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-glass-border/60 text-text-secondary">
                {r.map((c, j) => (
                  <td key={j} className={`py-2 pr-4 ${typeof c === "number" ? "figure" : ""}`}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/* ── 01 · Career timeline ─────────────────────────────────────────────── */

function CareerTimeline({ data }: { data: CapabilityData }) {
  const t = useTranslations("capabilities");
  const fr = useLocale() === "fr";
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);

  const firstCredential = data.credentials[0]?.year;
  const startYear = Math.min(Math.floor(data.rangeStart / 12), firstCredential ?? Infinity);
  const axisStart = startYear * 12;
  const axisEnd = data.rangeEnd + 1;
  const span = axisEnd - axisStart;
  const pct = (m: number) => ((m - axisStart) / span) * 100;

  const endYear = Math.floor(data.rangeEnd / 12);
  const ticks: number[] = [];
  for (let y = startYear; y <= endYear; y += 2) ticks.push(y);
  // Close the axis on the current year unless that would crowd the last tick.
  if (endYear - ticks[ticks.length - 1] >= 2) ticks.push(endYear);

  const bars = data.timeline;
  const activeBar: TimelineBar | null = active !== null && active < bars.length ? bars[active] : null;
  const activeCred = active !== null && active >= bars.length ? data.credentials[active - bars.length] : null;

  const roleOf = (b: TimelineBar) => (fr && b.roleFr ? b.roleFr : b.role);
  const shortOrg = (org: string) => {
    const m = org.match(/\(([^)]+)\)\s*$/);
    return m ? m[1] : org;
  };

  return (
    <>
      <div className="relative" onMouseLeave={() => setActive(null)}>
        <div className="relative">
        {/* Year gridlines, behind the bars */}
        <div className="absolute inset-y-0 left-0 right-0 md:left-[11rem] pointer-events-none" aria-hidden>
          {ticks.map((y) => (
            <div
              key={y}
              className="absolute top-0 bottom-0 border-l border-dashed border-glass-border"
              style={{ left: `${pct(y * 12)}%` }}
            />
          ))}
        </div>
        <ul className="relative space-y-1.5" aria-label={t("timeline_title")}>
          {bars.map((b, i) => (
            <li key={`${b.organization}-${b.start}`} className="md:grid md:grid-cols-[11rem_1fr] md:items-center gap-0">
              <span
                className={`block truncate text-xs pr-3 mb-1 md:mb-0 ${active === i ? "text-text-primary" : "text-text-muted"}`}
                title={b.organization}
              >
                {shortOrg(b.organization)}
              </span>
              <div className="relative h-4">
                <motion.button
                  type="button"
                  aria-label={`${roleOf(b)}, ${b.organization}, ${formatMonth(b.start, fr)} – ${
                    b.current ? t("present") : formatMonth(b.end, fr)
                  }`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive(active === i ? null : i)}
                  initial={reduce ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.04, ease: [0.2, 0.7, 0.2, 1] }}
                  className={`absolute top-0 h-full origin-left rounded-[3px] outline-offset-2 transition-opacity ${
                    b.current ? "bg-gold" : "bg-signal"
                  } ${active !== null && active !== i ? "opacity-35" : "opacity-100"}`}
                  style={{
                    left: `${pct(b.start)}%`,
                    // A one-month engagement still needs a hittable mark.
                    width: `max(6px, ${(b.months / span) * 100}%)`,
                  }}
                />
              </div>
            </li>
          ))}

          {/* Credentials track */}
          <li className="md:grid md:grid-cols-[11rem_1fr] md:items-center pt-3 mt-3 border-t border-glass-border">
            <span className="block text-xs pr-3 mb-1 md:mb-0 text-text-muted">{t("credentials")}</span>
            <div className="relative h-5">
              {data.credentials.map((c, j) => {
                const i = bars.length + j;
                // Mid-year: the records hold a year, not a month.
                const left = pct(c.year * 12 + 6);
                const sameYearBefore = data.credentials.slice(0, j).filter((x) => x.year === c.year).length;
                return (
                  <button
                    key={`${c.name}-${c.year}`}
                    type="button"
                    aria-label={`${c.name}, ${c.institution}, ${c.year}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    onClick={() => setActive(active === i ? null : i)}
                    className={`absolute top-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-violet ring-2 ring-[var(--color-glass)] transition-opacity ${
                      active !== null && active !== i ? "opacity-35" : "opacity-100"
                    }`}
                    style={{ left: `calc(${left}% + ${sameYearBefore * 10}px)` }}
                  />
                );
              })}
            </div>
          </li>
        </ul>
        </div>

        {/* Axis labels */}
        <div className="relative h-6 mt-2 md:ml-[11rem]" aria-hidden>
          {ticks.map((y) => (
            <span
              key={y}
              className="absolute figure text-[11px] text-text-muted -translate-x-1/2"
              style={{ left: `${pct(y * 12)}%` }}
            >
              {y}
            </span>
          ))}
        </div>

        {/* Readout: one place for the detail, so it works for touch and keyboard too */}
        <div className="mt-4 min-h-[3.5rem] border-l-2 border-glass-border pl-4" aria-live="polite">
          {activeBar ? (
            <>
              <p className="text-sm text-text-primary font-medium">{roleOf(activeBar)}</p>
              <p className="text-xs text-text-secondary mt-0.5">
                {activeBar.organization} · {activeBar.location}
              </p>
              <p className="figure text-xs text-text-muted mt-1">
                {formatMonth(activeBar.start, fr)} – {activeBar.current ? t("present") : formatMonth(activeBar.end, fr)} ·{" "}
                {formatDuration(activeBar.months, fr)}
              </p>
            </>
          ) : activeCred ? (
            <>
              <p className="text-sm text-text-primary font-medium">{activeCred.name}</p>
              <p className="text-xs text-text-secondary mt-0.5">{activeCred.institution}</p>
              <p className="figure text-xs text-text-muted mt-1">{activeCred.year}</p>
            </>
          ) : (
            <p className="text-xs text-text-muted pt-1">{t("timeline_hint")}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-xs text-text-secondary">
        <span className="inline-flex items-center gap-2"><span className="w-3 h-2.5 rounded-[2px] bg-gold" />{t("legend_current")}</span>
        <span className="inline-flex items-center gap-2"><span className="w-3 h-2.5 rounded-[2px] bg-signal" />{t("legend_past")}</span>
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rotate-45 bg-violet" />{t("legend_credential")}</span>
      </div>

      <DataTable
        caption={t("timeline_title")}
        head={[t("col_role"), t("col_org"), t("col_from"), t("col_to"), t("col_duration")]}
        rows={bars.map((b) => [
          roleOf(b),
          b.organization,
          formatMonth(b.start, fr),
          b.current ? t("present") : formatMonth(b.end, fr),
          formatDuration(b.months, fr),
        ])}
      />
    </>
  );
}

/* ── Ranked bars (publications, tools) ────────────────────────────────── */

function RankedBars({
  items,
  max,
  valueLabel,
  label,
}: {
  items: CategoryCount[];
  max: number;
  valueLabel: (c: CategoryCount) => string;
  label: (c: CategoryCount) => string;
}) {
  const reduce = useReducedMotion();
  return (
    <ul className="space-y-3">
      {items.map((c, i) => (
        <li key={c.label} className="group" title={`${label(c)}: ${valueLabel(c)}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm mb-1.5">
            <span className="text-text-secondary group-hover:text-text-primary transition-colors truncate">{label(c)}</span>
            <span className="figure text-text-primary shrink-0">{valueLabel(c)}</span>
          </div>
          <div className="h-1.5 bg-navy rounded-full overflow-hidden">
            <motion.div
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
              className="h-full origin-left bg-signal rounded-full group-hover:brightness-125"
              style={{ width: `${(c.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ── Section ───────────────────────────────────────────────────────────── */

export default function CapabilitiesSection({ data }: { data: CapabilityData }) {
  const t = useTranslations("capabilities");
  const fr = useLocale() === "fr";

  const themeLabel = (c: CategoryCount) => (c.label === UNCATEGORISED ? t("uncategorised") : c.label);
  const topTools = data.tools.slice(0, 8);
  const years = data.publicationYears
    ? data.publicationYears[0] === data.publicationYears[1]
      ? `${data.publicationYears[0]}`
      : `${data.publicationYears[0]}–${data.publicationYears[1]}`
    : "";

  return (
    <section className="section-padding" aria-labelledby="capabilities-title">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 md:mb-14"
        >
          <div>
            <p className="eyebrow mb-3">{t("eyebrow")}</p>
            <h2 id="capabilities-title" className="text-3xl md:text-5xl font-semibold font-[family-name:var(--font-display)] max-w-3xl">
              {data.facts.years !== null ? t("title", { years: data.facts.years }) : t("title_plain")}
            </h2>
            <p className="text-text-secondary mt-4 max-w-2xl leading-relaxed">{t("subtitle")}</p>
          </div>
        </motion.div>

        <div className="grid gap-5 md:gap-6 lg:grid-cols-2">
          {data.timeline.length > 0 && (
            <Panel index="01" title={t("timeline_title")} note={t("timeline_note")} className="lg:col-span-2">
              <CareerTimeline data={data} />
            </Panel>
          )}

          {data.publicationsTotal > 0 && (
            <Panel
              index="02"
              title={t("pubs_title")}
              note={t("pubs_note", { total: data.publicationsTotal, years })}
            >
              <RankedBars
                items={data.publicationsByTheme}
                max={data.publicationsByTheme[0]?.count ?? 1}
                label={themeLabel}
                valueLabel={(c) => String(c.count)}
              />
              <DataTable
                caption={t("pubs_title")}
                head={[t("col_theme"), t("col_count")]}
                rows={data.publicationsByTheme.map((c) => [themeLabel(c), c.count])}
              />
            </Panel>
          )}

          {data.projectsTotal > 0 && topTools.length > 0 && (
            <Panel index="03" title={t("tools_title")} note={t("tools_note", { total: data.projectsTotal })}>
              <RankedBars
                items={topTools}
                max={data.projectsTotal}
                label={(c) => c.label}
                valueLabel={(c) => `${c.count} / ${data.projectsTotal}`}
              />
              <DataTable
                caption={t("tools_title")}
                head={[t("col_tool"), t("col_projects")]}
                rows={data.tools.map((c) => [c.label, c.count])}
              />
            </Panel>
          )}

          {data.domains.length > 0 && (
            <Panel index="04" title={t("domains_title")} note={t("domains_note")} className="lg:col-span-2">
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-8">
                {data.domains.map((d, i) => (
                  <div key={d.name} className="border-t-2 border-text-primary/80 pt-3">
                    <p className="figure text-xs text-text-muted mb-1">{String(i + 1).padStart(2, "0")}</p>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">{fr && d.nameFr ? d.nameFr : d.name}</h4>
                    <ul className="space-y-1.5">
                      {d.skills.map((s) => (
                        <li key={s} className="text-xs text-text-secondary leading-snug">{s}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </section>
  );
}
