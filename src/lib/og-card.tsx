/**
 * Shared 1200x630 share card used by the dynamic OG routes.
 *
 * The layout is deliberately simple because satori (behind `next/og`) supports
 * only a flexbox subset: every container with more than one child sets an
 * explicit `display: flex`.
 */
import { ImageResponse } from "next/og";
import { loadOgFonts } from "./og-fonts";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Brand palette (Midnight Gold), kept in sync with globals.css.
const CHARCOAL = "#0c0c14";
const NAVY = "#0f1629";
const NAVY_LIGHT = "#1a2540";
const GOLD = "#c9a84c";
const GOLD_LIGHT = "#dfc272";
const TEXT_PRIMARY = "#eef2f7";
const TEXT_SECONDARY = "#8b9bb4";

/** Trim to a word boundary so long titles don't overflow the card. */
export function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export interface ShareCardOptions {
  /** Small uppercase chip, e.g. a category or "PUBLICATION". */
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  /** Byline row, e.g. "KONAN Amani Dieudonné · 2026". */
  meta: string;
  /** Gold emphasis line, e.g. a price or a journal name. */
  highlight?: string | null;
  /** Cover artwork as a data URI, or null for the lettermark fallback. */
  cover: string | null;
}

/**
 * Render a share card to a PNG response. Fonts are best-effort: if Google Fonts
 * is unreachable the card still renders with the built-in face.
 */
export async function renderShareCard(opts: ShareCardOptions): Promise<ImageResponse> {
  const fonts = await loadOgFonts();
  const display = fonts.some((f) => f.name === "Playfair Display")
    ? '"Playfair Display", serif'
    : "serif";
  const body = fonts.some((f) => f.name === "Inter") ? '"Inter", sans-serif' : "sans-serif";

  const title = clip(opts.title, 90);
  const subtitle = opts.subtitle ? clip(opts.subtitle, 110) : "";
  // Long titles need a smaller face to stay within three lines.
  const titleSize = title.length > 68 ? 46 : title.length > 44 ? 54 : 64;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: `linear-gradient(135deg, ${CHARCOAL} 0%, ${NAVY} 55%, ${NAVY_LIGHT} 100%)`,
          fontFamily: body,
          padding: "64px 72px",
          alignItems: "center",
        }}
      >
        {/* Gold accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: OG_WIDTH,
            height: 8,
            background: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD_LIGHT} 50%, ${GOLD} 100%)`,
          }}
        />

        {/* Cover */}
        <div
          style={{
            display: "flex",
            width: 348,
            height: 464,
            flexShrink: 0,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(201,168,76,0.35)",
            background: NAVY,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {opts.cover ? (
            // satori rasterises this to a PNG: next/image has no meaning here,
            // and alt text has nowhere to go in the resulting bitmap.
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img
              src={opts.cover}
              width={348}
              height={464}
              style={{ width: 348, height: 464, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                fontSize: 96,
                fontFamily: display,
                color: "rgba(201,168,76,0.5)",
              }}
            >
              ADK
            </div>
          )}
        </div>

        {/* Text column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: 56,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "6px 16px",
              borderRadius: 20,
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.35)",
              color: GOLD,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: 1.5,
            }}
          >
            {clip(opts.eyebrow, 28)}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: titleSize,
              fontFamily: display,
              fontWeight: 700,
              color: TEXT_PRIMARY,
              lineHeight: 1.15,
            }}
          >
            {title}
          </div>

          {subtitle ? (
            <div
              style={{
                display: "flex",
                marginTop: 16,
                fontSize: 25,
                color: TEXT_SECONDARY,
                lineHeight: 1.35,
              }}
            >
              {subtitle}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              marginTop: 32,
              fontSize: 22,
              color: TEXT_SECONDARY,
            }}
          >
            {clip(opts.meta, 70)}
          </div>

          {opts.highlight ? (
            <div
              style={{
                display: "flex",
                marginTop: 20,
                fontSize: 38,
                fontWeight: 600,
                color: GOLD,
              }}
            >
              {clip(opts.highlight, 40)}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 34,
            left: 72,
            display: "flex",
            alignItems: "center",
            fontSize: 19,
            color: "rgba(139,155,180,0.85)",
          }}
        >
          <span style={{ color: GOLD, fontWeight: 600 }}>KONAN Amani Dieudonné</span>
          <span style={{ margin: "0 10px" }}>·</span>
          <span>konanamanidieudonne.org</span>
        </div>
      </div>
    ),
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts,
      headers: {
        // Social crawlers re-fetch often; let the CDN hold the rendered card.
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
