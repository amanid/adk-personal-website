"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslations } from "next-intl";

interface Commodity {
  symbol: string;
  name: string;
  unit: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
}

export default function MarketTicker() {
  const t = useTranslations("market");
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    fetch("/api/market/commodities")
      .then((r) => r.json())
      .then((data) => {
        if (data.commodities) setCommodities(data.commodities);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || commodities.length === 0) return null;

  const tickerItems = [...commodities, ...commodities];

  return (
    <div className="w-full glass-strong overflow-hidden py-3">
      <div className="flex items-center">
        <span className="shrink-0 px-4 text-xs font-semibold text-gold uppercase tracking-wider border-r border-glass-border">
          {t("live")}
        </span>
        <div className="overflow-hidden flex-1 group/ticker">
          <div className="animate-ticker group-hover/ticker:[animation-play-state:paused] flex items-center gap-8 whitespace-nowrap">
            {tickerItems.map((commodity, index) => {
              const hasData = commodity.price !== null && commodity.price !== 0;
              const isPositive = (commodity.changePercent ?? 0) >= 0;
              return (
                <div key={`${commodity.symbol}-${index}`} className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium text-text-primary">
                    {commodity.name}
                  </span>
                  <span className="text-sm font-semibold text-gold">
                    {hasData
                      ? `$${commodity.price!.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "N/A"
                    }
                  </span>
                  {hasData && commodity.changePercent !== null ? (
                    <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {isPositive ? "+" : ""}
                      {commodity.changePercent.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-400">--</span>
                  )}
                  <span className="text-text-muted text-[10px]">
                    {commodity.unit}
                  </span>
                  {index < tickerItems.length - 1 && (
                    <span className="text-text-muted mx-2">|</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
