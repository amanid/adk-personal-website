import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";
import { findPreset, isValidSymbol } from "@/lib/instruments";
import { fetchChartQuote, fetchChartSeries } from "@/lib/yahoo-chart";
import { priceStats } from "@/lib/market-stats";
import { getCached, setCache } from "@/lib/cache";
import type { InstrumentCategory } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 60;

const CATEGORIES: InstrumentCategory[] = [
  "FOREX", "ENERGY", "METALS", "SOFTS", "INDEX", "EQUITY", "OTHER",
];

/** Quotes and statistics are shared by every admin view; cache them briefly. */
const QUOTE_TTL = 5 * 60 * 1000;
const SERIES_TTL = 30 * 60 * 1000;

async function adminOnly() {
  const session = await auth();
  const ok = session && (session.user as { role?: string })?.role === "ADMIN";
  return ok ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * The watchlist with a live quote and descriptive statistics for each entry.
 *
 * Statistics are computed over a one-year daily series so the 52-week range and
 * the 50-day average are meaningful. Every symbol is fetched independently and
 * a failure is reported per row rather than failing the whole list — one
 * delisted ticker should not blank the page.
 */
export async function GET() {
  const denied = await adminOnly();
  if (denied) return denied;

  try {
    const items = await prisma.watchlistItem.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });

    const rows = await Promise.all(
      items.map(async (item) => {
        try {
          const quoteKey = `q:${item.symbol}`;
          let quote = getCached<Awaited<ReturnType<typeof fetchChartQuote>>>(quoteKey);
          if (quote === null || quote === undefined) {
            quote = await fetchChartQuote(item.symbol, 10000);
            if (quote) setCache(quoteKey, quote, QUOTE_TTL);
          }

          const seriesKey = `s:${item.symbol}:1y`;
          let series = getCached<{ date: string; close: number }[]>(seriesKey);
          if (!series) {
            series = (await fetchChartSeries(item.symbol, "1y", 10000)) || [];
            if (series.length) setCache(seriesKey, series, SERIES_TTL);
          }

          return {
            ...item,
            price: quote?.price ?? null,
            change: quote?.change ?? null,
            changePercent: quote?.changePercent ?? null,
            currency: quote?.currency ?? null,
            stats: series.length ? priceStats(series.map((p) => p.close)) : null,
            series: series.map((p) => p.close),
            error: quote?.price == null ? "No quote available" : null,
          };
        } catch {
          return { ...item, price: null, change: null, changePercent: null,
                   currency: null, stats: null, series: [], error: "Lookup failed" };
        }
      })
    );

    return NextResponse.json({ items: rows, fetchedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Watchlist GET error:", error);
    return NextResponse.json({ error: "Could not load the watchlist" }, { status: 500 });
  }
}

/** Add an instrument. The symbol must resolve to a real quote before it is saved. */
export async function POST(request: Request) {
  const denied = await adminOnly();
  if (denied) return denied;

  try {
    const body = await request.json();
    const symbol = String(body?.symbol || "").trim().toUpperCase();

    if (!symbol || !isValidSymbol(symbol)) {
      return NextResponse.json({ error: "Enter a valid ticker symbol." }, { status: 400 });
    }

    const existing = await prisma.watchlistItem.findUnique({ where: { symbol } });
    if (existing) {
      return NextResponse.json({ error: `${symbol} is already on the watchlist.` }, { status: 409 });
    }

    // Reject symbols with no quote at creation time rather than storing a row
    // that can only ever render as an error.
    const quote = await fetchChartQuote(symbol, 10000);
    if (!quote || quote.price === null) {
      return NextResponse.json(
        { error: `No market data found for "${symbol}". Check the ticker.` },
        { status: 404 }
      );
    }

    const preset = findPreset(symbol);
    const category: InstrumentCategory = CATEGORIES.includes(body?.category)
      ? body.category
      : (preset?.category ?? "OTHER");

    const item = await prisma.watchlistItem.create({
      data: {
        symbol,
        name: sanitizeInput(String(body?.name || preset?.name || symbol)).slice(0, 120),
        category,
        unit: preset?.unit ?? null,
        notes: body?.notes ? sanitizeInput(String(body.notes)).slice(0, 500) : null,
        sortOrder: Number.isFinite(body?.sortOrder) ? Number(body.sortOrder) : 0,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Watchlist POST error:", error);
    return NextResponse.json({ error: "Could not add the instrument" }, { status: 500 });
  }
}
