"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Users,
  FileText,
  BookOpen,
  Briefcase,
  Mail,
  MessageSquare,
  Globe,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import StatCard from "./charts/StatCard";
import AreaChartCard from "./charts/AreaChartCard";
import BarChartCard from "./charts/BarChartCard";
import PieChartCard from "./charts/PieChartCard";

interface DashboardClientProps {
  usersCount: number;
  postsCount: number;
  publicationsCount: number;
  questionsCount: number;
  serviceRequestsCount: number;
  messagesCount: number;
  totalViews: number;
  recentRequests: Array<{
    id: string;
    name: string;
    serviceType: string;
    status: string;
  }>;
  recentMessages: Array<{
    id: string;
    name: string;
    subject: string;
    isRead: boolean;
  }>;
}

interface AnalyticsData {
  summary: { totalViews: number; uniquePages: number; viewsTrend: number };
  viewsByDay: Array<{ date: string; views: number }>;
  topPages: Array<{ path: string; views: number }>;
  countries: Array<{ country: string; views: number }>;
  devices: Array<{ device: string; views: number }>;
  browsers: Array<{ browser: string; views: number }>;
  referrers: Array<{ referrer: string; views: number }>;
}

interface CommodityData {
  symbol: string;
  name: string;
  unit: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function DashboardClient({
  usersCount,
  postsCount,
  publicationsCount,
  questionsCount,
  serviceRequestsCount,
  messagesCount,
  totalViews,
  recentRequests,
  recentMessages,
}: DashboardClientProps) {
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [topPubs, setTopPubs] = useState<Array<{ title: string; views: number }>>([]);
  const [commodities, setCommodities] = useState<CommodityData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, pubsRes, commoditiesRes] = await Promise.all([
        fetch(`/api/admin/analytics?days=${days}`),
        fetch("/api/admin/analytics/top-publications"),
        fetch("/api/admin/finance/commodities").catch(() => null),
      ]);

      if (analyticsRes.ok) {
        setAnalytics(await analyticsRes.json());
      }
      if (pubsRes.ok) {
        const data = await pubsRes.json();
        setTopPubs(data.publications || []);
      }
      if (commoditiesRes?.ok) {
        const data = await commoditiesRes.json();
        setCommodities(data.commodities || []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const periodButtons = [
    { label: "7d", value: 7 },
    { label: "30d", value: 30 },
    { label: "90d", value: 90 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text">
          Dashboard
        </h1>
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
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Page Views"
          value={analytics?.summary.totalViews ?? totalViews}
          icon={Eye}
          color="text-cyan-400"
          trend={analytics?.summary.viewsTrend}
        />
        <StatCard label="Users" value={usersCount} icon={Users} color="text-blue-400" />
        <StatCard label="Blog Posts" value={postsCount} icon={FileText} color="text-green-400" />
        <StatCard label="Publications" value={publicationsCount} icon={BookOpen} color="text-amber-400" />
        <StatCard
          label="Service Requests"
          value={serviceRequestsCount}
          icon={Briefcase}
          color="text-purple-400"
        />
        <StatCard label="Unread Messages" value={messagesCount} icon={Mail} color="text-red-400" />
        <StatCard label="Questions" value={questionsCount} icon={MessageSquare} color="text-gold" />
        <StatCard
          label="Unique Pages"
          value={analytics?.summary.uniquePages ?? 0}
          icon={Globe}
          color="text-teal-400"
        />
      </div>

      {loading && !analytics ? (
        <div className="glass rounded-xl p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Traffic Area Chart */}
          <div className="mb-6">
            <AreaChartCard
              title="Traffic Over Time"
              data={analytics?.viewsByDay || []}
            />
          </div>

          {/* Two-column: Top Pages + Devices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <BarChartCard
              title="Top Pages"
              data={(analytics?.topPages || []).map((p) => ({
                name: p.path.length > 30 ? p.path.slice(0, 30) + "…" : p.path,
                value: p.views,
              }))}
            />
            <PieChartCard
              title="Devices"
              data={(analytics?.devices || []).map((d) => ({
                name: d.device || "Unknown",
                value: d.views,
              }))}
            />
          </div>

          {/* Two-column: Top Publications + Countries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <BarChartCard
              title="Top Publications"
              data={topPubs.map((p) => ({
                name: p.title.length > 30 ? p.title.slice(0, 30) + "…" : p.title,
                value: p.views,
              }))}
              color="#3b82f6"
            />
            <PieChartCard
              title="Countries"
              data={(analytics?.countries || []).map((c) => ({
                name: c.country || "Unknown",
                value: c.views,
              }))}
            />
          </div>

          {/* Commodity Ticker */}
          {commodities.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Market Prices</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {commodities.map((c) => (
                  <div key={c.symbol} className="glass rounded-lg p-3">
                    <p className="text-xs text-text-secondary mb-1">{c.name}</p>
                    <p className="text-lg font-bold">${c.price.toFixed(2)}</p>
                    <div
                      className={`flex items-center gap-1 text-xs ${
                        c.change >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {c.change >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{c.changePercent.toFixed(2)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Service Requests</h2>
          {recentRequests.length === 0 ? (
            <p className="text-text-secondary text-sm">No requests yet.</p>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-navy/50"
                >
                  <div>
                    <p className="text-sm font-medium">{req.name}</p>
                    <p className="text-text-muted text-xs">{req.serviceType}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      req.status === "PENDING"
                        ? "bg-gold/10 text-gold"
                        : req.status === "IN_PROGRESS"
                        ? "bg-blue-500/10 text-blue-400"
                        : req.status === "COMPLETED"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Messages</h2>
          {recentMessages.length === 0 ? (
            <p className="text-text-secondary text-sm">No messages yet.</p>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <div key={msg.id} className="p-3 rounded-lg bg-navy/50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{msg.name}</p>
                    {!msg.isRead && (
                      <span className="w-2 h-2 rounded-full bg-gold" />
                    )}
                  </div>
                  <p className="text-text-secondary text-xs truncate">{msg.subject}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
