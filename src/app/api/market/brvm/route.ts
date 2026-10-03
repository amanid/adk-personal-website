import { NextResponse } from "next/server";
import { getCached, setCache } from "@/lib/cache";

const CACHE_KEY = "brvm_public";
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

// The last good snapshot, served (marked stale) while the source is down,
// and a short backoff so a dead source doesn't make every request wait.
let lastGood: BRVMData | null = null;
let downUntil = 0;
const FETCH_TIMEOUT_MS = 6000;
const BACKOFF_MS = 5 * 60 * 1000;

function unavailable(error: string) {
  if (lastGood) return NextResponse.json({ ...lastGood, stale: true });
  return NextResponse.json({ indices: [], stocks: [], fetchedAt: new Date().toISOString(), error });
}

export async function GET() {
  try {
    const cached = getCached<BRVMData>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }
    if (Date.now() < downUntil) return unavailable("BRVM source unavailable");

    const cheerio = await import("cheerio");
    const res = await fetch("https://afx.kwayisi.org/brvm/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      downUntil = Date.now() + BACKOFF_MS;
      return unavailable("BRVM source unavailable");
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const indices: BRVMIndex[] = [];
    const stocks: BRVMStock[] = [];

    // Table 0: Index summary — Row 0 is header, Row 1 has data
    const indexRow = $("table").eq(0).find("tr").eq(1);
    const indexCells = indexRow.find("td");
    if (indexCells.length >= 2) {
      const rawValue = $(indexCells[0]).text().trim();
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
      if (i === 0) return;
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
    if (stocks.length || indices.length) lastGood = response;

    return NextResponse.json(response);
  } catch (error) {
    // One line, not a stack trace: an unreachable third-party site is expected.
    const cause = (error as { cause?: { code?: string } })?.cause?.code ?? (error as Error)?.name;
    console.error(`BRVM fetch failed (${cause}); serving ${lastGood ? "last good data" : "empty"} for ${BACKOFF_MS / 60000} min`);
    downUntil = Date.now() + BACKOFF_MS;
    return unavailable("Failed to fetch BRVM data");
  }
}
