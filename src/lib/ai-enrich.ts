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
  const sample = input.sampleText.trim().slice(0, 12000);
  if (!sample && !input.existingDescription) return null;

  const system =
    "You are a professional non-fiction book marketer. From the provided book " +
    "excerpt and metadata, write compelling, accurate copy for an online store. " +
    "Do not invent facts, prices, or claims not supported by the text. Respond " +
    "ONLY with JSON.";

  const user = [
    input.title ? `Title: ${input.title}` : "",
    input.author ? `Author: ${input.author}` : "",
    input.existingDescription ? `Existing description: ${input.existingDescription}` : "",
    "",
    "Book excerpt (may be truncated):",
    sample || "(no excerpt available)",
    "",
    "Return JSON with exactly this shape:",
    `{"description": "<2-4 sentence marketing description, plain text>", "keyInsights": ["<insight 1>", "<insight 2>", "..."]}`,
    "Provide 3 to 6 concise key insights (each a single sentence, no leading bullet characters).",
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

    if (!description && keyInsights.length === 0) return null;
    return { description, keyInsights };
  } catch (err) {
    console.error("OpenAI enrichment error:", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
