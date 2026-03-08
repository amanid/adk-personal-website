import type { PublicationData } from "@/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function authorLastFirst(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  const last = parts[parts.length - 1];
  const rest = parts.slice(0, -1).join(" ");
  return `${last}, ${rest}`;
}

function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  const last = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map((p) => p[0] + ".").join(" ");
  return `${last}, ${initials}`;
}

export function toBibTeX(pub: PublicationData): string {
  const typeMap: Record<string, string> = {
    JOURNAL_ARTICLE: "article",
    CONFERENCE_PAPER: "inproceedings",
    BOOK_CHAPTER: "incollection",
    THESIS_DISSERTATION: "phdthesis",
    TECHNICAL_REPORT: "techreport",
    WORKING_PAPER: "unpublished",
    PREPRINT: "unpublished",
    ANALYTICAL_REPORT: "techreport",
  };
  const entryType = typeMap[pub.publicationType] || "misc";
  const key = pub.slug.replace(/-/g, "_");
  const lines: string[] = [`@${entryType}{${key},`];
  lines.push(`  author = {${pub.authors.join(" and ")}},`);
  lines.push(`  title = {${pub.title}},`);
  lines.push(`  year = {${pub.year}},`);
  if (pub.journal) lines.push(`  journal = {${pub.journal}},`);
  if (pub.volume) lines.push(`  volume = {${pub.volume}},`);
  if (pub.issue) lines.push(`  number = {${pub.issue}},`);
  if (pub.pages) lines.push(`  pages = {${pub.pages}},`);
  if (pub.publisher) lines.push(`  publisher = {${pub.publisher}},`);
  if (pub.doi) lines.push(`  doi = {${pub.doi}},`);
  if (pub.conferenceName) lines.push(`  booktitle = {${pub.conferenceName}},`);
  if (pub.bookTitle) lines.push(`  booktitle = {${pub.bookTitle}},`);
  if (pub.institution) lines.push(`  institution = {${pub.institution}},`);
  if (pub.month) lines.push(`  month = {${MONTHS[pub.month - 1]?.toLowerCase()}},`);
  if (pub.url) lines.push(`  url = {${pub.url}},`);
  lines.push("}");
  return lines.join("\n");
}

export function toAPA(pub: PublicationData): string {
  const authors = pub.authors.map(authorInitials).join(", ");
  let citation = `${authors} (${pub.year}). ${pub.title}.`;
  if (pub.journal) {
    citation += ` *${pub.journal}*`;
    if (pub.volume) citation += `, *${pub.volume}*`;
    if (pub.issue) citation += `(${pub.issue})`;
    if (pub.pages) citation += `, ${pub.pages}`;
    citation += ".";
  }
  if (pub.conferenceName) citation += ` In *${pub.conferenceName}*.`;
  if (pub.bookTitle) citation += ` In *${pub.bookTitle}*.`;
  if (pub.publisher) citation += ` ${pub.publisher}.`;
  if (pub.institution) citation += ` ${pub.institution}.`;
  if (pub.doi) citation += ` https://doi.org/${pub.doi}`;
  return citation;
}

export function toMLA(pub: PublicationData): string {
  const authors = pub.authors.length === 1
    ? authorLastFirst(pub.authors[0])
    : pub.authors.length === 2
    ? `${authorLastFirst(pub.authors[0])}, and ${pub.authors[1]}`
    : `${authorLastFirst(pub.authors[0])}, et al.`;
  let citation = `${authors}. "${pub.title}."`;
  if (pub.journal) {
    citation += ` *${pub.journal}*`;
    if (pub.volume) citation += `, vol. ${pub.volume}`;
    if (pub.issue) citation += `, no. ${pub.issue}`;
    citation += `, ${pub.year}`;
    if (pub.pages) citation += `, pp. ${pub.pages}`;
    citation += ".";
  } else {
    citation += ` ${pub.year}.`;
  }
  if (pub.publisher) citation += ` ${pub.publisher}.`;
  return citation;
}

export function toChicago(pub: PublicationData): string {
  const authors = pub.authors.map(authorLastFirst).join(", ");
  let citation = `${authors}. "${pub.title}."`;
  if (pub.journal) {
    citation += ` *${pub.journal}*`;
    if (pub.volume) citation += ` ${pub.volume}`;
    if (pub.issue) citation += `, no. ${pub.issue}`;
    citation += ` (${pub.year})`;
    if (pub.pages) citation += `: ${pub.pages}`;
    citation += ".";
  } else {
    citation += ` ${pub.year}.`;
  }
  if (pub.publisher) citation += ` ${pub.publisher}.`;
  if (pub.doi) citation += ` https://doi.org/${pub.doi}.`;
  return citation;
}
