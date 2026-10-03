"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CandlestickChart, RefreshCw, X, Trophy, ShieldAlert } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { currencyDecimals } from "@/lib/currency";

/*
 * Admin-only trading desk (OANDA) and bet journal. This page executes only
 * the orders entered here and offers no recommendations. Leveraged trading
 * carries a high risk of loss.
 */

const INPUT =
  "w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-md text-text-primary focus:border-gold/50 focus:outline-none text-sm";

interface Instrument {
  name: string;
  displayName: string;
  type: string;
  displayPrecision: number;
  minimumTradeSize: string;
}
interface Trade {
  id: string;
  instrument: string;
  price: string;
  openTime: string;
  currentUnits: string;
  initialUnits: string;
  unrealizedPL?: string;
  realizedPL?: string;
  closeTime?: string;
  averageClosePrice?: string;
}
interface Desk {
  configured: boolean;
  env?: "practice" | "live";
  maxUnits?: number;
  error?: string;
  summary?: { balance: string; NAV: string; unrealizedPL: string; pl: string; marginUsed: string; marginAvailable: string; currency: string; openTradeCount: number };
  openTrades?: Trade[];
  instruments?: Instrument[];
}
interface Bet {
  id: string;
  bookmaker: string;
  sport: string | null;
  event: string;
  market: string | null;
  selection: string;
  oddsMilli: number;
  stakeCents: number;
  currency: string;
  status: "OPEN" | "WON" | "LOST" | "VOID" | "CASHED_OUT";
  returnCents: number | null;
  placedAt: string;
}
interface BetStat {
  currency: string;
  staked: number;
  returned: number;
  profit: number;
  roi: number | null;
  strikeRate: number | null;
  settled: number;
  open: number;
  openStake: number;
}

const WATCH_KEY = "adk_trading_watch";
// International markets: major FX, oil, metals and global indices. Anything
// the connected account doesn't offer is hidden automatically, and the
// watchlist can be edited on the page.
const DEFAULT_WATCH = [
  "EUR_USD", "GBP_USD", "USD_JPY", "WTICO_USD", "BCO_USD", "XAU_USD", "XAG_USD",
  "US30_USD", "SPX500_USD", "NAS100_USD", "UK100_GBP", "DE30_EUR", "FR40_EUR",
];

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function TradingPage() {
  const [tab, setTab] = useState<"desk" | "history" | "bets">("desk");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CandlestickChart className="w-6 h-6 text-gold" /> Trading desk
        </h1>
        <p className="text-xs text-text-muted max-w-md">
          Executes only the orders you enter; gives no advice. Leveraged trading carries a high risk of loss.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["desk", "Markets (OANDA)"],
            ["history", "History & audit"],
            ["bets", "Bet journal"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-md text-sm border ${tab === id ? "border-gold bg-gold/10" : "border-glass-border text-text-secondary"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "desk" && <MarketsDesk />}
      {tab === "history" && <History />}
      {tab === "bets" && <BetJournal />}
    </div>
  );
}

function MarketsDesk() {
  const [desk, setDesk] = useState<Desk | null>(null);
  const [watch, setWatch] = useState<string[]>(DEFAULT_WATCH);
  const [prices, setPrices] = useState<Record<string, { bid: string; ask: string }>>({});
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const [ticket, setTicket] = useState({ instrument: "EUR_USD", side: "BUY" as "BUY" | "SELL", units: "1000", stopLoss: "", takeProfit: "" });
  const [confirming, setConfirming] = useState(false);
  const [liveAck, setLiveAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/trading", { cache: "no-store" });
    setDesk(await res.json().catch(() => ({ configured: false, error: "Could not load" })));
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WATCH_KEY) || "null");
      // Restoring a saved watchlist on mount.
       
      if (Array.isArray(saved) && saved.length) setWatch(saved.filter((x) => typeof x === "string").slice(0, 20));
    } catch {
      /* ignore */
    }
    load();
  }, [load]);

  const tradable = useMemo(() => new Map((desk?.instruments ?? []).map((i) => [i.name, i])), [desk]);
  const shownWatch = watch.filter((w) => tradable.has(w));

  // Poll quotes while the desk is open.
  useEffect(() => {
    if (!desk?.configured || shownWatch.length === 0) return;
    let stop = false;
    const tick = async () => {
      try {
        const d = await send(`/api/admin/trading/prices?i=${shownWatch.join(",")}`, "GET");
        if (stop) return;
        const next: Record<string, { bid: string; ask: string }> = {};
        for (const p of d.prices as { instrument: string; bids: { price: string }[]; asks: { price: string }[] }[]) {
          next[p.instrument] = { bid: p.bids?.[0]?.price ?? "—", ask: p.asks?.[0]?.price ?? "—" };
        }
        setPrices(next);
      } catch {
        /* keep last quotes */
      }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      stop = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desk?.configured, shownWatch.join(",")]);

  const saveWatch = (w: string[]) => {
    setWatch(w);
    try {
      localStorage.setItem(WATCH_KEY, JSON.stringify(w));
    } catch {
      /* ignore */
    }
  };

  if (!desk) return <p className="text-text-secondary">Loading…</p>;
  if (!desk.configured) {
    return (
      <div className="glass p-6 space-y-3 text-sm max-w-2xl">
        <p className="font-medium flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" /> Not connected
        </p>
        <p className="text-text-secondary">
          Open an OANDA account (start with a free practice account), create a personal API token in OANDA&apos;s dashboard,
          then set these environment variables on Render:
        </p>
        <pre className="figure text-xs bg-navy/60 rounded-md p-3">{`OANDA_API_TOKEN=<your token>
OANDA_ACCOUNT_ID=<your account id, e.g. 101-004-1234567-001>
OANDA_ENV=practice        # set to "live" only when you mean it
OANDA_MAX_UNITS=100000    # largest order the desk will accept`}</pre>
      </div>
    );
  }

  const inst = tradable.get(ticket.instrument);
  const q = prices[ticket.instrument];
  const units = Number(ticket.units);
  const live = desk.env === "live";

  const place = async () => {
    setBusy(true);
    setFlash(null);
    try {
      const r = await send("/api/admin/trading/orders", "POST", {
        instrument: ticket.instrument,
        side: ticket.side,
        units,
        stopLoss: ticket.stopLoss ? Number(ticket.stopLoss) : null,
        takeProfit: ticket.takeProfit ? Number(ticket.takeProfit) : null,
        confirmLive: live ? liveAck : undefined,
      });
      setFlash({ ok: true, text: `Filled at ${r.fill?.price ?? "market"} (transaction ${r.fill?.id}).` });
      setConfirming(false);
      setLiveAck(false);
      load();
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const s = desk.summary;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`px-3 py-1 rounded-md text-sm font-bold ${live ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-green-500/15 text-green-400 border border-green-500/30"}`}>
          {live ? "LIVE ACCOUNT — real money" : "PRACTICE ACCOUNT"}
        </span>
        <button onClick={load} className="text-sm text-text-secondary inline-flex items-center gap-1 hover:text-text-primary">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
        {desk.error && <span className="text-sm text-red-400">{desk.error}</span>}
      </div>

      {s && (
        <dl className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ["Balance", s.balance],
            ["NAV", s.NAV],
            ["Unrealised P/L", s.unrealizedPL],
            ["Margin used", s.marginUsed],
            ["Margin available", s.marginAvailable],
          ].map(([k, v]) => (
            <div key={k} className="glass p-3">
              <dt className="text-xs text-text-muted">{k}</dt>
              <dd className={`figure text-lg ${k === "Unrealised P/L" ? (Number(v) >= 0 ? "text-green-400" : "text-red-400") : ""}`}>
                {Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xs text-text-muted">{s.currency}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      {flash && <p className={`text-sm rounded-md p-3 border ${flash.ok ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>{flash.text}</p>}

      <div className="grid lg:grid-cols-[1fr_22rem] gap-5 items-start">
        <div className="glass p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">Watchlist</p>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Add instrument (e.g. oil, EUR)…" className={`${INPUT} max-w-xs`} />
          </div>
          {filter && (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {(desk.instruments ?? [])
                .filter((i) => !watch.includes(i.name) && `${i.name} ${i.displayName}`.toLowerCase().includes(filter.toLowerCase()))
                .slice(0, 30)
                .map((i) => (
                  <button key={i.name} onClick={() => saveWatch([...watch, i.name].slice(0, 20))} className="text-xs px-2 py-1 rounded border border-glass-border hover:border-gold">
                    + {i.displayName}
                  </button>
                ))}
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted border-b border-glass-border">
                <th className="py-2 font-medium">Instrument</th>
                <th className="py-2 font-medium text-right">Bid</th>
                <th className="py-2 font-medium text-right">Ask</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shownWatch.map((w) => (
                <tr key={w} className={`border-b border-glass-border/60 cursor-pointer ${ticket.instrument === w ? "bg-gold/5" : ""}`} onClick={() => setTicket({ ...ticket, instrument: w })}>
                  <td className="py-2">{tradable.get(w)?.displayName ?? w}</td>
                  <td className="py-2 text-right figure">{prices[w]?.bid ?? "…"}</td>
                  <td className="py-2 text-right figure">{prices[w]?.ask ?? "…"}</td>
                  <td className="py-2 text-right">
                    <button onClick={(e) => { e.stopPropagation(); saveWatch(watch.filter((x) => x !== w)); }} className="text-text-muted hover:text-red-400" aria-label={`Remove ${w}`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {watch.length > shownWatch.length && <p className="text-xs text-text-muted">Some watchlist instruments aren&apos;t offered on this account and are hidden.</p>}
        </div>

        <div className="glass p-4 space-y-3">
          <p className="font-medium">Order ticket</p>
          <label className="block text-xs text-text-secondary">
            Instrument
            <select className={INPUT} value={ticket.instrument} onChange={(e) => setTicket({ ...ticket, instrument: e.target.value })}>
              {(desk.instruments ?? []).map((i) => (
                <option key={i.name} value={i.name}>
                  {i.displayName}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["BUY", "SELL"] as const).map((sd) => (
              <button key={sd} onClick={() => setTicket({ ...ticket, side: sd })} className={`py-2 rounded-md text-sm font-semibold border ${ticket.side === sd ? (sd === "BUY" ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-red-500/20 border-red-500/50 text-red-400") : "border-glass-border text-text-secondary"}`}>
                {sd} {q ? (sd === "BUY" ? q.ask : q.bid) : ""}
              </button>
            ))}
          </div>
          <label className="block text-xs text-text-secondary">
            Units (min {inst?.minimumTradeSize ?? "?"}, max {desk.maxUnits})
            <input type="number" min={1} step={1} className={INPUT} value={ticket.units} onChange={(e) => setTicket({ ...ticket, units: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-text-secondary">
              Stop-loss (optional)
              <input type="number" step="any" className={INPUT} value={ticket.stopLoss} onChange={(e) => setTicket({ ...ticket, stopLoss: e.target.value })} />
            </label>
            <label className="block text-xs text-text-secondary">
              Take-profit (optional)
              <input type="number" step="any" className={INPUT} value={ticket.takeProfit} onChange={(e) => setTicket({ ...ticket, takeProfit: e.target.value })} />
            </label>
          </div>
          {!confirming ? (
            <button
              disabled={!Number.isInteger(units) || units <= 0}
              onClick={() => setConfirming(true)}
              className="w-full py-2.5 rounded-md bg-gold text-charcoal font-semibold disabled:opacity-40"
            >
              Review order
            </button>
          ) : (
            <div className="rounded-md border border-glass-border p-3 space-y-2 text-sm">
              <p>
                <strong>{ticket.side}</strong> {units.toLocaleString()} {inst?.displayName} at market
                {q ? ` (~${ticket.side === "BUY" ? q.ask : q.bid})` : ""}
                {ticket.stopLoss && `, SL ${ticket.stopLoss}`}
                {ticket.takeProfit && `, TP ${ticket.takeProfit}`}.
              </p>
              {live && (
                <label className="flex items-start gap-2 text-red-400">
                  <input type="checkbox" checked={liveAck} onChange={(e) => setLiveAck(e.target.checked)} className="mt-1" />
                  I understand this order uses real money on my live account.
                </label>
              )}
              <div className="flex gap-2">
                <button disabled={busy || (live && !liveAck)} onClick={place} className="flex-1 py-2 rounded-md bg-gold text-charcoal font-semibold disabled:opacity-40">
                  {busy ? "Sending…" : "Place order"}
                </button>
                <button onClick={() => setConfirming(false)} className="px-3 py-2 rounded-md border border-glass-border">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass p-4">
        <p className="font-medium mb-3">Open trades ({desk.openTrades?.length ?? 0})</p>
        {(desk.openTrades ?? []).length === 0 ? (
          <p className="text-sm text-text-secondary">No open trades.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted border-b border-glass-border">
                <th className="py-2 font-medium">Instrument</th>
                <th className="py-2 font-medium text-right">Units</th>
                <th className="py-2 font-medium text-right">Open price</th>
                <th className="py-2 font-medium text-right">Unrealised P/L</th>
                <th className="py-2 font-medium">Opened</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {desk.openTrades!.map((t) => (
                <tr key={t.id} className="border-b border-glass-border/60">
                  <td className="py-2">{tradable.get(t.instrument)?.displayName ?? t.instrument}</td>
                  <td className={`py-2 text-right figure ${Number(t.currentUnits) > 0 ? "text-green-400" : "text-red-400"}`}>{t.currentUnits}</td>
                  <td className="py-2 text-right figure">{t.price}</td>
                  <td className={`py-2 text-right figure ${Number(t.unrealizedPL) >= 0 ? "text-green-400" : "text-red-400"}`}>{t.unrealizedPL}</td>
                  <td className="py-2 text-text-secondary">{new Date(t.openTime).toLocaleString()}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={async () => {
                        if (!confirm(`Close trade ${t.id} (${t.currentUnits} ${t.instrument}) at market${live ? " — LIVE account" : ""}?`)) return;
                        try {
                          const r = await send(`/api/admin/trading/trades/${t.id}/close`, "POST");
                          setFlash({ ok: true, text: `Closed at ${r.fill?.price ?? "market"}.` });
                          load();
                        } catch (e) {
                          setFlash({ ok: false, text: (e as Error).message });
                        }
                      }}
                      className="px-2 py-1 rounded border border-glass-border text-xs hover:border-red-400 hover:text-red-400"
                    >
                      Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function History() {
  const [data, setData] = useState<{ closed: Trade[]; audit: { id: string; environment: string; action: string; instrument: string | null; units: string | null; ok: boolean; error: string | null; createdAt: string }[] } | null>(null);
  useEffect(() => {
    fetch("/api/admin/trading/history", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ closed: [], audit: [] }));
  }, []);
  if (!data) return <p className="text-text-secondary">Loading…</p>;
  const realized = data.closed.reduce((s, t) => s + Number(t.realizedPL || 0), 0);
  return (
    <div className="space-y-5">
      <div className="glass p-4">
        <p className="font-medium mb-1">Closed trades ({data.closed.length})</p>
        <p className="text-sm text-text-secondary mb-3">
          Realised P/L over these: <span className={`figure ${realized >= 0 ? "text-green-400" : "text-red-400"}`}>{realized.toFixed(2)}</span> (account currency)
        </p>
        <table className="w-full text-sm">
          <tbody>
            {data.closed.map((t) => (
              <tr key={t.id} className="border-b border-glass-border/60">
                <td className="py-1.5">{t.instrument}</td>
                <td className="py-1.5 figure text-right">{t.initialUnits}</td>
                <td className="py-1.5 figure text-right">{t.price} → {t.averageClosePrice ?? "—"}</td>
                <td className={`py-1.5 figure text-right ${Number(t.realizedPL) >= 0 ? "text-green-400" : "text-red-400"}`}>{t.realizedPL}</td>
                <td className="py-1.5 text-text-muted text-right">{t.closeTime ? new Date(t.closeTime).toLocaleString() : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="glass p-4">
        <p className="font-medium mb-3">Audit log (every order and close sent)</p>
        <table className="w-full text-sm">
          <tbody>
            {data.audit.map((a) => (
              <tr key={a.id} className="border-b border-glass-border/60">
                <td className="py-1.5 text-text-muted">{new Date(a.createdAt).toLocaleString()}</td>
                <td className="py-1.5">{a.environment}</td>
                <td className="py-1.5">{a.action}</td>
                <td className="py-1.5 figure">{a.instrument ?? ""} {a.units ?? ""}</td>
                <td className={`py-1.5 ${a.ok ? "text-green-400" : "text-red-400"}`}>{a.ok ? "ok" : a.error}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const BOOKMAKERS = ["1xBet", "Betclic", "Betway", "Bet365", "Premier Bet", "Betfair", "Other"];
const BET_STATUS_CHIP: Record<string, string> = {
  OPEN: "bg-amber-500/15 text-amber-400",
  WON: "bg-green-500/15 text-green-400",
  LOST: "bg-red-500/15 text-red-400",
  VOID: "bg-navy-light text-text-muted",
  CASHED_OUT: "bg-signal/15 text-signal",
};

function BetJournal() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<BetStat[]>([]);
  const [byBookmaker, setByBookmaker] = useState<{ bookmaker: string; stats: BetStat[] }[]>([]);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({ bookmaker: "1xBet", sport: "Football", event: "", market: "", selection: "", odds: "", stake: "", currency: "XOF" });

  const load = useCallback(async () => {
    const d = await send("/api/admin/bets", "GET").catch(() => null);
    if (d) {
      setBets(d.bets);
      setStats(d.stats);
      setByBookmaker(d.byBookmaker);
    }
  }, []);
  useEffect(() => {
    // Initial fetch on mount; state is only set after the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Minor units follow the currency's own precision (XOF has none, USD two).
  const minor = (major: string, cur: string) => Math.round(Number(major) * 10 ** currencyDecimals(cur));
  const money = (cents: number, cur: string) => formatPrice(cents, cur);

  const add = async () => {
    setFlash(null);
    try {
      await send("/api/admin/bets", "POST", {
        bookmaker: f.bookmaker,
        sport: f.sport,
        event: f.event,
        market: f.market,
        selection: f.selection,
        oddsMilli: Math.round(Number(f.odds) * 1000),
        stakeCents: minor(f.stake, f.currency),
        currency: f.currency,
      });
      setF({ ...f, event: "", market: "", selection: "", odds: "", stake: "" });
      load();
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    }
  };
  const settle = async (b: Bet, status: Bet["status"]) => {
    let returnCents: number | undefined;
    if (status === "CASHED_OUT") {
      const v = prompt(`Cash-out amount (${b.currency})`);
      if (!v) return;
      returnCents = minor(v, b.currency);
    }
    try {
      await send(`/api/admin/bets/${b.id}`, "PATCH", { status, returnCents });
      load();
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary max-w-3xl flex gap-2">
        <Trophy className="w-4 h-4 text-gold shrink-0 mt-0.5" />
        Record bets you place yourself at a bookmaker to track your bankroll. Bookmakers such as Betclic forbid automated
        betting tools, so this journal never connects to your accounts.
      </p>
      {flash && <p className={`text-sm rounded-md p-3 border ${flash.ok ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>{flash.text}</p>}

      {stats.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.currency} className="glass p-4 grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs text-text-muted">Staked (settled)</p><p className="figure">{money(s.staked, s.currency)}</p></div>
              <div><p className="text-xs text-text-muted">Profit</p><p className={`figure ${s.profit >= 0 ? "text-green-400" : "text-red-400"}`}>{money(s.profit, s.currency)}</p></div>
              <div><p className="text-xs text-text-muted">ROI</p><p className="figure">{s.roi === null ? "—" : `${s.roi.toFixed(1)}%`}</p></div>
              <div><p className="text-xs text-text-muted">Strike rate</p><p className="figure">{s.strikeRate === null ? "—" : `${s.strikeRate.toFixed(0)}%`}</p></div>
              <div><p className="text-xs text-text-muted">Settled</p><p className="figure">{s.settled}</p></div>
              <div><p className="text-xs text-text-muted">Open (at stake)</p><p className="figure">{s.open} · {money(s.openStake, s.currency)}</p></div>
            </div>
          ))}
        </div>
      )}
      {byBookmaker.length > 1 && (
        <p className="text-xs text-text-muted">
          By bookmaker:{" "}
          {byBookmaker
            .map((b) => `${b.bookmaker} ${b.stats.map((s) => `${money(s.profit, s.currency)}${s.roi !== null ? ` (${s.roi.toFixed(1)}%)` : ""}`).join(" / ")}`)
            .join(" · ")}
        </p>
      )}

      <div className="glass p-4 grid sm:grid-cols-4 gap-2 items-end">
        <label className="text-xs text-text-secondary">Bookmaker
          <select className={INPUT} value={f.bookmaker} onChange={(e) => setF({ ...f, bookmaker: e.target.value })}>{BOOKMAKERS.map((b) => <option key={b}>{b}</option>)}</select>
        </label>
        <label className="text-xs text-text-secondary">Sport<input className={INPUT} value={f.sport} onChange={(e) => setF({ ...f, sport: e.target.value })} /></label>
        <label className="text-xs text-text-secondary sm:col-span-2">Event<input className={INPUT} value={f.event} placeholder="e.g. ASEC – Africa Sports" onChange={(e) => setF({ ...f, event: e.target.value })} /></label>
        <label className="text-xs text-text-secondary">Market<input className={INPUT} value={f.market} placeholder="1X2, Over 2.5…" onChange={(e) => setF({ ...f, market: e.target.value })} /></label>
        <label className="text-xs text-text-secondary">Selection<input className={INPUT} value={f.selection} onChange={(e) => setF({ ...f, selection: e.target.value })} /></label>
        <label className="text-xs text-text-secondary">Odds (decimal)<input type="number" step="0.01" min="1.01" className={INPUT} value={f.odds} onChange={(e) => setF({ ...f, odds: e.target.value })} /></label>
        <div className="grid grid-cols-[1fr_5rem] gap-2">
          <label className="text-xs text-text-secondary">Stake<input type="number" step="any" min="0" className={INPUT} value={f.stake} onChange={(e) => setF({ ...f, stake: e.target.value })} /></label>
          <label className="text-xs text-text-secondary">Cur.<input className={INPUT} value={f.currency} maxLength={3} onChange={(e) => setF({ ...f, currency: e.target.value.toUpperCase() })} /></label>
        </div>
        <button onClick={add} disabled={!f.event || !f.selection || !f.odds || !f.stake} className="sm:col-span-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm disabled:opacity-40">Record bet</button>
      </div>

      <div className="glass overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-muted border-b border-glass-border">
              <th className="p-2 font-medium">Placed</th><th className="p-2 font-medium">Bookmaker</th><th className="p-2 font-medium">Bet</th>
              <th className="p-2 font-medium text-right">Odds</th><th className="p-2 font-medium text-right">Stake</th><th className="p-2 font-medium text-right">Return</th><th className="p-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {bets.map((b) => (
              <tr key={b.id} className="border-b border-glass-border/60 align-top">
                <td className="p-2 text-text-muted">{new Date(b.placedAt).toLocaleDateString()}</td>
                <td className="p-2">{b.bookmaker}</td>
                <td className="p-2">{b.event}<span className="text-text-secondary"> · {b.market ? `${b.market}: ` : ""}{b.selection}</span></td>
                <td className="p-2 figure text-right">{(b.oddsMilli / 1000).toFixed(2)}</td>
                <td className="p-2 figure text-right">{money(b.stakeCents, b.currency)}</td>
                <td className="p-2 figure text-right">{b.returnCents !== null ? money(b.returnCents, b.currency) : "—"}</td>
                <td className="p-2">
                  {b.status === "OPEN" ? (
                    <span className="flex flex-wrap gap-1">
                      {(["WON", "LOST", "VOID", "CASHED_OUT"] as const).map((s) => (
                        <button key={s} onClick={() => settle(b, s)} className="text-xs px-1.5 py-0.5 rounded border border-glass-border hover:border-gold">{s.replace("_", " ").toLowerCase()}</button>
                      ))}
                    </span>
                  ) : (
                    <button onClick={() => settle(b, "OPEN")} title="Re-open" className={`text-xs px-2 py-0.5 rounded-full ${BET_STATUS_CHIP[b.status]}`}>{b.status.replace("_", " ").toLowerCase()}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
