import { NextResponse } from "next/server";
import { getCached, setCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";
import { getYahooFinance } from "@/lib/yahoo";

const COMMODITIES = [
  { symbol: "CC=F", name: "Cocoa", unit: "$/ton" },
  { symbol: "KC=F", name: "Coffee", unit: "$/lb" },
  { symbol: "GC=F", name: "Gold", unit: "$/oz" },
  { symbol: "CL=F", name: "Crude Oil", unit: "$/bbl" },
  { symbol: "SB=F", name: "Sugar", unit: "$/lb" },
  { symbol: "CT=F", name: "Cotton", unit: "$/lb" },
];

const CACHE_KEY = "commodities_public";
const STALE_KEY = "commodities_public_stale";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const STALE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days — last-known-good fallback

interface CommodityResult {
  symbol: string;
  name: string;
  unit: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
}

export async function GET(request: Request) {
  try {
    const rateLimited = rateLimit(request, { limit: 30, windowSeconds: 60 });
    if (rateLimited) return rateLimited;

    const cached = getCached<{ commodities: CommodityResult[]; fetchedAt: string }>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    const yahooFinance = await getYahooFinance();

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

    const failedSymbols: string[] = [];
    const commodities: CommodityResult[] = results.map((result, i) => {
      if (result.status === "fulfilled" && result.value.price !== null) {
        return result.value;
      }
      failedSymbols.push(COMMODITIES[i].symbol);
      return {
        ...COMMODITIES[i],
        price: null,
        change: null,
        changePercent: null,
      };
    });

    const response = { commodities, fetchedAt: new Date().toISOString() };
    const successCount = commodities.length - failedSymbols.length;

    if (failedSymbols.length > 0) {
      // Upstream (Yahoo) rate-limiting/blocking is expected on cloud IPs — log
      // a single concise warning rather than one error per symbol.
      console.warn(
        `Commodities: ${failedSymbols.length}/${commodities.length} failed (${failedSymbols.join(
          ", "
        )}); serving ${successCount > 0 ? "partial" : "stale"} data`
      );
    }

    if (successCount > 0) {
      // If some failed, use a shorter cache TTL so we retry sooner.
      const ttl = successCount === commodities.length ? CACHE_TTL : 2 * 60 * 1000;
      setCache(CACHE_KEY, response, ttl);
      setCache(STALE_KEY, response, STALE_TTL);
      return NextResponse.json(response);
    }

    // Everything failed — serve the last-known-good snapshot if we have one so
    // the ticker stays populated instead of blanking.
    const stale = getCached<{ commodities: CommodityResult[]; fetchedAt: string }>(STALE_KEY);
    if (stale) {
      return NextResponse.json({ ...stale, stale: true });
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
