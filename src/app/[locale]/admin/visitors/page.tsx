"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Eye,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
} from "lucide-react";
import StatCard from "@/components/admin/charts/StatCard";

interface Visit {
  id: string;
  path: string;
  referrer: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  sessionId: string | null;
  createdAt: string;
}

interface VisitorsResponse {
  visits: Visit[];
  total: number;
  page: number;
  totalPages: number;
  summary: { totalVisits: number; uniqueVisitors: number; uniquePaths: number };
  facets: {
    devices: { value: string | null; count: number }[];
    countries: { value: string | null; count: number }[];
  };
}

const deviceIcon = (d: string | null) =>
  d === "mobile" ? Smartphone : d === "tablet" ? Tablet : Monitor;

export default function AdminVisitorsPage() {
  const [data, setData] = useState<VisitorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [device, setDevice] = useState("");
  const [country, setCountry] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // Debounce the path search.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        days: String(days),
        page: String(page),
        limit: "50",
      });
      if (device) params.set("device", device);
      if (country) params.set("country", country);
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/visitors?${params}`);
      if (res.ok) setData(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [days, page, device, country, q]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetPageThen = (fn: () => void) => {
    setPage(1);
    fn();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-gold" />
          Visitors
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Individual visits to your site (excludes admin pages). Country/city appear when your
          host provides geo headers.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label={`Unique visitors (${days}d)`}
          value={data?.summary.uniqueVisitors ?? 0}
          icon={Users}
          color="text-gold"
        />
        <StatCard
          label={`Total visits (${days}d)`}
          value={data?.summary.totalVisits ?? 0}
          icon={Eye}
          color="text-blue-400"
        />
        <StatCard
          label="Pages visited"
          value={data?.summary.uniquePaths ?? 0}
          icon={FileText}
          color="text-green-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => resetPageThen(() => setDays(d))}
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

        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search page path…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
          />
        </div>

        <select
          value={device}
          onChange={(e) => resetPageThen(() => setDevice(e.target.value))}
          className="px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
        >
          <option value="">All devices</option>
          {data?.facets.devices.map((d) => (
            <option key={d.value} value={d.value ?? ""}>
              {d.value} ({d.count})
            </option>
          ))}
        </select>

        {data && data.facets.countries.length > 0 && (
          <select
            value={country}
            onChange={(e) => resetPageThen(() => setCountry(e.target.value))}
            className="px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
          >
            <option value="">All countries</option>
            {data.facets.countries.map((c) => (
              <option key={c.value} value={c.value ?? ""}>
                {c.value} ({c.count})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      {loading && !data ? (
        <div className="text-text-secondary py-12 text-center">Loading…</div>
      ) : !data || data.visits.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-text-secondary">
          No visits recorded for this period yet.
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-secondary text-left border-b border-glass-border">
                  <th className="p-3 font-medium">When</th>
                  <th className="p-3 font-medium">Page</th>
                  <th className="p-3 font-medium">Location</th>
                  <th className="p-3 font-medium">Device</th>
                  <th className="p-3 font-medium">Browser / OS</th>
                  <th className="p-3 font-medium">Source</th>
                  <th className="p-3 font-medium">Visitor</th>
                </tr>
              </thead>
              <tbody>
                {data.visits.map((v) => {
                  const DIcon = deviceIcon(v.device);
                  const ref = v.referrer
                    ? (() => {
                        try {
                          return new URL(v.referrer!).hostname;
                        } catch {
                          return v.referrer;
                        }
                      })()
                    : "Direct";
                  return (
                    <tr key={v.id} className="border-b border-glass-border/40 hover:bg-white/[0.02]">
                      <td className="p-3 whitespace-nowrap text-text-secondary">
                        {new Date(v.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 max-w-[220px] truncate" title={v.path}>
                        {v.path}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-text-muted" />
                          {[v.city, v.country].filter(Boolean).join(", ") || "—"}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 capitalize">
                          <DIcon className="w-3.5 h-3.5 text-text-muted" />
                          {v.device || "—"}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-text-secondary">
                        {[v.browser, v.os].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="p-3 max-w-[160px] truncate" title={v.referrer || "Direct"}>
                        {ref}
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono text-xs text-text-muted">
                        {v.sessionId ? v.sessionId.slice(0, 8) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-3 border-t border-glass-border text-sm">
            <span className="text-text-secondary">
              Page {data.page} of {data.totalPages} · {data.total} visits
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="p-2 rounded-lg border border-glass-border disabled:opacity-40 hover:border-gold/50 transition-all"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={data.page >= data.totalPages}
                className="p-2 rounded-lg border border-glass-border disabled:opacity-40 hover:border-gold/50 transition-all"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
