import type { PublicationType } from "@/types";

interface PublicationTypeInfo {
  value: PublicationType;
  labelEn: string;
  labelFr: string;
  shortEn: string;
  shortFr: string;
}

export const PUBLICATION_TYPES: PublicationTypeInfo[] = [
  { value: "JOURNAL_ARTICLE", labelEn: "Journal Article", labelFr: "Article de revue", shortEn: "Journal", shortFr: "Revue" },
  { value: "CONFERENCE_PAPER", labelEn: "Conference Paper", labelFr: "Article de conférence", shortEn: "Conference", shortFr: "Conférence" },
  { value: "WORKING_PAPER", labelEn: "Working Paper", labelFr: "Document de travail", shortEn: "Working", shortFr: "Travail" },
  { value: "THESIS_DISSERTATION", labelEn: "Thesis / Dissertation", labelFr: "Thèse / Mémoire", shortEn: "Thesis", shortFr: "Thèse" },
  { value: "BOOK_CHAPTER", labelEn: "Book Chapter", labelFr: "Chapitre de livre", shortEn: "Book", shortFr: "Livre" },
  { value: "TECHNICAL_REPORT", labelEn: "Technical Report", labelFr: "Rapport technique", shortEn: "Report", shortFr: "Rapport" },
  { value: "PREPRINT", labelEn: "Preprint", labelFr: "Prépublication", shortEn: "Preprint", shortFr: "Prépub." },
  { value: "ANALYTICAL_REPORT", labelEn: "Analytical Report", labelFr: "Rapport analytique", shortEn: "Analysis", shortFr: "Analyse" },
];

export function getPublicationTypeLabel(type: PublicationType, locale: string = "en"): string {
  const info = PUBLICATION_TYPES.find((t) => t.value === type);
  if (!info) return type;
  return locale === "fr" ? info.labelFr : info.labelEn;
}

export function getPublicationTypeShort(type: PublicationType, locale: string = "en"): string {
  const info = PUBLICATION_TYPES.find((t) => t.value === type);
  if (!info) return type;
  return locale === "fr" ? info.shortFr : info.shortEn;
}
