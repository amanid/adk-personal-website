/**
 * BRVM (Abidjan stock exchange) snapshot, scraped from a public mirror.
 *
 * One fetch path for the public ticker and the admin finance page. The source
 * is a small third-party site that is often unreachable from the host, so:
 * a 6s timeout (never the 10s connect timeout plus a hanging read), a 5-minute
 * backoff after a failure so the next requests answer at once, the last good
 * snapshot served (marked stale) while the source is down, and a one-line log
 * rather than a stack trace, since an unreachable mirror is expected.
 */
import { getCached, setCache } from "./cache";

export interface BRVMIndex {
  name: string;
  value: string;
  change: string;
}

export interface BRVMStock {
  symbol: string;
  name: string;
  price: string;
  change: string;
  volume: string;
}

export interface BRVMData {
  indices: BRVMIndex[];
  stocks: BRVMStock[];
  fetchedAt: string;
  stale?: boolean;
  error?: string;
}

const SOURCE = "https://afx.kwayisi.org/brvm/";
const CACHE_KEY = "brvm";
const CACHE_TTL = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 6000;
const BACKOFF_MS = 5 * 60 * 1000;

let lastGood: BRVMData | null = null;
let downUntil = 0;
let inflight: Promise<BRVMData> | null = null;

function unavailable(error: string): BRVMData {
  if (lastGood) return { ...lastGood, stale: true };
  return { indices: [], stocks: [], fetchedAt: new Date().toISOString(), error };
}

function parse(html: string, cheerio: typeof import("cheerio")): BRVMData {
  const $ = cheerio.load(html);
  const indices: BRVMIndex[] = [];
  const stocks: BRVMStock[] = [];

  // Table 0: index summary — row 0 is the header, row 1 the data:
  // "416.85 (-0.86)" | "+71.10 (20.56%)" | "XOF 16.07Tr"
  const indexCells = $("table").eq(0).find("tr").eq(1).find("td");
  if (indexCells.length >= 2) {
    const rawValue = $(indexCells[0]).text().trim();
    const valueMatch = rawValue.match(/([\d,.]+)\s*\(([^)]+)\)/);
    indices.push(valueMatch ? { name: "BRVM-CI", value: valueMatch[1], change: valueMatch[2] } : { name: "BRVM-CI", value: rawValue, change: "" });
    const ytdMatch = $(indexCells[1]).text().trim().match(/([+-]?[\d,.]+)\s*\(([^)]+)\)/);
    if (ytdMatch) indices.push({ name: "Year-to-Date", value: ytdMatch[2], change: ytdMatch[1] });
    if (indexCells.length >= 3) indices.push({ name: "Market Cap", value: $(indexCells[2]).text().trim(), change: "" });
  }

  // Table 3: full listing — Ticker | Name | Volume | Price | Change
  $("table").eq(3).find("tr").each((i, row) => {
    if (i === 0 || stocks.length >= 20) return;
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

  return { indices, stocks, fetchedAt: new Date().toISOString() };
}

async function fetchSnapshot(): Promise<BRVMData> {
  try {
    const cheerio = await import("cheerio");
    const res = await fetch(SOURCE, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      downUntil = Date.now() + BACKOFF_MS;
      console.error(`BRVM source answered ${res.status}; serving ${lastGood ? "last good data" : "empty"} for ${BACKOFF_MS / 60000} min`);
      return unavailable("BRVM source unavailable");
    }
    const data = parse(await res.text(), cheerio);
    setCache(CACHE_KEY, data, CACHE_TTL);
    if (data.stocks.length || data.indices.length) lastGood = data;
    return data;
  } catch (error) {
    const cause = (error as { cause?: { code?: string } })?.cause?.code ?? (error as Error)?.name;
    console.error(`BRVM fetch failed (${cause}); serving ${lastGood ? "last good data" : "empty"} for ${BACKOFF_MS / 60000} min`);
    downUntil = Date.now() + BACKOFF_MS;
    return unavailable("Failed to fetch BRVM data");
  }
}

/** The current snapshot: cached for 15 minutes, with one fetch shared by concurrent callers. */
export async function getBrvmSnapshot(): Promise<BRVMData> {
  const cached = getCached<BRVMData>(CACHE_KEY);
  if (cached) return cached;
  if (Date.now() < downUntil) return unavailable("BRVM source unavailable");
  if (!inflight) {
    inflight = fetchSnapshot().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}
