"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Clock,
  BarChart3,
  Activity,
  Percent,
  Layers,
} from "lucide-react";
import StatCard from "@/components/admin/charts/StatCard";
import SparklineChart from "@/components/admin/charts/SparklineChart";
import CommodityPriceChart from "@/components/admin/charts/CommodityPriceChart";

interface Commodity {
  symbol: string;
  name: string;
  unit: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
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

interface HistoryPoint {
  date: string;
  close: number;
}

export default function FinancePage() {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [brvmIndices, setBrvmIndices] = useState<BRVMIndex[]>([]);
  const [brvmStocks, setBrvmStocks] = useState<BRVMStock[]>([]);
  const [historyData, setHistoryData] = useState<Record<string, HistoryPoint[]>>({});
  const [commoditiesFetchedAt, setCommoditiesFetchedAt] = useState("");
  const [brvmFetchedAt, setBrvmFetchedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [commoditiesRes, brvmRes, historyRes] = await Promise.all([
        fetch("/api/admin/finance/commodities"),
        fetch("/api/admin/finance/brvm"),
        fetch("/api/admin/finance/history"),
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

      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistoryData(data.history || {});
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

  // Computed stats (only count commodities with valid data)
  const validCommodities = commodities.filter((c) => c.price !== null && c.price !== 0);
  const trendingUp = validCommodities.filter((c) => (c.changePercent ?? 0) > 0).length;
  const avgChange =
    validCommodities.length > 0
      ? validCommodities.reduce((sum, c) => sum + Math.abs(c.changePercent ?? 0), 0) / validCommodities.length
      : 0;

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

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Commodities Tracked"
          value={commodities.length}
          icon={Layers}
          color="text-gold"
        />
        <StatCard
          label="Trending Up"
          value={trendingUp}
          icon={TrendingUp}
          color="text-green-400"
        />
        <StatCard
          label="Avg Change %"
          value={`${avgChange.toFixed(2)}%`}
          icon={Percent}
          color="text-cyan-400"
        />
        <StatCard
          label="BRVM Stocks"
          value={brvmStocks.length}
          icon={BarChart3}
          color="text-purple-400"
        />
      </div>

      {/* Commodity Cards with Sparklines */}
      <h2 className="text-lg font-semibold mb-3">Commodity Prices</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {commodities.map((c) => {
          const hasData = c.price !== null && c.price !== 0;
          const isPositive = (c.changePercent ?? 0) >= 0;
          const sparkData = (historyData[c.symbol] || []).map((p) => ({
            date: p.date,
            value: p.close,
          }));
          return (
            <div key={c.symbol} className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{c.name}</h3>
                <span className="text-text-secondary text-xs">{c.unit}</span>
              </div>
              <p className="text-2xl font-bold mb-1">
                {hasData ? `$${c.price!.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A"}
              </p>
              {hasData && c.change !== null && c.changePercent !== null ? (
                <div
                  className={`flex items-center gap-1 text-sm ${
                    isPositive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>
                    {isPositive ? "+" : ""}
                    {c.change.toFixed(2)} ({c.changePercent.toFixed(2)}%)
                  </span>
                </div>
              ) : !hasData ? (
                <p className="text-xs text-yellow-400">Unavailable</p>
              ) : null}
              {hasData && sparkData.length >= 2 && (
                <div className="mt-3 -mx-1">
                  <SparklineChart
                    data={sparkData}
                    positive={isPositive}
                    height={40}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Price Charts */}
      <h2 className="text-lg font-semibold mb-3">Price Charts</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {commodities.map((c) => (
          <CommodityPriceChart
            key={c.symbol}
            title={c.name}
            symbol={c.symbol}
            data={historyData[c.symbol] || []}
          />
        ))}
      </div>

      {/* BRVM Section */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">BRVM - Bourse R&eacute;gionale</h2>
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
              {idx.change && (
                <p
                  className={`text-sm ${
                    idx.change.startsWith("-") ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {idx.change}
                </p>
              )}
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
                        stock.change.startsWith("-") ? "text-red-400" : stock.change === "+0" ? "text-text-secondary" : "text-green-400"
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
