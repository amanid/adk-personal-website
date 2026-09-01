/**
 * Font loading for dynamic OG images (`next/og` / satori).
 *
 * satori cannot parse woff2, so we ask Google Fonts with a legacy User-Agent to
 * get a plain TTF back. Fetching is best-effort and memoised for the lifetime of
 * the server process: if it fails we return an empty list and the ImageResponse
 * falls back to its built-in sans font rather than failing to render at all.
 */

export interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700 | 800;
  style: "normal";
}

// A UA old enough that Google Fonts serves TTF instead of woff2.
const TTF_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko) Version/5.1 Safari/534.30";

// A share card is fetched by a crawler with its own (short) patience. Never let
// a slow font CDN hold the response open — fall back to the built-in face.
const FONT_FETCH_TIMEOUT_MS = 4000;

async function fetchGoogleFont(
  family: string,
  weight: number
): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family
    )}:wght@${weight}`;
    const css = await fetch(cssUrl, {
      headers: { "User-Agent": TTF_UA },
      signal: AbortSignal.timeout(FONT_FETCH_TIMEOUT_MS),
    }).then((r) => (r.ok ? r.text() : null));
    if (!css) return null;

    const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (!url) return null;

    const res = await fetch(url, { signal: AbortSignal.timeout(FONT_FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

let cached: Promise<OgFont[]> | null = null;

/**
 * Display + body faces used by the share cards. Resolves to [] when the fonts
 * cannot be fetched, which is a valid `fonts` value for ImageResponse.
 */
export function loadOgFonts(): Promise<OgFont[]> {
  if (!cached) {
    cached = (async () => {
      const [display, bodyRegular, bodyBold] = await Promise.all([
        fetchGoogleFont("Playfair Display", 700),
        fetchGoogleFont("Inter", 400),
        fetchGoogleFont("Inter", 600),
      ]);
      const fonts: OgFont[] = [];
      if (display) fonts.push({ name: "Playfair Display", data: display, weight: 700, style: "normal" });
      if (bodyRegular) fonts.push({ name: "Inter", data: bodyRegular, weight: 400, style: "normal" });
      if (bodyBold) fonts.push({ name: "Inter", data: bodyBold, weight: 600, style: "normal" });
      return fonts;
    })();
    // Never let a rejected promise poison the cache.
    cached = cached.catch(() => []);
  }
  return cached;
}
