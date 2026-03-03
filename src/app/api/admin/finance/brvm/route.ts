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

    // Table 0: Index summary — Row 0 is header, Row 1 has data
    // Format: "416.85 (-0.86)" | "+71.10 (20.56%)" | "XOF 16.07Tr"
    const indexRow = $("table").eq(0).find("tr").eq(1);
    const indexCells = indexRow.find("td");
    if (indexCells.length >= 2) {
      const rawValue = $(indexCells[0]).text().trim();
      // Parse "416.85 (-0.86)" into value and change
      const valueMatch = rawValue.match(/([\d,.]+)\s*\(([^)]+)\)/);
      if (valueMatch) {
        indices.push({
          name: "BRVM-CI",
          value: valueMatch[1],
          change: valueMatch[2],
        });
      } else {
        indices.push({ name: "BRVM-CI", value: rawValue, change: "" });
      }

      const ytdRaw = $(indexCells[1]).text().trim();
      const ytdMatch = ytdRaw.match(/([+-]?[\d,.]+)\s*\(([^)]+)\)/);
      if (ytdMatch) {
        indices.push({
          name: "Year-to-Date",
          value: ytdMatch[2],
          change: ytdMatch[1],
        });
      }

      if (indexCells.length >= 3) {
        indices.push({
          name: "Market Cap",
          value: $(indexCells[2]).text().trim(),
          change: "",
        });
      }
    }

    // Table 3: Full stock listing — Ticker | Name | Volume | Price | Change
    $("table").eq(3).find("tr").each((i, row) => {
      if (i === 0) return; // skip header
      if (stocks.length >= 20) return;
      const cells = $(row).find("td");
      if (cells.length >= 5) {
        stocks.push({
          symbol: $(cells[0]).text().trim(),
          name: $(cells[1]).text().trim(),
          volume: $(cells[2]).text().trim(),
          price: $(cells[3]).text().trim(),
          change: $(cells[4]).text().trim(),
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
