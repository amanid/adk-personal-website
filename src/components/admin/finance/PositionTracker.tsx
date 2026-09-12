"use client";

import { useCallback, useEffect, useState } from "react";
import { Briefcase, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { readJson } from "@/lib/api-response";
import { INSTRUMENT_PRESETS } from "@/lib/instruments";

interface Valuation {
  costBasis: number;
  marketValue: number;
  profitLoss: number;
  profitLossPercent: number | null;
}

interface PositionRow {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  entryPrice: number;
  currency: string;
  openedAt: string;
  closedAt: string | null;
  closePrice: number | null;
  notes: string | null;
  currentPrice: number | null;
  isOpen: boolean;
  valuation: Valuation | null;
  stale: boolean;
}

interface Totals {
  costBasis: number;
  marketValue: number;
  profitLoss: number;
  realised: number;
  openCount: number;
  currencies: string[];
  mixedCurrency: boolean;
}

const money = (v: number | null | undefined, ccy = "USD"): string => {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  try {
    return v.toLocaleString(undefined, { style: "currency", currency: ccy });
  } catch {
    return `${v.toFixed(2)} ${ccy}`;
  }
};

const signed = (v: number | null | undefined, ccy = "USD"): string =>
  v === null || v === undefined || !Number.isFinite(v)
    ? "—"
    : `${v >= 0 ? "+" : "−"}${money(Math.abs(v), ccy)}`;

/** Default stake — the symbolic amount this section was built around. */
const DEFAULT_STAKE = "50";

export default function PositionTracker() {
  const [rows, setRows] = useState<PositionRow[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [symbol, setSymbol] = useState("CL=F");
  const [stake, setStake] = useState(DEFAULT_STAKE);
  const [entryPrice, setEntryPrice] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/finance/positions");
      const data = await readJson<{ positions: PositionRow[]; totals: Totals }>(
        res,
        "Could not load positions"
      );
      setRows(data.positions || []);
      setTotals(data.totals || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load positions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addPosition = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/finance/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          stake: Number(stake),
          entryPrice: entryPrice ? Number(entryPrice) : undefined,
          notes: notes || undefined,
        }),
      });
      await readJson(res, "Could not record the position");
      setShowAdd(false);
      setNotes("");
      setEntryPrice("");
      setStake(DEFAULT_STAKE);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record the position");
    } finally {
      setBusy(false);
    }
  };

  const act = async (row: PositionRow, action: "close" | "reopen") => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/finance/positions/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await readJson(res, "Could not update the position");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the position");
    }
  };

  const remove = async (row: PositionRow) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/finance/positions/${row.id}`, { method: "DELETE" });
      await readJson(res, "Could not delete the position");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the position");
    }
  };

  const ccy = totals?.currencies[0] || "USD";

  return (
    <section className="glass rounded-xl p-5">
      <header className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-gold" />
            Positions
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            A record of what you hold, valued at the latest price.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="p-2 rounded-lg border border-glass-border text-text-secondary hover:text-gold hover:border-gold/40 transition-all disabled:opacity-50"
            aria-label="Refresh valuations"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gold/40 text-gold text-sm font-medium hover:bg-gold/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            Record
          </button>
        </div>
      </header>

      {totals && totals.openCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Tile label="Cost basis" value={money(totals.costBasis, ccy)} />
          <Tile label="Market value" value={money(totals.marketValue, ccy)} />
          <Tile
            label="Unrealised"
            value={signed(totals.profitLoss, ccy)}
            tone={totals.profitLoss >= 0 ? "up" : "down"}
          />
          <Tile
            label="Realised"
            value={signed(totals.realised, ccy)}
            tone={totals.realised >= 0 ? "up" : "down"}
          />
        </div>
      )}

      {totals?.mixedCurrency && (
        <p className="text-xs text-amber-400 mb-3">
          Positions are quoted in {totals.currencies.join(", ")}. Totals above add the numbers
          without converting between currencies, so treat them as indicative only.
        </p>
      )}

      {showAdd && (
        <div className="rounded-lg border border-glass-border p-4 mb-4 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="text-xs">
              <span className="text-text-secondary block mb-1">Instrument</span>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
              >
                {INSTRUMENT_PRESETS.map((p) => (
                  <option key={p.symbol} value={p.symbol}>
                    {p.name} ({p.symbol})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <span className="text-text-secondary block mb-1">Stake</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="text-text-secondary block mb-1">
                Entry price <span className="text-text-muted">(blank = live)</span>
              </span>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="Latest price"
                className="w-full px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
              />
            </label>
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note (optional) — why you took this position"
            className="w-full px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={addPosition}
              disabled={busy || !Number(stake)}
              className="px-4 py-2 rounded-lg bg-gold text-charcoal font-semibold text-sm hover:bg-gold-light transition-all disabled:opacity-50"
            >
              {busy ? "Recording…" : "Record position"}
            </button>
            <span className="text-[11px] text-text-muted">
              The stake is divided by the entry price to give the quantity. This records a
              position; it does not place an order anywhere.
            </span>
          </div>
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
        <p className="text-sm text-text-secondary py-6 text-center">Loading positions…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-text-secondary py-6 text-center">
          No positions recorded. Use Record to log one.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-text-muted text-left">
                <th className="pb-2 font-medium">Instrument</th>
                <th className="pb-2 font-medium text-right">Quantity</th>
                <th className="pb-2 font-medium text-right">Entry</th>
                <th className="pb-2 font-medium text-right">Now</th>
                <th className="pb-2 font-medium text-right">Value</th>
                <th className="pb-2 font-medium text-right">P/L</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pl = r.valuation?.profitLoss ?? 0;
                return (
                  <tr key={r.id} className="border-t border-glass-border">
                    <td className="py-2.5 pr-2">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-[11px] text-text-muted">
                        {r.symbol} · {new Date(r.openedAt).toLocaleDateString()}
                        {!r.isOpen && " · closed"}
                        {r.stale && " · no live price"}
                      </div>
                      {r.notes && (
                        <div className="text-[11px] text-text-secondary mt-0.5">{r.notes}</div>
                      )}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{r.quantity.toFixed(4)}</td>
                    <td className="py-2.5 text-right tabular-nums">{r.entryPrice.toFixed(2)}</td>
                    <td className="py-2.5 text-right tabular-nums">
                      {r.currentPrice === null ? "—" : r.currentPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {money(r.valuation?.marketValue, r.currency)}
                    </td>
                    <td
                      className={`py-2.5 text-right tabular-nums ${
                        pl >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {signed(r.valuation?.profitLoss, r.currency)}
                      <div className="text-[11px]">
                        {r.valuation?.profitLossPercent === null ||
                        r.valuation?.profitLossPercent === undefined
                          ? ""
                          : `${r.valuation.profitLossPercent >= 0 ? "+" : ""}${r.valuation.profitLossPercent.toFixed(1)}%`}
                      </div>
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => act(r, r.isOpen ? "close" : "reopen")}
                        className="text-xs px-2 py-1 rounded border border-glass-border text-text-secondary hover:text-gold hover:border-gold/40 transition-all"
                      >
                        {r.isOpen ? "Close" : "Reopen"}
                      </button>
                      <button
                        onClick={() => remove(r)}
                        className="ml-1.5 text-text-muted hover:text-red-400 transition-colors align-middle"
                        aria-label={`Delete ${r.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-text-muted mt-4 pt-3 border-t border-glass-border">
        This is a record you keep, not a brokerage account. Nothing here places, funds or settles
        a trade, and no money moves.
      </p>
    </section>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="rounded-lg border border-glass-border p-3">
      <div className="text-[11px] text-text-muted">{label}</div>
      <div
        className={`font-semibold mt-0.5 tabular-nums ${
          tone === "up" ? "text-green-400" : tone === "down" ? "text-red-400" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
