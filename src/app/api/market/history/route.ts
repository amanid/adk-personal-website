import { NextResponse } from "next/server";
import { getCached, setCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";
import { fetchChartSeries } from "@/lib/yahoo-chart";

const COMMODITIES = [
  { symbol: "CC=F", name: "Cocoa" },
  { symbol: "KC=F", name: "Coffee" },
  { symbol: "GC=F", name: "Gold" },
  { symbol: "CL=F", name: "Crude Oil" },
  { symbol: "SB=F", name: "Sugar" },
  { symbol: "CT=F", name: "Cotton" },
];

const CACHE_KEY = "commodities_history_public";
const STALE_KEY = "commodities_history_public_stale";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const STALE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days — last-known-good fallback

interface HistoryPoint {
  date: string;
  close: number;
}

export async function GET(request: Request) {
  try {
    const rateLimited = rateLimit(request, { limit: 30, windowSeconds: 60 });
    if (rateLimited) return rateLimited;

    const cached = getCached<{ history: Record<string, HistoryPoint[]>; fetchedAt: string }>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch each series via Yahoo's crumb-free chart endpoint (no 429 handshake).
    const results = await Promise.allSettled(
      COMMODITIES.map(async (commodity) => {
        const points = await fetchChartSeries(commodity.symbol, "1mo", 10000);
        if (!points || points.length === 0) {
          throw new Error(`No history for ${commodity.symbol}`);
        }
        return { symbol: commodity.symbol, points: points as HistoryPoint[] };
      })
    );

    const history: Record<string, HistoryPoint[]> = {};
    const failedSymbols: string[] = [];
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        history[COMMODITIES[i].symbol] = result.value.points;
      } else {
        failedSymbols.push(COMMODITIES[i].symbol);
        history[COMMODITIES[i].symbol] = [];
      }
    });

    const response = { history, fetchedAt: new Date().toISOString() };
    const successCount = Object.values(history).filter((pts) => pts.length >= 2).length;

    if (failedSymbols.length > 0) {
      console.warn(
        `Commodities history: ${failedSymbols.length}/${COMMODITIES.length} failed (${failedSymbols.join(
          ", "
        )})`
      );
    }

    if (successCount > 0) {
      // Use a shorter cache if some commodities have no data, so we retry sooner.
      const ttl = successCount === COMMODITIES.length ? CACHE_TTL : 2 * 60 * 1000;
      setCache(CACHE_KEY, response, ttl);
      setCache(STALE_KEY, response, STALE_TTL);
      return NextResponse.json(response);
    }

    // Everything failed — serve the last-known-good snapshot if available.
    const stale = getCached<{ history: Record<string, HistoryPoint[]>; fetchedAt: string }>(STALE_KEY);
    if (stale) {
      return NextResponse.json({ ...stale, stale: true });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Public history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
