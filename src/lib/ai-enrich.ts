/**
 * AI drafting of a listing's prose — description, key insights, category,
 * tags, and the other language's version — held to the document itself.
 *
 * The model is asked to write only what the excerpt supports and to back
 * every key insight with a verbatim quotation. Then nothing it returns is
 * taken on trust: src/lib/grounding.ts removes any sentence with a figure,
 * organisation or acronym the document doesn't contain, any insight whose
 * quotation isn't really in the text, and any translation whose figures
 * differ from the original. Everything removed is reported back.
 *
 * Server-side only. Returns an error instead of throwing, so uploads never
 * depend on it.
 */
import {
  groundInsight,
  groundProse,
  indexSource,
  sameFigures,
  tagInSource,
  type Removal,
} from "./grounding";

export function isAiEnrichConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

// Tests point this at a local fake; production always uses OpenAI itself.
const OPENAI_URL =
  process.env.NODE_ENV !== "production" && process.env.OPENAI_API_BASE
    ? `${process.env.OPENAI_API_BASE.replace(/\/$/, "")}/v1/chat/completions`
    : "https://api.openai.com/v1/chat/completions";

export interface DraftInput {
  title?: string;
  subtitle?: string;
  titleFr?: string;
  subtitleFr?: string;
  author?: string;
  /** What the editor already has; its facts count as known. */
  existingDescription?: string;
  /** Text sampled from across the document. */
  sampleText: string;
  /** The document's language, if known ("English", "French", …). */
  language?: string;
  /** Categories already used in the catalogue, preferred over new ones. */
  categories?: string[];
}

export interface DraftReport {
  /** Sentences cut from the description, with why. */
  removedSentences: Removal[];
  /** Key insights dropped, with why. */
  droppedInsights: Removal[];
  droppedTags: string[];
  /** Translated fields dropped because their figures changed. */
  droppedTranslations: string[];
  /** How many figures in the kept text were checked against the document. */
  figuresChecked: number;
  /** "English" or "French": the language drafted from the text. */
  draftedIn: string;
}

export interface GroundedDraft {
  description?: string;
  descriptionFr?: string;
  keyInsights?: string[];
  keyInsightsFr?: string[];
  /** Translations of a title/subtitle the editor has only in the other language. */
  title?: string;
  subtitle?: string;
  titleFr?: string;
  subtitleFr?: string;
  category?: string;
  /** True when the category is not one the catalogue already uses. */
  categoryIsNew?: boolean;
  tags?: string[];
  report: DraftReport;
}

type JsonSchema = Record<string, unknown>;

async function callModel<T>(system: string, user: string, name: string, schema: JsonSchema): Promise<T> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_schema", json_schema: { name, strict: true, schema } },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(25000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string; refusal?: string } }[] };
  const msg = data.choices?.[0]?.message;
  if (!msg?.content) throw new Error(msg?.refusal ? `The model declined: ${msg.refusal}` : "Empty response from the model");
  return JSON.parse(msg.content) as T;
}

const DRAFT_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["description", "key_insights", "category", "tags"],
  properties: {
    description: { type: "string" },
    key_insights: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "evidence"],
        properties: { text: { type: "string" }, evidence: { type: "string" } },
      },
    },
    category: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
  },
};

const TRANSLATION_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["description", "key_insights", "title", "subtitle"],
  properties: {
    description: { type: "string" },
    key_insights: { type: "array", items: { type: "string" } },
    title: { type: "string" },
    subtitle: { type: "string" },
  },
};

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

export async function draftListing(input: DraftInput): Promise<GroundedDraft | { error: string }> {
  if (!isAiEnrichConfigured()) return { error: "AI drafting is not configured (set OPENAI_API_KEY)." };
  const sample = input.sampleText.trim();
  if (sample.length < 200) return { error: "The file has too little readable text to draft from (a scanned PDF?)." };

  const lang = input.language === "French" ? "French" : "English";
  const other = lang === "French" ? "English" : "French";
  const ownTitle = lang === "French" ? input.titleFr || input.title : input.title || input.titleFr;
  const ownSubtitle = lang === "French" ? input.subtitleFr || input.subtitle : input.subtitle || input.subtitleFr;
  const src = indexSource(sample, input.title, input.subtitle, input.titleFr, input.subtitleFr, input.author, input.existingDescription);
  const categories = [...new Set((input.categories ?? []).map((c) => c.trim()).filter(Boolean))].slice(0, 40);

  const system =
    "You write catalogue copy for a research publication, strictly from the excerpt provided. " +
    "Every statement must be directly supported by the excerpt. Use only figures that appear in the excerpt, written in digits exactly as they appear there. " +
    "Name only organisations, places and people that the excerpt names. No praise, no sales language, no claims about the document's reception, reach or audience beyond what it says itself. " +
    "If the excerpt does not support something, leave it out: shorter is better than unsupported. " +
    `Write in ${lang}.`;
  const user = [
    ownTitle ? `Title: ${ownTitle}` : "",
    ownSubtitle ? `Subtitle: ${ownSubtitle}` : "",
    input.author ? `Author: ${input.author}` : "",
    "",
    "Excerpt (sampled from across the document; may be cut mid-sentence):",
    "<<<",
    clip(sample, 18000),
    ">>>",
    "",
    "Fill the fields:",
    "- description: two paragraphs separated by a blank line, 4 to 7 sentences in all: what the document examines, the data and approach it uses, and what a reader will find in it. Do not describe the author.",
    "- key_insights: 3 to 6 specific findings or contents stated in the excerpt. For each, `evidence` is an exact quotation of 8 to 40 words copied character for character from the excerpt that supports it.",
    categories.length
      ? `- category: one of these existing categories if any fits: ${categories.map((c) => JSON.stringify(c)).join(", ")}. Otherwise a short new subject label.`
      : "- category: a short subject label (e.g. \"Public Finance\", \"Trade\").",
    "- tags: 3 to 6 short lowercase topic keywords, each made of words that occur in the excerpt.",
  ]
    .filter((l) => l !== "")
    .join("\n");

  let raw: { description: string; key_insights: { text: string; evidence: string }[]; category: string; tags: string[] };
  try {
    raw = await callModel(system, user, "listing_draft", DRAFT_SCHEMA);
  } catch (err) {
    console.error("AI draft failed:", (err as Error).message);
    return { error: "The AI draft could not be produced. Try again, or write the description yourself." };
  }

  const report: DraftReport = { removedSentences: [], droppedInsights: [], droppedTags: [], droppedTranslations: [], figuresChecked: 0, draftedIn: lang };
  const out: GroundedDraft = { report };

  const prose = groundProse(raw.description ?? "", src);
  let description: string | undefined;
  if (prose) {
    description = prose.text;
    report.removedSentences = prose.removed;
  } else if (raw.description?.trim()) {
    report.removedSentences = [{ text: raw.description.trim(), reason: "most of its sentences could not be traced to the document, so the whole draft was discarded" }];
  }

  const insights: string[] = [];
  for (const item of raw.key_insights ?? []) {
    const text = item.text?.replace(/^[-*•\s]+/, "").trim();
    if (!text) continue;
    const why = groundInsight({ text, evidence: item.evidence ?? "" }, src);
    if (why) report.droppedInsights.push({ text, reason: why });
    else if (insights.length < 6) insights.push(text);
  }

  const canonical = categories.find((c) => c.toLowerCase() === raw.category?.trim().toLowerCase());
  if (canonical) out.category = canonical;
  else if (raw.category?.trim() && raw.category.trim().length <= 40) {
    out.category = raw.category.trim();
    out.categoryIsNew = true;
  }

  const tags: string[] = [];
  for (const t of raw.tags ?? []) {
    const tag = t.replace(/^[-*•#\s]+/, "").trim().toLowerCase();
    if (!tag || tag.length > 40 || tags.includes(tag)) continue;
    if (tagInSource(tag, src)) tags.push(tag);
    else report.droppedTags.push(tag);
  }
  if (tags.length) out.tags = tags.slice(0, 6);

  report.figuresChecked = [description ?? "", ...insights].join(" ").match(/\d+(?:[.,]\d+)?/g)?.length ?? 0;
  const isFr = lang === "French";
  if (description) out[isFr ? "descriptionFr" : "description"] = description;
  if (insights.length) out[isFr ? "keyInsightsFr" : "keyInsights"] = insights;

  // The other language: a faithful translation of what survived the checks.
  const needTitle = ownTitle && !(isFr ? input.title : input.titleFr) ? ownTitle : "";
  const needSubtitle = ownSubtitle && !(isFr ? input.subtitle : input.subtitleFr) ? ownSubtitle : "";
  if (description || insights.length || needTitle || needSubtitle) {
    try {
      const tr = await callModel<{ description: string; key_insights: string[]; title: string; subtitle: string }>(
        `Translate catalogue copy from ${lang} into ${other}, faithfully. Keep every figure exactly; adapt only the decimal and thousands separators to ${other} conventions. ` +
          "Keep names of people and places; use an institution's established name in the target language only where one exists. Add nothing and leave nothing out. " +
          "Return an empty string for any field you were given empty, and exactly one translated key insight per original, in the same order.",
        JSON.stringify({ description: description ?? "", key_insights: insights, title: needTitle, subtitle: needSubtitle }),
        "listing_translation",
        TRANSLATION_SCHEMA
      );
      const put = (field: "description" | "title" | "subtitle", original: string, translated: string) => {
        if (!original || !translated?.trim()) return;
        if (!sameFigures(original, translated)) {
          report.droppedTranslations.push(field);
          return;
        }
        const key = (isFr ? field : `${field}Fr`) as "description" | "descriptionFr" | "title" | "titleFr" | "subtitle" | "subtitleFr";
        out[key] = translated.trim();
      };
      put("description", description ?? "", tr.description);
      put("title", needTitle, tr.title);
      put("subtitle", needSubtitle, tr.subtitle);
      if (insights.length) {
        const ok = tr.key_insights?.length === insights.length && insights.every((o, i) => sameFigures(o, tr.key_insights[i] ?? ""));
        if (ok) out[isFr ? "keyInsights" : "keyInsightsFr"] = tr.key_insights.map((s) => s.trim());
        else report.droppedTranslations.push("key insights");
      }
    } catch (err) {
      console.error("AI translation failed:", (err as Error).message);
      report.droppedTranslations.push("all (the translation request failed)");
    }
  }

  if (!description && !insights.length) {
    return { error: "Nothing the AI drafted could be traced to the document, so nothing was filled. Write the description yourself." };
  }
  return out;
}
