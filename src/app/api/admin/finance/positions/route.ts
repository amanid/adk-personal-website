import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";
import { findPreset, isValidSymbol } from "@/lib/instruments";
import { fetchChartQuote } from "@/lib/yahoo-chart";
import { valuePosition } from "@/lib/market-stats";
import { getCached, setCache } from "@/lib/cache";

export const runtime = "nodejs";
export const maxDuration = 60;

const QUOTE_TTL = 5 * 60 * 1000;

async function adminOnly() {
  const session = await auth();
  const ok = session && (session.user as { role?: string })?.role === "ADMIN";
  return ok ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Positions, marked to market.
 *
 * Bookkeeping only — recording a position here places no order anywhere. An
 * open position is valued against its live quote; a closed one against the
 * price it was closed at, so history stays fixed once realised.
 *
 * Totals are summed as plain numbers with no FX conversion, so they are only
 * meaningful when the positions share a currency. The response reports the
 * distinct currencies so the UI can say so rather than implying a single total.
 */
export async function GET() {
  const denied = await adminOnly();
  if (denied) return denied;

  try {
    const positions = await prisma.position.findMany({
      orderBy: [{ closedAt: "asc" }, { openedAt: "desc" }],
    });

    const rows = await Promise.all(
      positions.map(async (p) => {
        let currentPrice: number | null = p.closePrice ?? null;

        if (!p.closedAt) {
          const key = `q:${p.symbol}`;
          let quote = getCached<Awaited<ReturnType<typeof fetchChartQuote>>>(key);
          if (quote === null || quote === undefined) {
            quote = await fetchChartQuote(p.symbol, 10000).catch(() => null);
            if (quote) setCache(key, quote, QUOTE_TTL);
          }
          currentPrice = quote?.price ?? null;
        }

        return {
          ...p,
          currentPrice,
          isOpen: p.closedAt === null,
          valuation: valuePosition(p.quantity, p.entryPrice, currentPrice),
          /** True when an open position could not be priced right now. */
          stale: p.closedAt === null && currentPrice === null,
        };
      })
    );

    const open = rows.filter((r) => r.isOpen);
    const currencies = [...new Set(rows.map((r) => r.currency))];

    return NextResponse.json({
      positions: rows,
      totals: {
        costBasis: open.reduce((s, r) => s + (r.valuation?.costBasis ?? 0), 0),
        marketValue: open.reduce((s, r) => s + (r.valuation?.marketValue ?? 0), 0),
        profitLoss: open.reduce((s, r) => s + (r.valuation?.profitLoss ?? 0), 0),
        realised: rows
          .filter((r) => !r.isOpen)
          .reduce((s, r) => s + (r.valuation?.profitLoss ?? 0), 0),
        openCount: open.length,
        currencies,
        /** Totals only add up when everything is quoted the same way. */
        mixedCurrency: currencies.length > 1,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Positions GET error:", error);
    return NextResponse.json({ error: "Could not load positions" }, { status: 500 });
  }
}

/**
 * Record a position.
 *
 * Accepts either an explicit `quantity`, or a `stake` in quote currency which
 * is converted to a quantity at the entry price — the natural way to express
 * "put $50 into crude" without working out the fraction of a barrel by hand.
 */
export async function POST(request: Request) {
  const denied = await adminOnly();
  if (denied) return denied;

  try {
    const body = await request.json();
    const symbol = String(body?.symbol || "").trim().toUpperCase();

    if (!symbol || !isValidSymbol(symbol)) {
      return NextResponse.json({ error: "Enter a valid ticker symbol." }, { status: 400 });
    }

    // Entry price: use the one given, else the live quote.
    let entryPrice = Number(body?.entryPrice);
    let currency = typeof body?.currency === "string" ? body.currency : null;

    if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
      const quote = await fetchChartQuote(symbol, 10000);
      if (!quote || quote.price === null) {
        return NextResponse.json(
          { error: `No price available for "${symbol}". Enter an entry price manually.` },
          { status: 404 }
        );
      }
      entryPrice = quote.price;
      currency = currency || quote.currency || "USD";
    }

    let quantity = Number(body?.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      const stake = Number(body?.stake);
      if (!Number.isFinite(stake) || stake <= 0) {
        return NextResponse.json(
          { error: "Give either a quantity or a stake amount." },
          { status: 400 }
        );
      }
      quantity = stake / entryPrice;
    }

    const preset = findPreset(symbol);
    const openedAt = body?.openedAt ? new Date(body.openedAt) : new Date();
    if (Number.isNaN(openedAt.getTime())) {
      return NextResponse.json({ error: "Invalid opening date." }, { status: 400 });
    }

    const position = await prisma.position.create({
      data: {
        symbol,
        name: sanitizeInput(String(body?.name || preset?.name || symbol)).slice(0, 120),
        quantity,
        entryPrice,
        currency: (currency || "USD").slice(0, 8),
        openedAt,
        notes: body?.notes ? sanitizeInput(String(body.notes)).slice(0, 500) : null,
      },
    });

    return NextResponse.json({ position });
  } catch (error) {
    console.error("Positions POST error:", error);
    return NextResponse.json({ error: "Could not record the position" }, { status: 500 });
  }
}
