/**
 * Fetch a quote from Yahoo Finance's public chart endpoint.
 *
 * Unlike yahoo-finance2's `quote()`, the chart endpoint does NOT require the
 * crumb/cookie handshake that triggers "Failed to get crumb, status 429" on
 * datacenter IPs (e.g. Render), so it is far more reliable server-side.
 */
export interface ChartQuote {
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
}

const HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

interface YahooChartMeta {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  currency?: string;
}

export interface ChartSeriesPoint {
  date: string; // YYYY-MM-DD
  close: number;
}

/**
 * Fetch a daily close-price series from Yahoo's crumb-free chart endpoint.
 * `range` follows Yahoo's syntax (e.g. "1mo", "3mo", "1y").
 */
export async function fetchChartSeries(
  symbol: string,
  range = "1mo",
  timeoutMs = 10000
): Promise<ChartSeriesPoint[] | null> {
  for (const host of HOSTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const url = `${host}/v8/finance/chart/${encodeURIComponent(
        symbol
      )}?interval=1d&range=${encodeURIComponent(range)}`;
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok) continue;

      const json = (await res.json()) as {
        chart?: {
          result?: Array<{
            timestamp?: number[];
            indicators?: { quote?: Array<{ close?: (number | null)[] }> };
          }>;
        };
      };
      const result = json?.chart?.result?.[0];
      const timestamps = result?.timestamp;
      const closes = result?.indicators?.quote?.[0]?.close;
      if (!timestamps || !closes) continue;

      const points: ChartSeriesPoint[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        const close = closes[i];
        if (typeof close === "number") {
          points.push({
            date: new Date(timestamps[i] * 1000).toISOString().split("T")[0],
            close,
          });
        }
      }
      if (points.length > 0) return points;
    } catch {
      // try the next host
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export async function fetchChartQuote(
  symbol: string,
  timeoutMs = 8000
): Promise<ChartQuote | null> {
  for (const host of HOSTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const url = `${host}/v8/finance/chart/${encodeURIComponent(
        symbol
      )}?interval=1d&range=5d`;
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok) continue;

      const json = (await res.json()) as {
        chart?: { result?: Array<{ meta?: YahooChartMeta }> };
      };
      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta || typeof meta.regularMarketPrice !== "number") continue;

      const price = meta.regularMarketPrice;
      const prev =
        typeof meta.chartPreviousClose === "number"
          ? meta.chartPreviousClose
          : typeof meta.previousClose === "number"
            ? meta.previousClose
            : null;
      const change = prev != null ? price - prev : null;
      const changePercent = prev ? ((price - prev) / prev) * 100 : null;

      return { price, previousClose: prev, change, changePercent, currency: meta.currency ?? null };
    } catch {
      // try the next host
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}
