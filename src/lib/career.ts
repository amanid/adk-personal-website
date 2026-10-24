/**
 * Career facts derived from the experience records.
 *
 * Nothing here is typed in by hand: the number of years, the number of
 * organisations, the current role and the tenure at any employer are all read
 * off the same records that render the Experience page. Pure functions only —
 * the server loader lives in career-data.ts so client bundles never pull Prisma.
 */
import { monthIndex, parseMonth, type CareerRole } from "./capabilities";

export interface CareerFacts {
  /** Whole years since the first role began. */
  years: number;
  /** Calendar year of the first role. */
  firstYear: number;
  /** Distinct employers and clients. */
  organizations: number;
  /** Number of roles with a parseable start date. */
  roles: number;
  /** The role with no end date; the most recently started one if several. */
  current: {
    role: string;
    roleFr: string | null;
    organization: string;
    location: string;
    startDate: string;
  } | null;
  /** Month index of "now", so clients format durations consistently with the server. */
  nowMonth: number;
}

/** Whole months a role spans, counting both its first and last month. */
export function roleMonths(role: Pick<CareerRole, "startDate" | "endDate">, nowMonth: number): number | null {
  const start = parseMonth(role.startDate);
  if (start === null) return null;
  const end = role.endDate ? parseMonth(role.endDate) : nowMonth;
  if (end === null || end < start) return null;
  return end - start + 1;
}

export function careerFacts(roles: CareerRole[], now: Date = new Date()): CareerFacts | null {
  const nowMonth = monthIndex(now);
  const dated = roles
    .map((r) => ({ r, start: parseMonth(r.startDate) }))
    .filter((x): x is { r: CareerRole; start: number } => x.start !== null);
  if (!dated.length) return null;

  const firstStart = Math.min(...dated.map((x) => x.start));
  const ongoing = dated.filter((x) => !x.r.endDate).sort((a, b) => b.start - a.start)[0]?.r ?? null;

  return {
    years: Math.max(0, Math.floor((nowMonth - firstStart) / 12)),
    firstYear: Math.floor(firstStart / 12),
    organizations: new Set(roles.map((r) => r.organization.trim())).size,
    roles: dated.length,
    current: ongoing
      ? {
          role: ongoing.role,
          roleFr: ongoing.roleFr ?? null,
          organization: ongoing.organization,
          location: ongoing.location,
          startDate: ongoing.startDate,
        }
      : null,
    nowMonth,
  };
}

/**
 * Whole years spent at the organisations matching `pattern`, summing every
 * matching role. Null when no role matches or none has parseable dates.
 */
export function tenureYears(roles: CareerRole[], pattern: RegExp, now: Date = new Date()): number | null {
  const nowMonth = monthIndex(now);
  let months = 0;
  let matched = false;
  for (const r of roles) {
    if (!pattern.test(r.organization)) continue;
    const m = roleMonths(r, nowMonth);
    if (m === null) continue;
    matched = true;
    months += m;
  }
  return matched ? Math.floor(months / 12) : null;
}

const WORDS_EN = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const WORDS_FR = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze"];

/** Small numbers as words in running text ("six years"), digits above twelve. */
export function spellSmall(n: number, locale: string): string {
  const words = locale === "fr" ? WORDS_FR : WORDS_EN;
  return n >= 0 && n < words.length ? words[n] : String(n);
}

/** Duration in months rendered as "6 yrs 5 mo" / "6 ans 5 mois". */
export function formatTenure(months: number, locale: string): string {
  const fr = locale === "fr";
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y) parts.push(fr ? `${y} an${y > 1 ? "s" : ""}` : `${y} yr${y > 1 ? "s" : ""}`);
  if (m) parts.push(fr ? `${m} mois` : `${m} mo`);
  return parts.join(" ") || (fr ? "1 mois" : "1 mo");
}

/** Replace {years} and {iccoYears} in copy that is read outside next-intl (llms.txt, MCP). */
export function fillCareerPlaceholders(text: string, roles: CareerRole[], locale = "en"): string {
  const facts = careerFacts(roles);
  const icco = tenureYears(roles, /\bICCO\b|International Cocoa Organization/);
  return text
    .replace(/\{years\}/g, facts ? String(facts.years) : "")
    .replace(/\{iccoYears\}/g, icco !== null ? spellSmall(icco, locale) : "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
