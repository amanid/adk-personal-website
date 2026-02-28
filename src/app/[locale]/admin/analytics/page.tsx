"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, Globe, RefreshCw } from "lucide-react";
import StatCard from "@/components/admin/charts/StatCard";
import AreaChartCard from "@/components/admin/charts/AreaChartCard";
import BarChartCard from "@/components/admin/charts/BarChartCard";
import PieChartCard from "@/components/admin/charts/PieChartCard";

interface AnalyticsData {
  summary: { totalViews: number; uniquePages: number; viewsTrend: number };
  viewsByDay: Array<{ date: string; views: number }>;
  topPages: Array<{ path: string; views: number }>;
  countries: Array<{ country: string; views: number }>;
  devices: Array<{ device: string; views: number }>;
  browsers: Array<{ browser: string; views: number }>;
  referrers: Array<{ referrer: string; views: number }>;
  recentViews: Array<{
    path: string;
    country: string | null;
    device: string | null;
    browser: string | null;
    createdAt: string;
  }>;
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const periodButtons = [
    { label: "7d", value: 7 },
    { label: "30d", value: 30 },
    { label: "90d", value: 90 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text">
          Analytics
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 glass rounded-lg p-1">
            {periodButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setDays(btn.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  days === btn.value
                    ? "bg-gold/20 text-gold font-medium"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg text-sm text-text-secondary hover:text-gold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="glass rounded-xl p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard
              label="Total Views"
              value={data?.summary.totalViews ?? 0}
              icon={Eye}
              color="text-cyan-400"
              trend={data?.summary.viewsTrend}
            />
            <StatCard
              label="Unique Pages"
              value={data?.summary.uniquePages ?? 0}
              icon={Globe}
              color="text-teal-400"
            />
            <StatCard
              label="Avg Views/Day"
              value={
                data?.viewsByDay.length
                  ? Math.round(
                      data.viewsByDay.reduce((s, d) => s + d.views, 0) /
                        data.viewsByDay.length
                    )
                  : 0
              }
              icon={Eye}
              color="text-amber-400"
            />
          </div>

          {/* Traffic Over Time */}
          <div className="mb-6">
            <AreaChartCard title="Traffic Over Time" data={data?.viewsByDay || []} />
          </div>

          {/* Top Pages + Devices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <BarChartCard
              title="Top Pages"
              data={(data?.topPages || []).map((p) => ({
                name: p.path.length > 30 ? p.path.slice(0, 30) + "…" : p.path,
                value: p.views,
              }))}
            />
            <PieChartCard
              title="Devices"
              data={(data?.devices || []).map((d) => ({
                name: d.device || "Unknown",
                value: d.views,
              }))}
            />
          </div>

          {/* Browsers + Countries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <PieChartCard
              title="Browsers"
              data={(data?.browsers || []).map((b) => ({
                name: b.browser || "Unknown",
                value: b.views,
              }))}
            />
            <PieChartCard
              title="Countries"
              data={(data?.countries || []).map((c) => ({
                name: c.country || "Unknown",
                value: c.views,
              }))}
            />
          </div>

          {/* Referrers Table */}
          {(data?.referrers?.length ?? 0) > 0 && (
            <div className="glass rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Top Referrers</h3>
              <div className="space-y-2">
                {data!.referrers.map((r) => (
                  <div
                    key={r.referrer}
                    className="flex items-center justify-between p-3 rounded-lg bg-navy/50"
                  >
                    <p className="text-sm truncate max-w-[80%]">{r.referrer}</p>
                    <span className="text-sm font-medium text-gold">{r.views}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Views Table */}
          {(data?.recentViews?.length ?? 0) > 0 && (
            <div className="glass rounded-xl overflow-hidden">
              <div className="p-6 pb-0">
                <h3 className="text-lg font-semibold mb-4">Recent Views</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-glass-border">
                      <th className="text-left p-3 text-text-secondary font-medium">Path</th>
                      <th className="text-left p-3 text-text-secondary font-medium">Country</th>
                      <th className="text-left p-3 text-text-secondary font-medium">Device</th>
                      <th className="text-left p-3 text-text-secondary font-medium">Browser</th>
                      <th className="text-right p-3 text-text-secondary font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.recentViews.map((view, i) => (
                      <tr
                        key={i}
                        className="border-b border-glass-border/50 hover:bg-gold/5 transition-colors"
                      >
                        <td className="p-3 font-medium truncate max-w-[200px]">{view.path}</td>
                        <td className="p-3 text-text-secondary">{view.country || "—"}</td>
                        <td className="p-3 text-text-secondary">{view.device || "—"}</td>
                        <td className="p-3 text-text-secondary">{view.browser || "—"}</td>
                        <td className="p-3 text-right text-text-secondary">
                          {new Date(view.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
