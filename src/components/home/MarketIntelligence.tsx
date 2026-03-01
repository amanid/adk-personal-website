"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react";
import { useTranslations } from "next-intl";

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

export default function MarketIntelligence() {
  const t = useTranslations("market");
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [indices, setIndices] = useState<BRVMIndex[]>([]);
  const [fetchedAt, setFetchedAt] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/market/commodities").then((r) => r.json()).catch(() => null),
      fetch("/api/market/brvm").then((r) => r.json()).catch(() => null),
    ]).then(([commData, brvmData]) => {
      if (commData?.commodities) {
        setCommodities(commData.commodities);
        setFetchedAt(commData.fetchedAt);
      }
      if (brvmData?.indices) {
        setIndices(brvmData.indices);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <section className="section-padding">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-navy-light rounded w-20 mb-3" />
                <div className="h-8 bg-navy-light rounded w-32 mb-2" />
                <div className="h-3 bg-navy-light rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (commodities.length === 0) return null;

  return (
    <section className="section-padding">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <BarChart3 className="w-6 h-6 text-gold" />
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] gradient-text">
              {t("title")}
            </h2>
          </div>
          <p className="text-text-secondary max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Commodity Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {commodities.map((commodity, index) => {
            const isPositive = commodity.changePercent >= 0;
            return (
              <motion.div
                key={commodity.symbol}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="glass rounded-xl p-5 hover:border-gold/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-text-secondary">
                    {commodity.name}
                  </span>
                  <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {isPositive ? "+" : ""}
                    {commodity.changePercent.toFixed(2)}%
                  </span>
                </div>
                <p className="text-2xl font-bold gradient-text font-[family-name:var(--font-display)]">
                  ${commodity.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-text-muted mt-1">{commodity.unit}</p>
              </motion.div>
            );
          })}
        </div>

        {/* BRVM Indices */}
        {indices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-gold" />
              <h3 className="text-lg font-semibold">{t("brvm_title")}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {indices.map((idx, i) => {
                const changeVal = parseFloat(idx.change);
                const isPositive = !isNaN(changeVal) && changeVal >= 0;
                return (
                  <motion.div
                    key={idx.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="glass rounded-xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-secondary">{idx.name}</p>
                      <p className="text-lg font-bold">{idx.value}</p>
                    </div>
                    <span className={`text-sm font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                      {idx.change}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Last updated */}
        {fetchedAt && (
          <p className="text-xs text-text-muted text-center mt-6">
            {t("last_updated")}: {new Date(fetchedAt).toLocaleString()}
          </p>
        )}
      </div>
    </section>
  );
}
