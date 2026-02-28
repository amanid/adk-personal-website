import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCached, setCache } from "@/lib/cache";

const CACHE_KEY = "brvm";
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

interface BRVMIndex {
  name: string;
  value: string;
  change: string;
}

interface BRVMStock {
  symbol: string;
  name: string;
  price: string;
  change: string;
  volume: string;
}

interface BRVMData {
  indices: BRVMIndex[];
  stocks: BRVMStock[];
  fetchedAt: string;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cached = getCached<BRVMData>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    const cheerio = await import("cheerio");
    const res = await fetch("https://afx.kwayisi.org/brvm/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({
        indices: [],
        stocks: [],
        fetchedAt: new Date().toISOString(),
        error: "BRVM source unavailable",
      });
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const indices: BRVMIndex[] = [];
    const stocks: BRVMStock[] = [];

    // Parse indices
    $("table").first().find("tr").each((i, row) => {
      if (i === 0) return; // skip header
      const cells = $(row).find("td");
      if (cells.length >= 3) {
        indices.push({
          name: $(cells[0]).text().trim(),
          value: $(cells[1]).text().trim(),
          change: $(cells[2]).text().trim(),
        });
      }
    });

    // Parse stocks (second table)
    $("table").eq(1).find("tr").each((i, row) => {
      if (i === 0) return; // skip header
      if (stocks.length >= 15) return;
      const cells = $(row).find("td");
      if (cells.length >= 4) {
        stocks.push({
          symbol: $(cells[0]).text().trim(),
          name: $(cells[1]).text().trim(),
          price: $(cells[2]).text().trim(),
          change: $(cells[3]).text().trim(),
          volume: cells.length >= 5 ? $(cells[4]).text().trim() : "",
        });
      }
    });

    const response: BRVMData = {
      indices,
      stocks,
      fetchedAt: new Date().toISOString(),
    };

    setCache(CACHE_KEY, response, CACHE_TTL);

    return NextResponse.json(response);
  } catch (error) {
    console.error("BRVM fetch error:", error);
    return NextResponse.json({
      indices: [],
      stocks: [],
      fetchedAt: new Date().toISOString(),
      error: "Failed to fetch BRVM data",
    });
  }
}
