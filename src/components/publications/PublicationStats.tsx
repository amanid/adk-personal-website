"use client";

import { BookOpen, Eye, Download, Star, FileText, Users } from "lucide-react";

interface PublicationStatsProps {
  totalPublications: number;
  totalViews: number;
  totalDownloads: number;
  totalCitations: number;
  featuredCount: number;
  typeBreakdown: { type: string; count: number }[];
}

export default function PublicationStats({
  totalPublications,
  totalViews,
  totalDownloads,
  totalCitations,
  featuredCount,
}: PublicationStatsProps) {
  const stats = [
    { label: "Publications", value: totalPublications, icon: BookOpen, color: "text-gold" },
    { label: "Total Views", value: totalViews, icon: Eye, color: "text-cyan-400" },
    { label: "Downloads", value: totalDownloads, icon: Download, color: "text-green-400" },
    { label: "Citations", value: totalCitations, icon: FileText, color: "text-purple-400" },
    { label: "Featured", value: featuredCount, icon: Star, color: "text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className="glass rounded-xl p-4 text-center">
          <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
          <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
          <p className="text-text-secondary text-xs mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
