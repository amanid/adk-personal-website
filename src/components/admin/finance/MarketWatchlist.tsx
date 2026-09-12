"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";
import SparklineChart from "@/components/admin/charts/SparklineChart";
import { readJson } from "@/lib/api-response";
import { CATEGORY_LABELS, INSTRUMENT_PRESETS } from "@/lib/instruments";

interface Stats {
  samples: number;
  last: number;
  changePercent: number | null;
  low: number;
  high: number;
  rangePosition: number | null;
  mean: number;
  volatility: number | null;
  sma20: number | null;
  sma50: number | null;
  maxDrawdown: number | null;
}

interface WatchRow {
  id: string;
  symbol: string;
  name: string;
  category: keyof typeof CATEGORY_LABELS;
  unit: string | null;
  notes: string | null;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
  stats: Stats | null;
  series: number[];
  error: string | null;
}

const num = (v: number | null | undefined, digits = 2): string =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : v.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const pct = (v: number | null | undefined, digits = 1): string =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%`;

export default function MarketWatchlist() {
  const [rows, setRows] = useState<WatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/finance/watchlist");
      const data = await readJson<{ items: WatchRow[] }>(res, "Could not load the watchlist");
      setRows(data.items || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the watchlist");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (sym: string) => {
    if (!sym.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/finance/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym.trim() }),
      });
      await readJson(res, "Could not add the instrument");
      setSymbol("");
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the instrument");
    } finally {
      setAdding(false);
    }
  };

  const remove = async (row: WatchRow) => {
    try {
      const res = await fetch(`/api/admin/finance/watchlist/${row.id}`, { method: "DELETE" });
      await readJson(res, "Could not remove the instrument");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the instrument");
    }
  };

  // Symbols not already followed, offered as one-click adds.
  const suggestions = INSTRUMENT_PRESETS.filter(
    (p) => !rows.some((r) => r.symbol === p.symbol)
  );

  /**
   * Add every suggestion. Sequential rather than parallel: each add verifies
   * the symbol against Yahoo first, and firing twenty lookups at once is a good
   * way to get rate-limited and have most of them fail.
   */
  const addAllSuggestions = async () => {
    setAdding(true);
    setError(null);
    let failed = 0;
    for (const preset of suggestions) {
      try {
        const res = await fetch("/api/admin/finance/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol: preset.symbol }),
        });
        if (!res.ok) failed++;
      } catch {
        failed++;
      }
    }
    setAdding(false);
    setShowAdd(false);
    if (failed) setError(`${failed} of ${suggestions.length} could not be added.`);
    await load();
  };

  const grouped = rows.reduce<Record<string, WatchRow[]>>((acc, row) => {
    (acc[row.category] ||= []).push(row);
    return acc;
  }, {});

  return (
    <section className="glass rounded-xl p-5">
      <header className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Watchlist</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Live quotes with statistics over the last year of daily closes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="p-2 rounded-lg border border-glass-border text-text-secondary hover:text-gold hover:border-gold/40 transition-all disabled:opacity-50"
            aria-label="Refresh quotes"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gold/40 text-gold text-sm font-medium hover:bg-gold/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </header>

      {showAdd && (
        <div className="rounded-lg border border-glass-border p-4 mb-4">
          <div className="flex gap-2 mb-3">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add(symbol)}
              placeholder="Ticker, e.g. CL=F, EURUSD=X, ^GSPC"
              aria-label="Ticker symbol"
              className="flex-1 px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
            />
            <button
              onClick={() => add(symbol)}
              disabled={adding || !symbol.trim()}
              className="px-4 py-2 rounded-lg bg-gold text-charcoal font-semibold text-sm hover:bg-gold-light transition-all disabled:opacity-50"
            >
              {adding ? "Checking…" : "Add"}
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <button
                onClick={addAllSuggestions}
                disabled={adding}
                className="px-2.5 py-1 rounded-full border border-gold/40 text-xs text-gold hover:bg-gold/10 transition-all disabled:opacity-50"
              >
                {adding ? "Adding…" : `Add all ${suggestions.length}`}
              </button>
              {suggestions.slice(0, 14).map((p) => (
                <button
                  key={p.symbol}
                  onClick={() => add(p.symbol)}
                  disabled={adding}
                  title={p.note || p.symbol}
                  className="px-2.5 py-1 rounded-full border border-glass-border text-xs text-text-secondary hover:border-gold/40 hover:text-gold transition-all disabled:opacity-50"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 mb-3 flex items-start gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </p>
      )}

      {loading ? (
        <p className="text-sm text-text-secondary py-6 text-center">Loading quotes…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-text-secondary py-6 text-center">
          Nothing followed yet — use Add to start a watchlist.
        </p>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-5 last:mb-0">
            <h3 className="text-[11px] uppercase tracking-wider text-text-muted mb-2">
              {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category}
            </h3>
            <div className="space-y-2">
              {items.map((row) => {
                const up = (row.changePercent ?? 0) >= 0;
                const isOpen = expanded === row.id;
                return (
                  <div key={row.id} className="rounded-lg border border-glass-border p-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpanded(isOpen ? null : row.id)}
                        className="flex-1 min-w-0 text-left"
                        aria-expanded={isOpen}
                      >
                        <div className="font-medium text-sm truncate">{row.name}</div>
                        <div className="text-[11px] text-text-muted">
                          {row.symbol}
                          {row.unit ? ` · ${row.unit}` : ""}
                        </div>
                      </button>

                      {row.series.length > 1 && (
                        <div className="w-24 hidden sm:block" aria-hidden="true">
                          <SparklineChart
                            data={row.series.map((v, i) => ({ date: String(i), value: v }))}
                            positive={up}
                            height={32}
                          />
                        </div>
                      )}

                      <div className="text-right shrink-0">
                        {row.error ? (
                          <span className="text-xs text-text-muted">{row.error}</span>
                        ) : (
                          <>
                            <div className="font-semibold text-sm">{num(row.price)}</div>
                            <div
                              className={`text-xs flex items-center justify-end gap-1 ${
                                up ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {up ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {pct(row.changePercent)}
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => remove(row)}
                        className="text-text-muted hover:text-red-400 transition-colors shrink-0"
                        aria-label={`Remove ${row.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {isOpen && row.stats && (
                      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-glass-border text-xs">
                        <Stat label="52-week range">
                          {num(row.stats.low)} – {num(row.stats.high)}
                        </Stat>
                        <Stat label="Position in range">
                          {row.stats.rangePosition === null
                            ? "—"
                            : `${row.stats.rangePosition.toFixed(0)}%`}
                        </Stat>
                        <Stat label="Volatility (annualised)">
                          {row.stats.volatility === null
                            ? "—"
                            : `${row.stats.volatility.toFixed(1)}%`}
                        </Stat>
                        <Stat label="Max drawdown">
                          {row.stats.maxDrawdown === null
                            ? "—"
                            : `−${row.stats.maxDrawdown.toFixed(1)}%`}
                        </Stat>
                        <Stat label="20-day average">{num(row.stats.sma20)}</Stat>
                        <Stat label="50-day average">{num(row.stats.sma50)}</Stat>
                        <Stat label="1-year change">{pct(row.stats.changePercent)}</Stat>
                        <Stat label="Daily closes used">{row.stats.samples}</Stat>
                      </dl>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      <p className="text-[11px] text-text-muted mt-4 pt-3 border-t border-glass-border">
        Figures describe past prices and are not a forecast or a recommendation. Quotes are
        delayed and come from Yahoo Finance.
      </p>
    </section>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-text-muted">{label}</dt>
      <dd className="font-medium mt-0.5">{children}</dd>
    </div>
  );
}
