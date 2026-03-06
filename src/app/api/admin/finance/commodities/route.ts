import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCached, setCache } from "@/lib/cache";

const COMMODITIES = [
  { symbol: "CC=F", name: "Cocoa", unit: "$/ton" },
  { symbol: "KC=F", name: "Coffee", unit: "$/lb" },
  { symbol: "GC=F", name: "Gold", unit: "$/oz" },
  { symbol: "CL=F", name: "Crude Oil", unit: "$/bbl" },
  { symbol: "SB=F", name: "Sugar", unit: "$/lb" },
  { symbol: "CT=F", name: "Cotton", unit: "$/lb" },
];

const CACHE_KEY = "commodities";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface CommodityResult {
  symbol: string;
  name: string;
  unit: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
            setTimeout(() => reject(new Error("Timeout")), 12000)
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
          price: quote.regularMarketPrice ?? null,
          change: quote.regularMarketChange ?? null,
          changePercent: quote.regularMarketChangePercent ?? null,
        };
      })
    );

    const commodities: CommodityResult[] = results.map((result, i) => {
      if (result.status === "fulfilled" && result.value.price !== null) {
        return result.value;
      }
      if (result.status === "rejected") {
        console.error(`Failed to fetch ${COMMODITIES[i].symbol}:`, result.reason);
      }
      return {
        ...COMMODITIES[i],
        price: null,
        change: null,
        changePercent: null,
      };
    });

    const response = { commodities, fetchedAt: new Date().toISOString() };

    // Only cache if at least some commodities fetched successfully
    const successCount = commodities.filter((c) => c.price !== null).length;
    if (successCount > 0) {
      const ttl = successCount === commodities.length ? CACHE_TTL : 2 * 60 * 1000;
      setCache(CACHE_KEY, response, ttl);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Commodities fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch commodities" },
      { status: 500 }
    );
  }
}
