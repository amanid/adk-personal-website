/**
 * How the book editor applies what was read from an uploaded file, and what
 * it tells the admin about it. Client-safe and pure, so the rules are tested
 * on their own.
 *
 * The rule throughout: a field the admin has filled is never overwritten by
 * a value from the file — the file's value is shown beside it instead. The
 * exceptions are facts that describe the file itself (pages, ISBN, language,
 * year, cover) when the file is being REPLACED, since the old values would
 * then describe a file that is gone.
 */

export interface ListingForm {
  title: string;
  titleFr: string;
  subtitle: string;
  subtitleFr: string;
  author: string;
  publicationYear: number;
  isbn: string;
  language: string;
  pageCount: number;
  description: string;
  descriptionFr: string;
  keyInsights: string;
  keyInsightsFr: string;
  category: string;
  tags: string;
  coverImageId: string;
}

interface Fact<T> {
  value: T;
  source: string;
  evidence?: string;
}

export interface FileFacts {
  title?: Fact<string>;
  subtitle?: Fact<string>;
  author?: Fact<string>;
  publicationYear?: Fact<number>;
  pageCount?: Fact<number>;
  isbn?: Fact<string>;
  language?: Fact<string>;
  description?: Fact<string>;
  tags?: Fact<string[]>;
  notes: string[];
}

export interface FoundCover {
  coverImageId: string;
  source: string;
}

export interface Removal {
  text: string;
  reason: string;
}

export interface Draft {
  description?: string;
  descriptionFr?: string;
  keyInsights?: string[];
  keyInsightsFr?: string[];
  title?: string;
  subtitle?: string;
  titleFr?: string;
  subtitleFr?: string;
  category?: string;
  categoryIsNew?: boolean;
  tags?: string[];
  report: {
    removedSentences: Removal[];
    droppedInsights: Removal[];
    droppedTags: string[];
    droppedTranslations: string[];
    figuresChecked: number;
    draftedIn: string;
  };
}

export type RowStatus = "filled" | "confirmed" | "kept" | "kept-file" | "drafted" | "translated";

export interface ReportRow {
  field: string;
  value: string;
  source: string;
  evidence?: string;
  status: RowStatus;
}

const same = (a: string, b: string) =>
  a.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/\W+/g, " ").trim().toLowerCase() ===
  b.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/\W+/g, " ").trim().toLowerCase();

/**
 * Apply facts read from the file. `protect` lists fields the admin has set
 * themselves (typed in, or saved on an existing book), on top of any field
 * that simply isn't empty.
 */
export function applyFacts(
  form: ListingForm,
  facts: FileFacts,
  cover: FoundCover | null,
  { isReplacement, protect }: { isReplacement: boolean; protect: Set<keyof ListingForm> }
): { form: ListingForm; rows: ReportRow[]; missing: string[]; filled: (keyof ListingForm)[] } {
  const next = { ...form };
  const rows: ReportRow[] = [];
  const missing: string[] = [];
  const filled: (keyof ListingForm)[] = [];

  const text = (key: "title" | "subtitle" | "author" | "isbn" | "language" | "description", label: string, fact: Fact<string> | undefined, followsFile: boolean) => {
    if (!fact) {
      if (key !== "description" && key !== "author") missing.push(label);
      return;
    }
    const current = form[key].trim();
    const free = !current || (followsFile && isReplacement) || (key === "language" && !protect.has("language") && current === "English");
    if (current && same(current, fact.value)) rows.push({ field: label, value: fact.value, source: fact.source, evidence: fact.evidence, status: "confirmed" });
    else if (free) {
      next[key] = fact.value;
      filled.push(key);
      rows.push({ field: label, value: fact.value, source: fact.source, evidence: fact.evidence, status: "filled" });
    } else rows.push({ field: label, value: fact.value, source: fact.source, evidence: fact.evidence, status: "kept" });
  };

  text("title", "Title", facts.title, false);
  text("subtitle", "Subtitle", facts.subtitle, false);
  text("author", "Author", facts.author, false);
  text("isbn", "ISBN", facts.isbn, true);
  text("language", "Language", facts.language, true);
  text("description", "Description", facts.description, false);

  const year = facts.publicationYear;
  if (!year) missing.push("Publication year");
  else if (form.publicationYear === year.value) rows.push({ field: "Year", value: String(year.value), source: year.source, evidence: year.evidence, status: "confirmed" });
  else if (isReplacement || !protect.has("publicationYear")) {
    next.publicationYear = year.value;
    rows.push({ field: "Year", value: String(year.value), source: year.source, evidence: year.evidence, status: "filled" });
  } else rows.push({ field: "Year", value: String(year.value), source: year.source, evidence: year.evidence, status: "kept" });

  const pages = facts.pageCount;
  if (pages) {
    if (form.pageCount === pages.value) rows.push({ field: "Pages", value: String(pages.value), source: pages.source, status: "confirmed" });
    else if (!form.pageCount || isReplacement) {
      next.pageCount = pages.value;
      rows.push({ field: "Pages", value: String(pages.value), source: pages.source, status: "filled" });
    } else rows.push({ field: "Pages", value: String(pages.value), source: pages.source, status: "kept" });
  }

  if (facts.tags?.value.length) {
    const value = facts.tags.value.join(", ");
    if (!form.tags.trim()) {
      next.tags = value;
      filled.push("tags");
      rows.push({ field: "Tags", value, source: facts.tags.source, status: "filled" });
    } else rows.push({ field: "Tags", value, source: facts.tags.source, status: "kept" });
  }

  if (cover) {
    next.coverImageId = cover.coverImageId;
    rows.push({ field: "Cover", value: "Image taken from the file", source: cover.source, status: "filled" });
  }
  return { form: next, rows, missing, filled };
}

/**
 * Apply an AI draft. `replace` (replacing the file, or the admin confirming
 * "Draft with AI") lets the prose fields be rewritten; otherwise only empty
 * ones are filled. Titles are only ever filled when empty.
 */
export function applyDraft(
  form: ListingForm,
  draft: Draft,
  { replace, fromFile = new Set() }: { replace: boolean; fromFile?: Set<keyof ListingForm> }
): { form: ListingForm; rows: ReportRow[] } {
  // A value the file itself supplied a moment ago outranks a draft, but it is
  // the file's, not the admin's — say so.
  const keptStatus = (key: keyof ListingForm): RowStatus => (fromFile.has(key) ? "kept-file" : "kept");
  const next = { ...form };
  const rows: ReportRow[] = [];
  const drafted = "AI draft from the document's text; every figure and name checked against it";
  const translated = "AI translation; figures checked against the original";
  const fromFr = draft.report.draftedIn === "French";

  const put = (key: keyof ListingForm, label: string, value: string | undefined, isTranslation: boolean, replaceable: boolean) => {
    if (!value) return;
    const current = String(form[key]).trim();
    if (current && !(replace && replaceable)) {
      rows.push({ field: label, value, source: isTranslation ? translated : drafted, status: keptStatus(key) });
      return;
    }
    (next as Record<string, unknown>)[key] = value;
    rows.push({ field: label, value, source: isTranslation ? translated : drafted, status: isTranslation ? "translated" : "drafted" });
  };

  put("description", "Description", draft.description, fromFr, true);
  put("descriptionFr", "Description (FR)", draft.descriptionFr, !fromFr, true);
  put("keyInsights", "Key insights", draft.keyInsights?.join("\n"), fromFr, true);
  put("keyInsightsFr", "Key insights (FR)", draft.keyInsightsFr?.join("\n"), !fromFr, true);
  put("title", "Title", draft.title, true, false);
  put("subtitle", "Subtitle", draft.subtitle, true, false);
  put("titleFr", "Title (FR)", draft.titleFr, true, false);
  put("subtitleFr", "Subtitle (FR)", draft.subtitleFr, true, false);
  if (draft.category) {
    const source = draft.categoryIsNew ? "AI suggestion — a new category for the catalogue" : "AI choice among the catalogue's existing categories";
    if (!form.category.trim() || replace) {
      next.category = draft.category;
      rows.push({ field: "Category", value: draft.category, source, status: "drafted" });
    } else rows.push({ field: "Category", value: draft.category, source, status: keptStatus("category") });
  }
  if (draft.tags?.length) {
    const value = draft.tags.join(", ");
    const source = "AI suggestion; each tag's words occur in the document";
    if (!form.tags.trim() || replace) {
      next.tags = value;
      rows.push({ field: "Tags", value, source, status: "drafted" });
    } else rows.push({ field: "Tags", value, source, status: keptStatus("tags") });
  }
  return { form: next, rows };
}
