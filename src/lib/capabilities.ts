/**
 * Derives the homepage infographics from the records the site already holds.
 *
 * Every figure here is computed from data — nothing is typed in by hand — so
 * the charts cannot drift from the CV, the publication list or the portfolio.
 * Pure functions only: the page fetches, this module counts.
 */

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Month index since year 0 for "Sep 2023"-style dates; null if unparseable. */
export function parseMonth(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = value.trim().match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[1].toLowerCase());
  if (month < 0) return null;
  return Number(m[2]) * 12 + month;
}

export function monthIndex(date: Date): number {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

export interface CareerRole {
  role: string;
  roleFr?: string | null;
  organization: string;
  location: string;
  startDate: string;
  endDate?: string | null;
}

export interface TimelineBar {
  role: string;
  roleFr: string | null;
  organization: string;
  location: string;
  startDate: string;
  endDate: string | null;
  /** Inclusive month indexes; `end` is the current month for an ongoing role. */
  start: number;
  end: number;
  current: boolean;
  /** Length in months, counting both the first and the last month. */
  months: number;
}

export interface CredentialMark {
  name: string;
  institution: string;
  year: number;
}

export interface CategoryCount {
  label: string;
  count: number;
}

export interface CapabilityData {
  timeline: TimelineBar[];
  credentials: CredentialMark[];
  /** Month index of the first role, and of "now". */
  rangeStart: number;
  rangeEnd: number;
  publicationsByTheme: CategoryCount[];
  publicationsTotal: number;
  publicationYears: [number, number] | null;
  tools: CategoryCount[];
  projectsTotal: number;
  domains: { name: string; nameFr: string | null; skills: string[] }[];
  facts: {
    /** Whole years since the first role began. */
    years: number | null;
    organizations: number;
    publications: number;
  };
}

export function buildTimeline(roles: CareerRole[], now: Date): TimelineBar[] {
  const nowIdx = monthIndex(now);
  const bars: TimelineBar[] = [];
  for (const r of roles) {
    const start = parseMonth(r.startDate);
    if (start === null) continue;
    const parsedEnd = parseMonth(r.endDate ?? null);
    const current = !r.endDate;
    // An end date that doesn't parse is dropped rather than guessed at.
    if (!current && parsedEnd === null) continue;
    const end = current ? nowIdx : (parsedEnd as number);
    if (end < start) continue;
    bars.push({
      role: r.role,
      roleFr: r.roleFr ?? null,
      organization: r.organization,
      location: r.location,
      startDate: r.startDate,
      endDate: r.endDate ?? null,
      start,
      end,
      current,
      months: end - start + 1,
    });
  }
  return bars.sort((a, b) => a.start - b.start || a.end - b.end);
}

/**
 * Education and certifications merged. The two lists overlap and word the same
 * credential slightly differently ("Data Science Specialization" vs "… Certificate"),
 * so an entry is a duplicate when it shares a year and one name starts with the other.
 * The education wording wins because it is added first.
 */
export function buildCredentials(
  education: { degree: string; institution: string; year: string }[],
  certifications: { name: string; issuer: string; year: string }[],
): CredentialMark[] {
  const out: CredentialMark[] = [];
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const add = (name: string, institution: string, yearText: string) => {
    const year = Number.parseInt(yearText, 10);
    if (!Number.isFinite(year)) return;
    const n = norm(name);
    const dup = out.some((c) => {
      if (c.year !== year) return false;
      const m = norm(c.name);
      return m.startsWith(n) || n.startsWith(m);
    });
    if (!dup) out.push({ name, institution, year });
  };
  education.forEach((e) => add(e.degree, e.institution, e.year));
  certifications.forEach((c) => add(c.name, c.issuer, c.year));
  return out.sort((a, b) => a.year - b.year);
}

/** Tally a list of labels, largest first, ties broken alphabetically. */
export function tally(labels: string[]): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export const UNCATEGORISED = "__uncategorised__";

export function buildCapabilityData(input: {
  roles: CareerRole[];
  publications: { year: number; category: string | null }[];
  projects: { technologies: string[] }[];
  education: { degree: string; institution: string; year: string }[];
  certifications: { name: string; issuer: string; year: string }[];
  skillCategories: { name: string; nameFr: string | null; skills: { name: string }[] }[];
  now?: Date;
}): CapabilityData {
  const now = input.now ?? new Date();
  const timeline = buildTimeline(input.roles, now);
  const rangeStart = timeline.length ? Math.min(...timeline.map((t) => t.start)) : monthIndex(now);
  const rangeEnd = monthIndex(now);

  const years = input.publications.map((p) => p.year).filter(Number.isFinite);

  return {
    timeline,
    credentials: buildCredentials(input.education, input.certifications),
    rangeStart,
    rangeEnd,
    publicationsByTheme: tally(input.publications.map((p) => p.category?.trim() || UNCATEGORISED)),
    publicationsTotal: input.publications.length,
    publicationYears: years.length ? [Math.min(...years), Math.max(...years)] : null,
    // A project lists a technology at most once, so a count is "projects using it".
    tools: tally(input.projects.flatMap((p) => [...new Set(p.technologies.map((t) => t.trim()))])),
    projectsTotal: input.projects.length,
    domains: input.skillCategories.map((c) => ({
      name: c.name,
      nameFr: c.nameFr,
      skills: c.skills.map((s) => s.name),
    })),
    facts: {
      years: timeline.length ? Math.floor((rangeEnd - rangeStart) / 12) : null,
      organizations: new Set(input.roles.map((r) => r.organization.trim())).size,
      publications: input.publications.length,
    },
  };
}
