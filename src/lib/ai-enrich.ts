/**
 * AI enrichment for bookstore listings — drafts a marketing description and
 * key insights from a book's extracted text using the OpenAI API.
 *
 * Server-side only. Gracefully returns null when OPENAI_API_KEY is not set or
 * the call fails, so uploads never depend on it.
 */

export interface BookEnrichment {
  description: string;
  keyInsights: string[];
  category?: string;
  tags?: string[];
}

interface EnrichInput {
  title?: string;
  author?: string;
  existingDescription?: string;
  sampleText: string;
}

/** True when the AI enrichment feature is configured. */
export function isAiEnrichConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export async function enrichBookMetadata(
  input: EnrichInput
): Promise<BookEnrichment | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const sample = input.sampleText.trim().slice(0, 18000);
  if (!sample && !input.existingDescription) return null;

  const system =
    "You are an editor writing the catalog listing for a serious non-fiction " +
    "book. Using ONLY the provided excerpt and metadata, describe what the book " +
    "is actually about — its subject, the argument or story it develops, and what " +
    "a reader will take away. Be specific and grounded in the text; never invent " +
    "facts, endorsements, sales claims, or details not supported by the excerpt. " +
    "If the excerpt is too thin to tell, write a careful, non-committal description " +
    "rather than fabricating. Respond ONLY with JSON.";

  const user = [
    input.title ? `Title: ${input.title}` : "",
    input.author ? `Author: ${input.author}` : "",
    input.existingDescription ? `Publisher description: ${input.existingDescription}` : "",
    "",
    "Book excerpt (sampled from across the book, may be truncated):",
    sample || "(no excerpt available)",
    "",
    "Return JSON with exactly this shape:",
    `{"description": "<content description>", "keyInsights": ["<insight>", "..."], "category": "<one short category>", "tags": ["<tag>", "..."]}`,
    "",
    "Rules:",
    "- description: 2 short paragraphs (about 4-7 sentences total) describing the book's actual content and themes and who it is for. Plain text, no markdown, no line breaks — use a single space between paragraphs.",
    "- keyInsights: 4 to 7 concise, specific takeaways, each a single sentence, no leading bullet characters.",
    "- category: one broad subject label (e.g. \"Economics\", \"Leadership\", \"Memoir\", \"Public Policy\"). Omit if unclear.",
    "- tags: 3 to 6 short lowercase topic keywords. Omit if unclear.",
  ]
    .filter(Boolean)
    .join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`OpenAI enrichment failed (${res.status}): ${text.slice(0, 500)}`);
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as {
      description?: unknown;
      keyInsights?: unknown;
      category?: unknown;
      tags?: unknown;
    };

    const description =
      typeof parsed.description === "string" ? parsed.description.trim() : "";
    const keyInsights = Array.isArray(parsed.keyInsights)
      ? parsed.keyInsights
          .filter((i): i is string => typeof i === "string")
          .map((i) => i.replace(/^[-*•\s]+/, "").trim())
          .filter(Boolean)
          .slice(0, 8)
      : [];
    const category =
      typeof parsed.category === "string" && parsed.category.trim()
        ? parsed.category.trim().slice(0, 60)
        : undefined;
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.replace(/^[-*•#\s]+/, "").trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 6)
      : undefined;

    if (!description && keyInsights.length === 0) return null;
    return { description, keyInsights, category, tags };
  } catch (err) {
    console.error("OpenAI enrichment error:", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
