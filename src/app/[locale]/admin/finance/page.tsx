"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Clock,
} from "lucide-react";

interface Commodity {
  symbol: string;
  name: string;
  unit: string;
  price: number;
  change: number;
  changePercent: number;
}

interface BRVMIndex {
  name: string;
  value: string;
  change: string;
}

interface BRVMStock {
  symbol: string;
  name: string;
  price: string;
  change: string;
  volume: string;
}

const TRADINGVIEW_SYMBOLS = [
  { symbol: "CC1!", name: "Cocoa" },
  { symbol: "KC1!", name: "Coffee" },
  { symbol: "GC1!", name: "Gold" },
  { symbol: "CL1!", name: "Crude Oil" },
];

export default function FinancePage() {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [brvmIndices, setBrvmIndices] = useState<BRVMIndex[]>([]);
  const [brvmStocks, setBrvmStocks] = useState<BRVMStock[]>([]);
  const [commoditiesFetchedAt, setCommoditiesFetchedAt] = useState("");
  const [brvmFetchedAt, setBrvmFetchedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const widgetRefs = useRef<(HTMLDivElement | null)[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [commoditiesRes, brvmRes] = await Promise.all([
        fetch("/api/admin/finance/commodities"),
        fetch("/api/admin/finance/brvm"),
      ]);

      if (commoditiesRes.ok) {
        const data = await commoditiesRes.json();
        setCommodities(data.commodities || []);
        setCommoditiesFetchedAt(data.fetchedAt || "");
      }

      if (brvmRes.ok) {
        const data = await brvmRes.json();
        setBrvmIndices(data.indices || []);
        setBrvmStocks(data.stocks || []);
        setBrvmFetchedAt(data.fetchedAt || "");
      }
    } catch (err) {
      console.error("Finance fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // TradingView widgets
  useEffect(() => {
    if (typeof window === "undefined") return;

    const cleanups: Array<() => void> = [];

    TRADINGVIEW_SYMBOLS.forEach((item, index) => {
      const container = widgetRefs.current[index];
      if (!container) return;

      container.innerHTML = "";

      const widgetDiv = document.createElement("div");
      widgetDiv.className = "tradingview-widget-container__widget";
      widgetDiv.style.height = "100%";
      widgetDiv.style.width = "100%";
      container.appendChild(widgetDiv);

      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        symbol: item.symbol,
        width: "100%",
        height: "100%",
        locale: "en",
        dateRange: "1M",
        colorTheme: "dark",
        isTransparent: true,
        autosize: true,
        largeChartUrl: "",
      });

      container.appendChild(script);

      cleanups.push(() => {
        container.innerHTML = "";
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [loading]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatTime = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text">
          Financial Markets
        </h1>
        <div className="flex items-center gap-3">
          {commoditiesFetchedAt && (
            <span className="text-text-secondary text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated {formatTime(commoditiesFetchedAt)}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg text-sm text-text-secondary hover:text-gold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Commodity Cards */}
      <h2 className="text-lg font-semibold mb-3">Commodity Prices</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {commodities.map((c) => (
          <div key={c.symbol} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{c.name}</h3>
              <span className="text-text-secondary text-xs">{c.unit}</span>
            </div>
            <p className="text-2xl font-bold mb-1">
              ${c.price > 0 ? c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "N/A"}
            </p>
            {c.price > 0 && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  c.change >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {c.change >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                  {c.change >= 0 ? "+" : ""}
                  {c.change.toFixed(2)} ({c.changePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* TradingView Widgets */}
      <h2 className="text-lg font-semibold mb-3">Price Charts</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {TRADINGVIEW_SYMBOLS.map((item, index) => (
          <div key={item.symbol} className="glass rounded-xl p-4">
            <h3 className="text-sm font-medium mb-2 text-text-secondary">{item.name}</h3>
            <div
              ref={(el) => { widgetRefs.current[index] = el; }}
              className="h-[200px] overflow-hidden rounded-lg"
            />
          </div>
        ))}
      </div>

      {/* BRVM Section */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">BRVM - Bourse Régionale</h2>
        {brvmFetchedAt && (
          <span className="text-text-secondary text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(brvmFetchedAt)}
          </span>
        )}
      </div>

      {/* BRVM Indices */}
      {brvmIndices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {brvmIndices.map((idx) => (
            <div key={idx.name} className="glass rounded-xl p-5">
              <p className="text-text-secondary text-sm mb-1">{idx.name}</p>
              <p className="text-xl font-bold">{idx.value}</p>
              <p
                className={`text-sm ${
                  idx.change.startsWith("-") ? "text-red-400" : "text-green-400"
                }`}
              >
                {idx.change}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* BRVM Top Stocks */}
      {brvmStocks.length > 0 && (
        <div className="glass rounded-xl overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left p-3 text-text-secondary font-medium">Symbol</th>
                  <th className="text-left p-3 text-text-secondary font-medium">Name</th>
                  <th className="text-right p-3 text-text-secondary font-medium">Price</th>
                  <th className="text-right p-3 text-text-secondary font-medium">Change</th>
                  <th className="text-right p-3 text-text-secondary font-medium">Volume</th>
                </tr>
              </thead>
              <tbody>
                {brvmStocks.map((stock) => (
                  <tr
                    key={stock.symbol}
                    className="border-b border-glass-border/50 hover:bg-gold/5 transition-colors"
                  >
                    <td className="p-3 font-medium">{stock.symbol}</td>
                    <td className="p-3 text-text-secondary">{stock.name}</td>
                    <td className="p-3 text-right">{stock.price}</td>
                    <td
                      className={`p-3 text-right ${
                        stock.change.startsWith("-") ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      {stock.change}
                    </td>
                    <td className="p-3 text-right text-text-secondary">{stock.volume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <h2 className="text-lg font-semibold mb-3">Quick Links</h2>
      <div className="flex flex-wrap gap-3">
        <a
          href="https://www.abidjan.net/bourse/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 glass rounded-lg px-4 py-2.5 text-sm text-text-secondary hover:text-gold transition-colors"
        >
          Abidjan.net Finance <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href="https://www.brvm.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 glass rounded-lg px-4 py-2.5 text-sm text-text-secondary hover:text-gold transition-colors"
        >
          BRVM.org <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
