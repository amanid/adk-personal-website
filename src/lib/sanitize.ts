import sanitizeHtml from "sanitize-html";

/**
 * Sanitize user input to prevent XSS in stored/reflected content.
 * Strips HTML tags and trims whitespace.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * Sanitize an object's string values recursively.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    const value = result[key];
    if (typeof value === "string") {
      (result as Record<string, unknown>)[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = value.map((v) =>
        typeof v === "string" ? sanitizeInput(v) : v
      );
    }
  }
  return result;
}

/**
 * Allowlist for rich-text HTML (blog posts), matching what the TipTap editor
 * produces: StarterKit, links, images, tables, underline and text alignment.
 * Anything else — script, iframe, event handlers, javascript: URLs, arbitrary
 * styles — is dropped. Applied on write and again on render, so content stored
 * before this existed is cleaned too.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "del", "mark", "sub", "sup", "span",
    "a", "ul", "ol", "li", "blockquote", "code", "pre",
    "img", "figure", "figcaption",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "colgroup", "col",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel", "class"],
    img: ["src", "alt", "title", "width", "height", "class"],
    th: ["colspan", "rowspan", "colwidth", "style"],
    td: ["colspan", "rowspan", "colwidth", "style"],
    col: ["style", "span"],
    table: ["class", "style"],
    p: ["style"],
    h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"], h5: ["style"], h6: ["style"],
    code: ["class"],
    pre: ["class"],
  },
  allowedClasses: {
    a: ["text-gold", "underline"],
    img: ["rounded-lg", "max-w-full"],
    table: ["blog-table"],
    code: [/^language-[\w-]+$/],
    pre: [/^language-[\w-]+$/],
  },
  // Only alignment and column widths survive; no url(), no positioning.
  allowedStyles: {
    "*": {
      "text-align": [/^(left|right|center|justify)$/],
      width: [/^\d+(\.\d+)?(px|%)$/],
      "min-width": [/^\d+(\.\d+)?(px|%)$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowProtocolRelative: false,
  transformTags: {
    // A link that opens a new tab must not hand the opener to the target.
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.target === "_blank" ? { ...attribs, rel: "noopener noreferrer nofollow" } : attribs,
    }),
  },
};

export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, OPTIONS);
}
