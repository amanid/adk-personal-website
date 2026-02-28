"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { ExternalLink, Github, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { projects as staticProjects } from "@/data/projects";

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

export default function ProjectsPage() {
  const t = useTranslations("projects");
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState("All");
  const [projects, setProjects] = useState<ProjectEntry[]>(staticProjects);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects?.length > 0) setProjects(data.projects);
      })
      .catch(() => {});
  }, []);

  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  return (
    <div className="section-padding">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
            {t("title")}
          </h1>
          <p className="text-text-secondary text-lg">{t("subtitle")}</p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-gold text-charcoal"
                  : "glass text-text-secondary hover:text-gold hover:border-gold/30"
              }`}
            >
              {cat === "All" ? t("all") : cat}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              layout
              className="glass rounded-xl overflow-hidden group hover:border-gold/30 transition-all duration-300"
            >
              {/* Project image placeholder */}
              <div className="h-40 bg-gradient-to-br from-navy to-navy-light flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent" />
                {project.featured && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gold/20 text-gold text-xs">
                    <Star className="w-3 h-3" />
                    {t("featured")}
                  </div>
                )}
                <span className="text-3xl font-bold text-gold/20 font-[family-name:var(--font-display)]">
                  {project.title.charAt(0)}
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold">
                    {project.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-gold transition-colors">
                  {locale === "fr" ? project.titleFr : project.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-4 line-clamp-3">
                  {locale === "fr"
                    ? project.descriptionFr
                    : project.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-2 py-0.5 rounded bg-navy-light text-text-muted"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-gold hover:text-gold-light transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Live
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-text-secondary hover:text-gold transition-colors"
                    >
                      <Github className="w-3.5 h-3.5" />
                      Code
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
