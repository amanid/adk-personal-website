"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  ExternalLink,
  Award,
  Mic,
  BookOpen,
  Users,
  Target,
  Lightbulb,
  MoreHorizontal,
} from "lucide-react";
import type { ResearchActivityData, ResearchActivityType } from "@/types";

const TYPE_CONFIG: Record<ResearchActivityType, { icon: typeof Calendar; color: string; label: string }> = {
  CONFERENCE_ATTENDED: { icon: Users, color: "text-blue-400", label: "Conference" },
  TALK_GIVEN: { icon: Mic, color: "text-purple-400", label: "Talk" },
  PEER_REVIEW: { icon: BookOpen, color: "text-green-400", label: "Peer Review" },
  GRANT_RECEIVED: { icon: Target, color: "text-gold", label: "Grant" },
  MILESTONE: { icon: Lightbulb, color: "text-cyan-400", label: "Milestone" },
  WORKSHOP: { icon: Users, color: "text-amber-400", label: "Workshop" },
  AWARD: { icon: Award, color: "text-yellow-400", label: "Award" },
  OTHER: { icon: MoreHorizontal, color: "text-text-secondary", label: "Other" },
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <Calendar className="w-8 h-8 text-text-secondary mx-auto mb-3" />
        <p className="text-text-secondary">No research activities yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-glass-border" />
      <div className="space-y-6">
        {activities.map((activity, i) => {
          const config = TYPE_CONFIG[activity.type];
          const Icon = config.icon;
          const title = locale === "fr" && activity.titleFr ? activity.titleFr : activity.title;
          const description = locale === "fr" && activity.descriptionFr ? activity.descriptionFr : activity.description;
          const location = locale === "fr" && activity.locationFr ? activity.locationFr : activity.location;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative pl-10"
            >
              <div className={`absolute left-2 top-1 w-5 h-5 rounded-full glass flex items-center justify-center ${config.color}`}>
                <Icon className="w-3 h-3" />
              </div>
              <div className="glass rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-medium">{title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full glass ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(activity.date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  {location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {location}
                    </span>
                  )}
                </div>
                {description && (
                  <p className="text-sm text-text-secondary">{description}</p>
                )}
                {activity.url && (
                  <a
                    href={activity.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold/80 mt-2 transition-colors"
                  >
                    View More <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
