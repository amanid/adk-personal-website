"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import type { ResearchActivityData, ResearchActivityType } from "@/types";

const TYPE_LABEL: Record<ResearchActivityType, { en: string; fr: string }> = {
  RESEARCH_PAPER: { en: "Research paper", fr: "Article de recherche" },
  JOURNAL_ARTICLE: { en: "Journal article", fr: "Article de revue" },
  CONFERENCE_PAPER: { en: "Conference paper", fr: "Communication" },
  WORKING_PAPER: { en: "Working paper", fr: "Document de travail" },
  TECHNICAL_REPORT: { en: "Technical report", fr: "Rapport technique" },
  BOOK_CHAPTER: { en: "Book chapter", fr: "Chapitre de livre" },
  DATASET_RELEASE: { en: "Dataset", fr: "Jeu de données" },
  CONFERENCE_ATTENDED: { en: "Conference", fr: "Conférence" },
  TALK_GIVEN: { en: "Talk", fr: "Intervention" },
  PEER_REVIEW: { en: "Peer review", fr: "Relecture" },
  GRANT_RECEIVED: { en: "Grant", fr: "Financement" },
  MILESTONE: { en: "Milestone", fr: "Étape" },
  WORKSHOP: { en: "Workshop", fr: "Atelier" },
  AWARD: { en: "Award", fr: "Distinction" },
  TEACHING: { en: "Teaching", fr: "Enseignement" },
  SUPERVISION: { en: "Supervision", fr: "Encadrement" },
  COLLABORATION: { en: "Collaboration", fr: "Collaboration" },
  PATENT: { en: "Patent", fr: "Brevet" },
  SOFTWARE_RELEASE: { en: "Software", fr: "Logiciel" },
  OTHER: { en: "Other", fr: "Autre" },
};

interface ResearchTimelineProps {
  locale?: string;
}

export default function ResearchTimeline({ locale = "en" }: ResearchTimelineProps) {
  const [activities, setActivities] = useState<ResearchActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/research-activities")
      .then((r) => r.ok ? r.json() : { activities: [] })
      .then((data) => setActivities(data.activities || []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  const fr = locale === "fr";

  if (loading) {
    return (
      <p role="status" className="flex items-center gap-3 py-8 text-text-secondary">
        <span aria-hidden className="animate-spin w-4 h-4 border-2 border-gold border-t-transparent rounded-full" />
        {fr ? "Chargement…" : "Loading…"}
      </p>
    );
  }

  if (activities.length === 0) {
    return <p className="py-8 text-text-secondary">{fr ? "Aucune activité pour le moment." : "No research activities yet."}</p>;
  }

  return (
    <ol className="border-t border-glass-border">
      {activities.map((activity) => {
        const label = TYPE_LABEL[activity.type] ?? TYPE_LABEL.OTHER;
        const title = fr && activity.titleFr ? activity.titleFr : activity.title;
        const description = fr && activity.descriptionFr ? activity.descriptionFr : activity.description;
        const location = fr && activity.locationFr ? activity.locationFr : activity.location;
        const date = new Date(activity.date);

        return (
          <li key={activity.id} className="grid grid-cols-[5.5rem_1fr] sm:grid-cols-[7.5rem_1fr] gap-x-4 sm:gap-x-6 py-6 border-b border-glass-border">
            <time dateTime={date.toISOString()} className="font-mono text-sm tabular-nums text-text-muted pt-1">
              {date.toLocaleDateString(fr ? "fr-FR" : "en-US", { year: "numeric", month: "short" })}
            </time>
            <div className="min-w-0">
              <p className="eyebrow text-text-muted mb-1.5">{fr ? label.fr : label.en}</p>
              <h3 className="font-display text-xl leading-snug">{title}</h3>
              {location && (
                <p className="mt-1.5 text-sm text-text-muted flex items-center gap-1.5">
                  <MapPin aria-hidden className="w-3.5 h-3.5" />
                  {location}
                </p>
              )}
              {description && <p className="mt-3 text-text-secondary leading-relaxed">{description}</p>}
              {activity.url && (
                <a
                  href={activity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 min-h-11 text-sm text-gold hover:text-gold-light transition-colors"
                >
                  {fr ? "En savoir plus" : "More details"}
                  <ExternalLink aria-hidden className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
