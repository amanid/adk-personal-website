import { NextResponse } from "next/server";
import { getCached, setCache } from "@/lib/cache";

const COMMODITIES = [
  { symbol: "CC=F", name: "Cocoa" },
  { symbol: "KC=F", name: "Coffee" },
  { symbol: "GC=F", name: "Gold" },
  { symbol: "CL=F", name: "Crude Oil" },
  { symbol: "SB=F", name: "Sugar" },
  { symbol: "CT=F", name: "Cotton" },
];

const CACHE_KEY = "commodities_history_public";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface HistoryPoint {
  date: string;
  close: number;
}

export async function GET() {
  try {
    const cached = getCached<{ history: Record<string, HistoryPoint[]>; fetchedAt: string }>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    const YahooFinance = (await import("yahoo-finance2")).default;
    const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

    const period1 = new Date();
    period1.setDate(period1.getDate() - 7);

    const results = await Promise.allSettled(
      COMMODITIES.map(async (commodity) => {
        const chart = (await Promise.race([
          yahooFinance.chart(commodity.symbol, {
            period1,
            interval: "1d",
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 8000)
          ),
        ])) as { quotes: Array<{ date: Date; close: number | null }> };

        const points: HistoryPoint[] = (chart.quotes || [])
          .filter((q) => q.close !== null && q.close !== undefined)
          .map((q) => ({
            date: new Date(q.date).toISOString().split("T")[0],
            close: q.close as number,
          }));

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
    setCache(CACHE_KEY, response, CACHE_TTL);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Public history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
