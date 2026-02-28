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
  price: number;
  change: number;
  changePercent: number;
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

    const yahooFinance = (await import("yahoo-finance2")).default;

    const results: CommodityResult[] = [];

    for (const commodity of COMMODITIES) {
      try {
        const quote = await yahooFinance.quote(commodity.symbol) as {
          regularMarketPrice?: number;
          regularMarketChange?: number;
          regularMarketChangePercent?: number;
        };
        results.push({
          symbol: commodity.symbol,
          name: commodity.name,
          unit: commodity.unit,
          price: quote.regularMarketPrice ?? 0,
          change: quote.regularMarketChange ?? 0,
          changePercent: quote.regularMarketChangePercent ?? 0,
        });
      } catch {
        results.push({
          ...commodity,
          price: 0,
          change: 0,
          changePercent: 0,
        });
      }
    }

    const response = { commodities: results, fetchedAt: new Date().toISOString() };
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
