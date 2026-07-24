"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Download, TrendingUp, DollarSign } from "lucide-react";
import StatCard from "@/components/admin/charts/StatCard";
import AreaChartCard from "@/components/admin/charts/AreaChartCard";
import BarChartCard from "@/components/admin/charts/BarChartCard";
import PieChartCard from "@/components/admin/charts/PieChartCard";
import { formatMoney } from "@/lib/currency";

interface RevenueByCurrency {
  currency: string;
  cents: number;
  orders: number;
  avgCents: number;
}

interface Analytics {
  revenueByCurrency: RevenueByCurrency[];
  primaryCurrency: string;
  summary: { paidOrders: number; unitsSold: number; totalDownloads: number };
  ordersByStatus: { name: string; value: number }[];
  revenueByDay: { date: string; views: number }[];
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

      {/* Count tiles (currency-agnostic) */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Paid orders" value={data.summary.paidOrders} icon={ShoppingBag} color="text-gold" />
        <StatCard label="Units sold" value={data.summary.unitsSold} icon={ShoppingBag} color="text-blue-400" />
        <StatCard label="Downloads" value={data.summary.totalDownloads} icon={Download} color="text-purple-400" />
      </div>

      {/* Revenue by currency */}
      <div className="glass rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          Revenue by currency
        </h3>
        {data.revenueByCurrency.length === 0 ? (
          <p className="text-text-secondary text-sm">No paid orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-secondary text-left border-b border-glass-border">
                  <th className="py-2 font-medium">Currency</th>
                  <th className="py-2 font-medium text-right">Revenue</th>
                  <th className="py-2 font-medium text-right">Orders</th>
                  <th className="py-2 font-medium text-right">Avg. order</th>
                </tr>
              </thead>
              <tbody>
                {data.revenueByCurrency.map((r) => (
                  <tr key={r.currency} className="border-b border-glass-border/40">
                    <td className="py-2.5 font-medium">{r.currency}</td>
                    <td className="py-2.5 text-right font-semibold text-gold">
                      {formatMoney(r.cents, r.currency)}
                    </td>
                    <td className="py-2.5 text-right text-text-secondary">{r.orders}</td>
                    <td className="py-2.5 text-right text-text-secondary">
                      {formatMoney(r.avgCents, r.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-6">
        <AreaChartCard
          title={`Revenue (${data.primaryCurrency}) — last ${days} days`}
          data={data.revenueByDay}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <BarChartCard title="Top books by units sold" data={data.topBooksByUnits} />
        <BarChartCard
          title={`Top books by revenue (${data.primaryCurrency})`}
          data={data.topBooksByRevenue}
          color="#22c55e"
        />
      </div>

      <div className="mt-6">
        <PieChartCard title="Orders by status" data={data.ordersByStatus} />
      </div>
    </div>
  );
}
