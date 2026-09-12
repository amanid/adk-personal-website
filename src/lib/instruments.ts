/**
 * The instruments offered in the admin market research section.
 *
 * Symbols are Yahoo Finance tickers — the same source the commodities and
 * history endpoints already use, so quotes and daily series come from one
 * place. This list is only the menu of suggestions; the watchlist itself
 * accepts any symbol Yahoo recognises.
 */
import type { InstrumentCategory } from "@prisma/client";

export interface InstrumentPreset {
  symbol: string;
  name: string;
  category: InstrumentCategory;
  unit?: string;
  /** Shown in the UI where a symbol behaves in a way that would mislead. */
  note?: string;
}

export const INSTRUMENT_PRESETS: InstrumentPreset[] = [
  // Forex
  { symbol: "EURUSD=X", name: "EUR / USD", category: "FOREX" },
  { symbol: "GBPUSD=X", name: "GBP / USD", category: "FOREX" },
  { symbol: "USDJPY=X", name: "USD / JPY", category: "FOREX" },
  { symbol: "USDCAD=X", name: "USD / CAD", category: "FOREX" },
  {
    symbol: "EURXOF=X",
    name: "EUR / XOF",
    category: "FOREX",
    note: "The CFA franc is pegged to the euro at a fixed 655.957, so this barely moves.",
  },
  {
    symbol: "USDXOF=X",
    name: "USD / XOF",
    category: "FOREX",
    note: "Moves only through EUR/USD, because XOF is pegged to the euro.",
  },

  // Energy & metals
  { symbol: "CL=F", name: "Crude Oil (WTI)", category: "ENERGY", unit: "$/bbl" },
  { symbol: "BZ=F", name: "Crude Oil (Brent)", category: "ENERGY", unit: "$/bbl" },
  { symbol: "NG=F", name: "Natural Gas", category: "ENERGY", unit: "$/MMBtu" },
  { symbol: "GC=F", name: "Gold", category: "METALS", unit: "$/oz" },
  { symbol: "SI=F", name: "Silver", category: "METALS", unit: "$/oz" },
  { symbol: "HG=F", name: "Copper", category: "METALS", unit: "$/lb" },

  // Soft commodities
  { symbol: "CC=F", name: "Cocoa", category: "SOFTS", unit: "$/ton" },
  { symbol: "KC=F", name: "Coffee", category: "SOFTS", unit: "$/lb" },
  { symbol: "CT=F", name: "Cotton", category: "SOFTS", unit: "$/lb" },
  { symbol: "SB=F", name: "Sugar", category: "SOFTS", unit: "$/lb" },

  // Indices
  { symbol: "^GSPC", name: "S&P 500", category: "INDEX" },
  { symbol: "^IXIC", name: "NASDAQ Composite", category: "INDEX" },
  { symbol: "^FCHI", name: "CAC 40", category: "INDEX" },
  { symbol: "^VIX", name: "Volatility Index (VIX)", category: "INDEX" },
];

export const CATEGORY_LABELS: Record<InstrumentCategory, string> = {
  FOREX: "Forex",
  ENERGY: "Energy",
  METALS: "Metals",
  SOFTS: "Soft commodities",
  INDEX: "Indices",
  EQUITY: "Equities",
  OTHER: "Other",
};

/** Preset metadata for a symbol, if it is one we know about. */
export function findPreset(symbol: string): InstrumentPreset | undefined {
  const upper = symbol.trim().toUpperCase();
  return INSTRUMENT_PRESETS.find((i) => i.symbol.toUpperCase() === upper);
}

/**
 * Yahoo tickers are alphanumerics plus a small set of punctuation
 * (^GSPC, CL=F, EURUSD=X, BRVM.CI). Validating here keeps arbitrary strings out
 * of outbound URLs.
 */
export function isValidSymbol(symbol: string): boolean {
  return /^[A-Za-z0-9^.=:-]{1,20}$/.test(symbol.trim());
}
