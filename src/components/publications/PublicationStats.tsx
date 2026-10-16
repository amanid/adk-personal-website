"use client";

import { useLocale } from "next-intl";

interface PublicationStatsProps {
  totalPublications: number;
  totalViews: number;
  totalDownloads: number;
  totalCitations: number;
  featuredCount: number;
  typeBreakdown: { type: string; count: number }[];
}

/**
 * A single quiet row of counts. Counts that are zero (for example views when
 * the database is unavailable, or citations, which are not tracked) are not
 * shown, so the row never advertises an empty number.
 */
export default function PublicationStats({
  totalPublications,
  totalViews,
  totalDownloads,
  totalCitations,
}: PublicationStatsProps) {
  const fr = useLocale() === "fr";
  const stats = [
    { label: fr ? "Publications" : "Publications", value: totalPublications },
    { label: fr ? "Lectures" : "Views", value: totalViews },
    { label: fr ? "Téléchargements" : "Downloads", value: totalDownloads },
    { label: fr ? "Citations" : "Citations", value: totalCitations },
  ].filter((s) => s.value > 0);

  if (stats.length === 0) return null;

  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-4 py-5 mb-10 border-y border-glass-border">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-row-reverse justify-end items-baseline gap-3">
          <dt className="eyebrow text-text-muted">{stat.label}</dt>
          <dd className="font-mono text-2xl tabular-nums text-text-primary">
            {stat.value.toLocaleString(fr ? "fr-FR" : "en-US")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
