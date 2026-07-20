import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCached, setCache } from "@/lib/cache";
import { fetchChartSeries } from "@/lib/yahoo-chart";

/** Smallest Yahoo range string that covers the requested number of days. */
function rangeForDays(days: number): string {
  if (days <= 5) return "5d";
  if (days <= 30) return "1mo";
  if (days <= 90) return "3mo";
  if (days <= 180) return "6mo";
  if (days <= 365) return "1y";
  return "2y";
}

const COMMODITIES = [
  { symbol: "CC=F", name: "Cocoa" },
  { symbol: "KC=F", name: "Coffee" },
  { symbol: "GC=F", name: "Gold" },
  { symbol: "CL=F", name: "Crude Oil" },
  { symbol: "SB=F", name: "Sugar" },
  { symbol: "CT=F", name: "Cotton" },
];

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface HistoryPoint {
  date: string;
  close: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = parseInt(searchParams.get("days") || "30", 10);
    const days = Math.min(Math.max(daysParam, 1), 365);

    const cacheKey = `commodities_history_${days}`;
    const cached = getCached<{ history: Record<string, HistoryPoint[]>; fetchedAt: string }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const range = rangeForDays(days);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const results = await Promise.allSettled(
      COMMODITIES.map(async (commodity) => {
        const series = await fetchChartSeries(commodity.symbol, range, 10000);
        if (!series || series.length === 0) {
          throw new Error(`No history for ${commodity.symbol}`);
        }
        // Trim to the requested window (Yahoo ranges are coarser than N days).
        const points: HistoryPoint[] = series.filter((p) => p.date >= cutoff);
        return { symbol: commodity.symbol, points };
      })
    );

    const history: Record<string, HistoryPoint[]> = {};
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        history[COMMODITIES[i].symbol] = result.value.points;
      } else {
        console.error(`Failed to fetch history for ${COMMODITIES[i].symbol}:`, result.reason);
        history[COMMODITIES[i].symbol] = [];
      }
    });

    const response = { history, fetchedAt: new Date().toISOString() };
    setCache(cacheKey, response, CACHE_TTL);

    return NextResponse.json(response);
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
