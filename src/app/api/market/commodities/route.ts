import { NextResponse } from "next/server";
import { getCached, setCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";

const COMMODITIES = [
  { symbol: "CC=F", name: "Cocoa", unit: "$/ton" },
  { symbol: "KC=F", name: "Coffee", unit: "$/lb" },
  { symbol: "GC=F", name: "Gold", unit: "$/oz" },
  { symbol: "CL=F", name: "Crude Oil", unit: "$/bbl" },
  { symbol: "SB=F", name: "Sugar", unit: "$/lb" },
  { symbol: "CT=F", name: "Cotton", unit: "$/lb" },
];

const CACHE_KEY = "commodities_public";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface CommodityResult {
  symbol: string;
  name: string;
  unit: string;
  price: number;
  change: number;
  changePercent: number;
}

export async function GET(request: Request) {
  try {
    const rateLimited = rateLimit(request, { limit: 30, windowSeconds: 60 });
    if (rateLimited) return rateLimited;

    const cached = getCached<{ commodities: CommodityResult[]; fetchedAt: string }>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    const YahooFinance = (await import("yahoo-finance2")).default;
    const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

    // Fetch all commodities in parallel with per-item timeout
    const results = await Promise.allSettled(
      COMMODITIES.map(async (commodity) => {
        const quote = (await Promise.race([
          yahooFinance.quote(commodity.symbol),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 8000)
          ),
        ])) as {
          regularMarketPrice?: number;
          regularMarketChange?: number;
          regularMarketChangePercent?: number;
        };
        return {
          symbol: commodity.symbol,
          name: commodity.name,
          unit: commodity.unit,
          price: quote.regularMarketPrice ?? 0,
          change: quote.regularMarketChange ?? 0,
          changePercent: quote.regularMarketChangePercent ?? 0,
        };
      })
    );

    const commodities: CommodityResult[] = results.map((result, i) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      console.error(`Failed to fetch ${COMMODITIES[i].symbol}:`, result.reason);
      return {
        ...COMMODITIES[i],
        price: 0,
        change: 0,
        changePercent: 0,
      };
    });

    const response = { commodities, fetchedAt: new Date().toISOString() };
    setCache(CACHE_KEY, response, CACHE_TTL);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Commodities fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch commodities" },
      { status: 500 }
    );
  }
}
