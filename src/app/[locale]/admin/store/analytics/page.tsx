"use client";

import { useState, useEffect } from "react";
import { DollarSign, ShoppingBag, Download, TrendingUp } from "lucide-react";
import StatCard from "@/components/admin/charts/StatCard";
import AreaChartCard from "@/components/admin/charts/AreaChartCard";
import BarChartCard from "@/components/admin/charts/BarChartCard";
import PieChartCard from "@/components/admin/charts/PieChartCard";
import { formatPrice } from "@/lib/utils";

interface Analytics {
  summary: {
    totalRevenueCents: number;
    paidOrders: number;
    unitsSold: number;
    totalDownloads: number;
    avgOrderValueCents: number;
  };
  ordersByStatus: { name: string; value: number }[];
  revenueByDay: { date: string; revenueCents: number }[];
  topBooksByUnits: { name: string; value: number }[];
  topBooksByRevenue: { name: string; value: number }[];
}

export default function AdminStoreAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/store/analytics?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && setData(d))
      .catch(() => active && setData(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [days]);

  if (loading) return <div className="text-text-secondary">Loading analytics…</div>;
  if (!data) return <div className="text-text-secondary">No analytics available.</div>;

  const revenueSeries = data.revenueByDay.map((d) => ({
    date: d.date,
    views: Math.round(d.revenueCents / 100),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-gold" />
          Bookstore Analytics
        </h1>
        <div className="flex gap-2">
          {[7, 30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                days === d
                  ? "bg-gold text-charcoal font-medium"
                  : "border border-glass-border text-text-secondary hover:border-gold/50"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total revenue"
          value={formatPrice(data.summary.totalRevenueCents)}
          icon={DollarSign}
          color="text-green-400"
        />
        <StatCard
          label="Paid orders"
          value={data.summary.paidOrders}
          icon={ShoppingBag}
          color="text-gold"
        />
        <StatCard
          label="Units sold"
          value={data.summary.unitsSold}
          icon={ShoppingBag}
          color="text-blue-400"
        />
        <StatCard
          label="Downloads"
          value={data.summary.totalDownloads}
          icon={Download}
          color="text-purple-400"
        />
      </div>

      <div className="mb-6">
        <AreaChartCard title={`Revenue (USD) — last ${days} days`} data={revenueSeries} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <BarChartCard title="Top books by units sold" data={data.topBooksByUnits} />
        <BarChartCard
          title="Top books by revenue (USD)"
          data={data.topBooksByRevenue}
          color="#22c55e"
        />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <PieChartCard title="Orders by status" data={data.ordersByStatus} />
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Average order value</h3>
          <p className="text-3xl font-bold text-gold">
            {formatPrice(data.summary.avgOrderValueCents)}
          </p>
          <p className="text-text-secondary text-sm mt-2">
            Across {data.summary.paidOrders} paid orders.
          </p>
        </div>
      </div>
    </div>
  );
}
