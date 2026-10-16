"use client";

import { useTranslations, useLocale } from "next-intl";
import { ExternalLink, Github } from "lucide-react";
import { useState } from "react";
import { projects as staticProjects } from "@/data/projects";
import { Container } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

const categories = ["All", "AI/ML", "Data Engineering", "Analytics", "Data Governance"];

interface ProjectEntry {
  id: string;
  title: string;
  titleFr?: string | null;
  description: string;
  descriptionFr?: string | null;
  technologies: string[];
  category?: string | null;
  coverImage?: string | null;
  liveUrl?: string | null;
  githubUrl?: string | null;
  featured: boolean;
}

export default function ProjectsClient({
  initialProjects,
}: {
  initialProjects: ProjectEntry[];
}) {
  const t = useTranslations("projects");
  const fr = useLocale() === "fr";
  const [activeCategory, setActiveCategory] = useState("All");
  // Server provides DB projects; fall back to the static seed if empty.
  const projects: ProjectEntry[] = initialProjects.length ? initialProjects : staticProjects;

  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  return (
    <>
      <header className="pt-10 pb-10 md:pt-16 md:pb-12">
        <Container>
          <p className="eyebrow mb-5">{t("title")}</p>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight max-w-3xl">
            {t("subtitle")}
          </h1>
        </Container>
      </header>

      <section className="pb-20 md:pb-28">
        <Container>
          {/* Filters */}
          <div role="group" aria-label={t("filter_label")} className="flex flex-wrap gap-2 mb-10">
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "min-h-11 px-4 rounded-[var(--radius-md)] text-sm font-medium border transition-colors",
                    active
                      ? "bg-gold text-charcoal border-gold"
                      : "border-glass-border text-text-secondary hover:text-text-primary hover:bg-[var(--hover-wash)]",
                  )}
                >
                  {cat === "All" ? t("all") : cat}
                </button>
              );
            })}
          </div>

          {/* Projects grid. Cards are plain surfaces: only their links are interactive. */}
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-live="polite">
            {filteredProjects.map((project) => (
              <li
                key={project.id}
                className={cn("card flex flex-col p-6", project.featured && "border-gold/30")}
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  {project.category && (
                    <span className="font-mono text-xs uppercase tracking-[0.1em] text-gold">
                      {project.category}
                    </span>
                  )}
                  {project.featured && (
                    <span className="font-mono text-xs uppercase tracking-[0.1em] text-text-muted">
                      {t("featured")}
                    </span>
                  )}
                </div>
                <h2 className="font-display text-2xl leading-tight mb-3">
                  {fr && project.titleFr ? project.titleFr : project.title}
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  {fr && project.descriptionFr ? project.descriptionFr : project.description}
                </p>
                <ul className="mt-auto flex flex-wrap gap-1.5" aria-label={t("technologies")}>
                  {project.technologies.map((tech) => (
                    <li
                      key={tech}
                      className="text-xs px-2 py-1 rounded-[var(--radius-sm)] bg-surface-2 text-text-secondary"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
                {(project.liveUrl || project.githubUrl) && (
                  <div className="flex items-center gap-1 mt-5 -mx-2">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 min-h-11 px-2 text-sm text-gold hover:text-gold-light transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {t("live")}
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 min-h-11 px-2 text-sm text-text-secondary hover:text-gold transition-colors"
                      >
                        <Github className="w-4 h-4" />
                        {t("code")}
                      </a>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
