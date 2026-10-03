/**
 * OANDA v20 REST client for the admin trading desk. Server-only.
 *
 * Endpoints and field names follow OANDA's developer docs:
 *   practice https://api-fxpractice.oanda.com · live https://api-fxtrade.oanda.com
 *   Authorization: Bearer <token>
 *
 * Safety: the environment is PRACTICE unless OANDA_ENV=live is set
 * explicitly; every order is checked against the account's own instrument
 * list and a maximum size (OANDA_MAX_UNITS); every order and close is
 * written to TradeAuditLog whether it succeeds or not.
 */
import { prisma } from "./prisma";

export interface OandaConfig {
  token: string;
  accountId: string;
  env: "practice" | "live";
  base: string;
  maxUnits: number;
}

export function oandaConfig(): OandaConfig | null {
  const token = process.env.OANDA_API_TOKEN?.trim();
  const accountId = process.env.OANDA_ACCOUNT_ID?.trim();
  if (!token || !accountId) return null;
  const env = process.env.OANDA_ENV === "live" ? "live" : "practice";
  const override = process.env.NODE_ENV !== "production" ? process.env.OANDA_API_BASE : undefined;
  const maxUnits = Number.parseInt(process.env.OANDA_MAX_UNITS || "", 10);
  return {
    token,
    accountId,
    env,
    base: override || (env === "live" ? "https://api-fxtrade.oanda.com" : "https://api-fxpractice.oanda.com"),
    maxUnits: Number.isFinite(maxUnits) && maxUnits > 0 ? maxUnits : 100_000,
  };
}

export class OandaError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function oanda<T>(cfg: OandaConfig, path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${cfg.base}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
      "Accept-Datetime-Format": "RFC3339",
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    // OANDA puts a human-readable reason in errorMessage.
    throw new OandaError(String(data.errorMessage || `OANDA error ${res.status}`).slice(0, 300), res.status);
  }
  return data as T;
}

const acct = (cfg: OandaConfig) => `/v3/accounts/${encodeURIComponent(cfg.accountId)}`;

export interface AccountSummary {
  balance: string;
  NAV: string;
  unrealizedPL: string;
  pl: string;
  marginUsed: string;
  marginAvailable: string;
  currency: string;
  openTradeCount: number;
}
export const getSummary = (cfg: OandaConfig) =>
  oanda<{ account: AccountSummary }>(cfg, `${acct(cfg)}/summary`).then((d) => d.account);

export interface Instrument {
  name: string;
  displayName: string;
  type: string;
  displayPrecision: number;
  minimumTradeSize: string;
}
let instrumentCache: { at: number; list: Instrument[] } | null = null;
export async function getInstruments(cfg: OandaConfig): Promise<Instrument[]> {
  if (instrumentCache && Date.now() - instrumentCache.at < 3_600_000) return instrumentCache.list;
  const d = await oanda<{ instruments: Instrument[] }>(cfg, `${acct(cfg)}/instruments`);
  instrumentCache = { at: Date.now(), list: d.instruments };
  return d.instruments;
}

export interface Price {
  instrument: string;
  time: string;
  bids: { price: string }[];
  asks: { price: string }[];
  closeoutBid?: string;
  closeoutAsk?: string;
}
export async function getPricing(cfg: OandaConfig, instruments: string[]): Promise<Price[]> {
  if (instruments.length === 0) return [];
  const d = await oanda<{ prices: Price[] }>(cfg, `${acct(cfg)}/pricing?instruments=${encodeURIComponent(instruments.join(","))}`);
  return d.prices;
}

export interface Trade {
  id: string;
  instrument: string;
  price: string;
  openTime: string;
  currentUnits: string;
  initialUnits: string;
  unrealizedPL?: string;
  realizedPL?: string;
  state: string;
  closeTime?: string;
  averageClosePrice?: string;
}
export const listOpenTrades = (cfg: OandaConfig) =>
  oanda<{ trades: Trade[] }>(cfg, `${acct(cfg)}/openTrades`).then((d) => d.trades);
export const listClosedTrades = (cfg: OandaConfig, count = 50) =>
  oanda<{ trades: Trade[] }>(cfg, `${acct(cfg)}/trades?state=CLOSED&count=${Math.min(Math.max(count, 1), 500)}`).then((d) => d.trades);

async function audit(cfg: OandaConfig, entry: { action: string; instrument?: string; units?: string; request: unknown; ok: boolean; response?: unknown; error?: string }) {
  await prisma.tradeAuditLog
    .create({
      data: {
        environment: cfg.env,
        action: entry.action,
        instrument: entry.instrument ?? null,
        units: entry.units ?? null,
        request: entry.request as object,
        ok: entry.ok,
        response: (entry.response ?? undefined) as object | undefined,
        error: entry.error ?? null,
      },
    })
    .catch((e) => console.error("Trade audit write failed:", e));
}

export interface OrderInput {
  instrument: string;
  side: "BUY" | "SELL";
  units: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
}

/** Validate and send a MARKET order (fill-or-kill). */
export async function placeMarketOrder(cfg: OandaConfig, input: OrderInput) {
  const instruments = await getInstruments(cfg);
  const inst = instruments.find((i) => i.name === input.instrument);
  if (!inst) throw new OandaError("That instrument isn't tradable on this account.", 400);
  if (!Number.isInteger(input.units) || input.units <= 0) throw new OandaError("Units must be a positive whole number.", 400);
  if (input.units > cfg.maxUnits) throw new OandaError(`Above the maximum order size (${cfg.maxUnits} units).`, 400);
  if (input.units < Number(inst.minimumTradeSize)) throw new OandaError(`Below the minimum size (${inst.minimumTradeSize}).`, 400);

  // SL/TP must sit on the right side of the current price for the direction.
  const [px] = await getPricing(cfg, [inst.name]);
  const bid = Number(px?.bids?.[0]?.price);
  const ask = Number(px?.asks?.[0]?.price);
  const entry = input.side === "BUY" ? ask : bid;
  if (input.stopLoss != null && (input.side === "BUY" ? input.stopLoss >= entry : input.stopLoss <= entry)) {
    throw new OandaError(`The stop-loss must be ${input.side === "BUY" ? "below" : "above"} the current price (${entry}).`, 400);
  }
  if (input.takeProfit != null && (input.side === "BUY" ? input.takeProfit <= entry : input.takeProfit >= entry)) {
    throw new OandaError(`The take-profit must be ${input.side === "BUY" ? "above" : "below"} the current price (${entry}).`, 400);
  }
  const fmt = (n: number) => n.toFixed(inst.displayPrecision);
  const units = String(input.side === "BUY" ? input.units : -input.units);
  const body = {
    order: {
      type: "MARKET",
      instrument: inst.name,
      units,
      timeInForce: "FOK",
      positionFill: "DEFAULT",
      ...(input.stopLoss != null ? { stopLossOnFill: { price: fmt(input.stopLoss) } } : {}),
      ...(input.takeProfit != null ? { takeProfitOnFill: { price: fmt(input.takeProfit) } } : {}),
    },
  };
  try {
    const res = await oanda<{ orderFillTransaction?: { id: string; price?: string }; orderCancelTransaction?: { reason?: string } }>(
      cfg,
      `${acct(cfg)}/orders`,
      { method: "POST", body }
    );
    const filled = !!res.orderFillTransaction;
    await audit(cfg, { action: "MARKET_ORDER", instrument: inst.name, units, request: body, ok: filled, response: res, error: filled ? undefined : res.orderCancelTransaction?.reason });
    if (!filled) throw new OandaError(`Order not filled: ${res.orderCancelTransaction?.reason || "cancelled"}`, 409);
    return res.orderFillTransaction!;
  } catch (e) {
    if (!(e instanceof OandaError && e.status === 409)) {
      await audit(cfg, { action: "MARKET_ORDER", instrument: inst.name, units, request: body, ok: false, error: String((e as Error).message) });
    }
    throw e;
  }
}

/** Close a whole trade at market. */
export async function closeTrade(cfg: OandaConfig, tradeId: string) {
  if (!/^\d{1,20}$/.test(tradeId)) throw new OandaError("Invalid trade id.", 400);
  const body = { units: "ALL" };
  try {
    const res = await oanda<{ orderFillTransaction?: { id: string; price?: string; pl?: string } }>(
      cfg,
      `${acct(cfg)}/trades/${tradeId}/close`,
      { method: "PUT", body }
    );
    await audit(cfg, { action: "CLOSE_TRADE", units: "ALL", request: { tradeId, ...body }, ok: true, response: res });
    return res.orderFillTransaction ?? null;
  } catch (e) {
    await audit(cfg, { action: "CLOSE_TRADE", units: "ALL", request: { tradeId, ...body }, ok: false, error: String((e as Error).message) });
    throw e;
  }
}
