/**
 * Descriptive statistics over a daily close-price series.
 *
 * Everything here describes what a price HAS done. Nothing predicts, ranks or
 * recommends — these are measurements, and the reading of them is the user's.
 *
 * Pure functions over `number[]` so they can be exercised without the network.
 */

/** Trading days in a year — the conventional annualisation factor. */
const TRADING_DAYS = 252;

export interface PriceStats {
  /** Number of closes the statistics are computed from. */
  samples: number;
  last: number;
  /** Simple return over the whole window, as a percentage. */
  changePercent: number | null;
  low: number;
  high: number;
  /**
   * Where `last` sits between low and high, 0-100. 0 = at the window low,
   * 100 = at the window high. Null when the window is completely flat.
   */
  rangePosition: number | null;
  /** Mean close over the window. */
  mean: number;
  /** Annualised standard deviation of daily log returns, as a percentage. */
  volatility: number | null;
  /** Simple moving averages; null when the window is shorter than the period. */
  sma20: number | null;
  sma50: number | null;
  /** Largest peak-to-trough decline within the window, as a positive percentage. */
  maxDrawdown: number | null;
}

/** Mean of a non-empty series. */
function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Simple moving average of the final `period` closes, or null if too short. */
export function movingAverage(closes: number[], period: number): number | null {
  if (closes.length < period || period <= 0) return null;
  return mean(closes.slice(-period));
}

/**
 * Annualised volatility from daily log returns.
 *
 * Log returns rather than simple returns so that a rise and an equal-sized fall
 * are symmetric. Uses the sample standard deviation (n-1). Needs at least three
 * closes to produce two returns and a meaningful spread.
 */
export function annualisedVolatility(closes: number[]): number | null {
  if (closes.length < 3) return null;

  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    const curr = closes[i];
    // A non-positive close is bad data; a log return is undefined there.
    if (prev <= 0 || curr <= 0) continue;
    returns.push(Math.log(curr / prev));
  }
  if (returns.length < 2) return null;

  const avg = mean(returns);
  const variance =
    returns.reduce((sum, r) => sum + (r - avg) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(TRADING_DAYS) * 100;
}

/**
 * Largest peak-to-trough decline in the window, as a positive percentage.
 * Returns 0 for a series that only ever rises.
 */
export function maxDrawdown(closes: number[]): number | null {
  if (closes.length < 2) return null;

  let peak = closes[0];
  let worst = 0;
  for (const close of closes) {
    if (close > peak) peak = close;
    if (peak > 0) {
      const decline = ((peak - close) / peak) * 100;
      if (decline > worst) worst = decline;
    }
  }
  return worst;
}

/**
 * Pearson correlation of the daily returns of two series, in [-1, 1].
 *
 * Correlates returns rather than prices: two unrelated instruments that both
 * drift upward show a near-perfect price correlation while telling you nothing
 * about how they move together day to day. Series are aligned from the end, so
 * differing histories compare over their common tail.
 */
export function returnCorrelation(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 4) return null;

  const toReturns = (closes: number[]) => {
    const tail = closes.slice(-n);
    const out: number[] = [];
    for (let i = 1; i < tail.length; i++) {
      if (tail[i - 1] <= 0) return null;
      out.push(tail[i] / tail[i - 1] - 1);
    }
    return out;
  };

  const ra = toReturns(a);
  const rb = toReturns(b);
  if (!ra || !rb || ra.length < 3) return null;

  const ma = mean(ra);
  const mb = mean(rb);
  let cov = 0;
  let va = 0;
  let vb = 0;
  for (let i = 0; i < ra.length; i++) {
    const da = ra[i] - ma;
    const db = rb[i] - mb;
    cov += da * db;
    va += da * da;
    vb += db * db;
  }
  if (va === 0 || vb === 0) return null; // a flat series has no correlation
  return cov / Math.sqrt(va * vb);
}

/** Compute the full statistics set for a close series. */
export function priceStats(closes: number[]): PriceStats | null {
  const clean = closes.filter((c) => Number.isFinite(c) && c > 0);
  if (clean.length === 0) return null;

  const last = clean[clean.length - 1];
  const first = clean[0];
  const low = Math.min(...clean);
  const high = Math.max(...clean);
  const span = high - low;

  return {
    samples: clean.length,
    last,
    changePercent: first > 0 && clean.length > 1 ? ((last - first) / first) * 100 : null,
    low,
    high,
    rangePosition: span > 0 ? ((last - low) / span) * 100 : null,
    mean: mean(clean),
    volatility: annualisedVolatility(clean),
    sma20: movingAverage(clean, 20),
    sma50: movingAverage(clean, 50),
    maxDrawdown: maxDrawdown(clean),
  };
}

export interface PositionValuation {
  costBasis: number;
  marketValue: number;
  profitLoss: number;
  profitLossPercent: number | null;
}

/**
 * Mark a position to market. `quantity` may be fractional — a symbolic stake
 * buys a fraction of a barrel or an ounce.
 */
export function valuePosition(
  quantity: number,
  entryPrice: number,
  currentPrice: number | null
): PositionValuation | null {
  if (!Number.isFinite(quantity) || !Number.isFinite(entryPrice)) return null;
  const costBasis = quantity * entryPrice;
  if (currentPrice === null || !Number.isFinite(currentPrice)) {
    return { costBasis, marketValue: costBasis, profitLoss: 0, profitLossPercent: null };
  }
  const marketValue = quantity * currentPrice;
  const profitLoss = marketValue - costBasis;
  return {
    costBasis,
    marketValue,
    profitLoss,
    profitLossPercent: costBasis !== 0 ? (profitLoss / costBasis) * 100 : null,
  };
}
