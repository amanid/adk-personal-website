"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import {
  ArrowRight,
  Brain,
  Database,
  Server,
  GraduationCap,
  BarChart3,
  Lightbulb,
  BookOpen,
  Calendar,
  Users,
  Globe,
  Building2,
  TrendingUp,
  Award,
  MapPin,
  Heart,
  FileText,
  Download,
} from "lucide-react";
import { useState, useEffect } from "react";
import HeroSection from "@/components/home/HeroSection";
import StatsCounter from "@/components/home/StatsCounter";
import { projects as staticProjects } from "@/data/projects";
import { experiences as staticExperiences } from "@/data/experience";
import { publications as staticPublications } from "@/data/publications";

const services = [
  {
    icon: Brain,
    titleKey: "consulting",
    descKey: "consulting_desc",
  },
  {
    icon: Database,
    titleKey: "architecture",
    descKey: "architecture_desc",
  },
  {
    icon: Server,
    titleKey: "mlops",
    descKey: "mlops_desc",
  },
  {
    icon: GraduationCap,
    titleKey: "training",
    descKey: "training_desc",
  },
  {
    icon: BarChart3,
    titleKey: "statistics",
    descKey: "statistics_desc",
  },
];

const expertiseAreas = [
  { iconKey: "ds", icon: Database },
  { iconKey: "ai", icon: Brain },
  { iconKey: "stats", icon: BarChart3 },
  { iconKey: "de", icon: Server },
  { iconKey: "strategy", icon: Lightbulb },
];

const impactMetrics = [
  { value: "11", label: "Organizations", icon: Building2 },
  { value: "6+", label: "Countries", icon: Globe },
  { value: "27", label: "Analytical Reports", icon: FileText },
  { value: "9", label: "Degrees & Certificates", icon: Award },
  { value: "50+", label: "Projects Delivered", icon: TrendingUp },
  { value: "13+", label: "Years Experience", icon: Calendar },
];

interface ProjectEntry {
  id: string;
  title: string;
  titleFr?: string | null;
  description: string;
  descriptionFr?: string | null;
  technologies: string[];
  category?: string | null;
  featured: boolean;
}

interface ExperienceEntry {
  id: string;
  role: string;
  roleFr?: string | null;
  organization: string;
  location: string;
  startDate: string;
  endDate?: string | null;
  description: string[];
  descriptionFr: string[];
}

interface PublicationEntry {
  id: string;
  title: string;
  titleFr?: string | null;
  abstract: string;
  abstractFr?: string | null;
  authors: string[];
  year: number;
  category?: string | null;
  pdfUrl?: string | null;
  featured: boolean;
}

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const [projects, setProjects] = useState<ProjectEntry[]>(staticProjects);
  const [experiences, setExperiences] = useState<ExperienceEntry[]>(staticExperiences);
  const [publications, setPublications] = useState<PublicationEntry[]>(staticPublications);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()).catch(() => null),
      fetch("/api/experience").then((r) => r.json()).catch(() => null),
      fetch("/api/publications").then((r) => r.json()).catch(() => null),
    ]).then(([projData, expData, pubData]) => {
      if (projData?.projects?.length > 0) setProjects(projData.projects);
      if (expData?.experiences?.length > 0) setExperiences(expData.experiences);
      if (pubData?.publications?.length > 0) setPublications(pubData.publications);
    });
  }, []);

  const featuredProjects = projects.filter((p) => p.featured).slice(0, 4);
  const featuredPublications = publications.filter((p) => p.featured).slice(0, 3);
  const topExperiences = experiences.slice(0, 4);

  return (
    <>
      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Who I Am — Personal Story */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-gold" />
              <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] gradient-text">
                {t("home.who_i_am_title")}
              </h2>
            </div>
            <p className="text-text-secondary text-base md:text-lg leading-relaxed">
              {t("home.who_i_am_text")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3. Stats */}
      <section className="section-padding bg-navy/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <StatsCounter value={13} suffix="+" label={t("stats.years")} />
            <StatsCounter value={11} suffix="" label={t("stats.organizations")} />
            <StatsCounter value={6} suffix="+" label={t("stats.countries")} />
            <StatsCounter value={27} suffix="" label={t("stats.publications")} />
            <StatsCounter value={50} suffix="+" label={t("stats.projects")} />
          </div>
        </div>
      </section>

      {/* 4. Expertise Areas */}
      <section className="section-padding">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
              {t("home.expertise_title")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {expertiseAreas.map((area, index) => (
              <motion.div
                key={area.iconKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-6 hover:border-gold/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <area.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t(`home.expertise_${area.iconKey}_title`)}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {t(`home.expertise_${area.iconKey}_desc`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Career Highlights */}
      <section className="section-padding bg-navy/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
              {t("home.experience_title")}
            </h2>
          </motion.div>

          <div className="space-y-4">
            {topExperiences.map((exp, index) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-6 hover:border-gold/30 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {locale === "fr" ? exp.roleFr : exp.role}
                    </h3>
                    <p className="text-gold text-sm">{exp.organization}</p>
                  </div>
                  <div className="flex items-center gap-3 text-text-muted text-sm mt-2 md:mt-0">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {exp.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {exp.startDate} – {exp.endDate || t("experience.present")}
                    </span>
                  </div>
                </div>
                <ul className="space-y-1">
                  {(locale === "fr" ? exp.descriptionFr : exp.description)
                    .slice(0, 2)
                    .map((item, i) => (
                      <li
                        key={i}
                        className="text-text-secondary text-sm flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/experience"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
            >
              {t("home.view_all")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Featured Publications */}
      <section className="section-padding">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
              {t("home.publications_title")}
            </h2>
          </motion.div>

          <div className="space-y-4">
            {featuredPublications.map((pub, index) => (
              <motion.div
                key={pub.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-6 hover:border-gold/30 transition-all duration-300 group"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold">
                    {pub.category}
                  </span>
                  <span className="text-xs text-text-muted">{pub.year}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-gold transition-colors">
                  {locale === "fr" ? pub.titleFr : pub.title}
                </h3>
                <p className="text-text-muted text-sm flex items-center gap-1 mb-2">
                  <Users className="w-3.5 h-3.5" />
                  {pub.authors.join(", ")}
                </p>
                <p className="text-text-secondary text-sm leading-relaxed line-clamp-2 mb-3">
                  {locale === "fr" ? pub.abstractFr : pub.abstract}
                </p>
                {pub.pdfUrl && (
                  <a
                    href={pub.pdfUrl}
                    download
                    className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold-light transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t("publications.download_pdf")}
                  </a>
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/publications"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
            >
              {t("home.view_all")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Featured Projects */}
      <section className="section-padding bg-navy/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
              {t("projects.title")}
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              {t("projects.subtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-6 hover:border-gold/30 transition-all duration-300 group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold">
                    {project.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-gold transition-colors">
                  {locale === "fr" ? project.titleFr : project.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  {((locale === "fr" ? project.descriptionFr : project.description) || "").substring(0, 150)}...
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-2 py-1 rounded bg-navy-light text-text-secondary"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
            >
              {t("home.view_all")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Services Overview */}
      <section className="section-padding">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
              {t("services.title")}
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              {t("services.subtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-6 hover:border-gold/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <service.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t(`services.${service.titleKey}`)}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {t(`services.${service.descKey}`)}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
            >
              {t("services.title")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Impact & Achievements */}
      <section className="section-padding bg-navy/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
              {t("home.impact_title")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {impactMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="glass rounded-xl p-6 text-center hover:border-gold/30 transition-all duration-300"
              >
                <metric.icon className="w-6 h-6 text-gold mx-auto mb-3" />
                <p className="text-2xl md:text-3xl font-bold gradient-text font-[family-name:var(--font-display)]">
                  {metric.value}
                </p>
                <p className="text-text-secondary text-sm mt-1">{metric.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CTA Section */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8 md:p-12 gradient-border"
          >
            <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-display)] mb-4">
              {t("contact.title")}
            </h2>
            <p className="text-text-secondary mb-8 max-w-xl mx-auto">
              {t("contact.subtitle")}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-charcoal font-semibold rounded-lg hover:bg-gold-light transition-all duration-300 hover:shadow-lg hover:shadow-gold/20"
            >
              {t("hero.cta_contact")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
