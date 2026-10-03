/**
 * Bet journal maths. Odds are stored ×1000 and money in minor units, so
 * every figure is exact integer arithmetic.
 */
export interface BetRow {
  status: "OPEN" | "WON" | "LOST" | "VOID" | "CASHED_OUT";
  oddsMilli: number;
  stakeCents: number;
  returnCents: number | null;
  currency: string;
  bookmaker: string;
}

/** What a winning bet returns (stake included), rounded down to the minor unit. */
export const winningReturn = (stakeCents: number, oddsMilli: number) => Math.floor((stakeCents * oddsMilli) / 1000);

/** Return actually received for a settled bet. */
export function settledReturn(b: BetRow): number {
  if (b.status === "WON") return b.returnCents ?? winningReturn(b.stakeCents, b.oddsMilli);
  if (b.status === "VOID") return b.stakeCents;
  if (b.status === "CASHED_OUT") return b.returnCents ?? 0;
  return 0; // LOST
}

/** Totals per currency (never summed across currencies). */
export function betStats(rows: BetRow[]) {
  const by = new Map<string, { staked: number; returned: number; settled: number; won: number; open: number; openStake: number }>();
  for (const b of rows) {
    const s = by.get(b.currency) ?? { staked: 0, returned: 0, settled: 0, won: 0, open: 0, openStake: 0 };
    if (b.status === "OPEN") {
      s.open++;
      s.openStake += b.stakeCents;
    } else if (b.status !== "VOID") {
      s.staked += b.stakeCents;
      s.returned += settledReturn(b);
      s.settled++;
      if (b.status === "WON") s.won++;
    }
    by.set(b.currency, s);
  }
  return [...by.entries()].map(([currency, s]) => ({
    currency,
    ...s,
    profit: s.returned - s.staked,
    /** Return on stake, %, over settled non-void bets. */
    roi: s.staked > 0 ? ((s.returned - s.staked) / s.staked) * 100 : null,
    strikeRate: s.settled > 0 ? (s.won / s.settled) * 100 : null,
  }));
}
