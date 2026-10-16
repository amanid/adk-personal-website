import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight, ArrowUpRight, BarChart3, Brain, Code2, Database, GraduationCap, Server } from "lucide-react";
import HeroSection from "@/components/home/HeroSection";
import CapabilitiesSection from "@/components/home/CapabilitiesSection";
import CertificationsShowcase from "@/components/home/CertificationsShowcase";
import { Section } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import type { CapabilityData } from "@/lib/capabilities";
import { projects as staticProjects } from "@/data/projects";
import { experiences as staticExperiences } from "@/data/experience";
import { publications as staticPublications } from "@/data/publications";
import { organizations } from "@/data/organizations";
import { countriesWorked } from "@/data/countries";

/*
 * Server-rendered home page. Seven sections, each earning its place:
 * hero, capabilities, selected work, services, where I've worked,
 * credentials, contact. Every figure is computed from the records.
 */

const services = [
  { icon: BarChart3, key: "statistics" },
  { icon: Brain, key: "consulting" },
  { icon: Database, key: "architecture" },
  { icon: Server, key: "mlops" },
  { icon: Code2, key: "fullstack" },
  { icon: GraduationCap, key: "training" },
] as const;

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
}

interface PublicationEntry {
  id: string;
  slug?: string;
  title: string;
  titleFr?: string | null;
  abstract: string;
  abstractFr?: string | null;
  year: number;
  category?: string | null;
  accessLevel?: string | null;
  featured: boolean;
}

interface HomeClientProps {
  initialProjects?: ProjectEntry[];
  initialExperiences?: ExperienceEntry[];
  initialPublications?: PublicationEntry[];
  initialVisibility?: Record<string, boolean>;
  initialCvUrl?: string;
  profilePhoto?: string;
  capabilities: CapabilityData;
}

export default function HomeClient({
  initialProjects,
  initialExperiences,
  initialPublications,
  initialVisibility,
  initialCvUrl,
  profilePhoto,
  capabilities,
}: HomeClientProps) {
  const t = useTranslations();
  const fr = useLocale() === "fr";
  const projects = initialProjects?.length ? initialProjects : staticProjects;
  const experiences = initialExperiences?.length ? initialExperiences : staticExperiences;
  const publications = initialPublications?.length ? initialPublications : staticPublications;
  const vis = initialVisibility ?? {};

  const featuredProjects = projects.filter((p) => p.featured).slice(0, 4);
  const featuredPublications = publications.filter((p) => p.featured).slice(0, 3);
  const current = experiences.find((e) => !e.endDate);
  const currentRole = current
    ? { role: fr && current.roleFr ? current.roleFr : current.role, organization: current.organization, location: current.location }
    : null;

  const figures = [
    ...(capabilities.facts.years ? [{ value: capabilities.facts.years, suffix: "+", label: t("stats.years") }] : []),
    { value: capabilities.facts.organizations, label: t("stats.organizations") },
    { value: countriesWorked.length, label: t("stats.countries") },
    { value: capabilities.facts.publications, label: t("stats.publications") },
  ];

  return (
    <>
      <HeroSection
        showCvDownload={vis.cvDownload === true}
        cvUrl={initialCvUrl}
        profilePhoto={profilePhoto}
        currentRole={currentRole}
        figures={figures}
        timeline={capabilities.timeline}
        rangeStart={capabilities.rangeStart}
        rangeEnd={capabilities.rangeEnd}
      />

      {vis.capabilities !== false && <CapabilitiesSection data={capabilities} />}

      {(vis.projects !== false || vis.publications !== false) && (
        <Section
          eyebrow={t("homeV2.work_eyebrow")}
          title={t("homeV2.work_title")}
          action={
            <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold-light">
              {t("homeV2.all_projects")} <ArrowRight className="w-4 h-4" />
            </Link>
          }
        >
          {vis.projects !== false && (
            <div className="grid md:grid-cols-2 gap-5">
              {featuredProjects.map((p, i) => (
                <Reveal key={p.id}>
                  <Link
                    href="/projects"
                    className={`card card-interactive group flex h-full flex-col p-6 md:p-7 ${i === 0 ? "card-feature" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-gold">{p.category}</span>
                      <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-gold transition-colors" />
                    </div>
                    <h3 className="font-display text-2xl leading-tight mb-3">{fr && p.titleFr ? p.titleFr : p.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 mb-6">
                      {fr && p.descriptionFr ? p.descriptionFr : p.description}
                    </p>
                    <ul className="mt-auto flex flex-wrap gap-1.5">
                      {p.technologies.slice(0, 5).map((tech) => (
                        <li key={tech} className="text-xs px-2 py-1 rounded-[var(--radius-sm)] bg-surface-2 text-text-secondary">
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}

          {vis.publications !== false && featuredPublications.length > 0 && (
            <div className="mt-16">
              <div className="flex items-end justify-between gap-4 mb-6">
                <h3 className="font-display text-2xl">{t("home.publications_title")}</h3>
                <Link href="/publications" className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold-light shrink-0">
                  {t("homeV2.all_publications")} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <ol className="hairline">
                {featuredPublications.map((pub) => (
                  <li key={pub.id} className="border-b border-glass-border">
                    <Link
                      href={pub.slug ? `/publications/${pub.slug}` : "/publications"}
                      className="group grid md:grid-cols-12 gap-2 md:gap-6 py-6 hover:bg-[var(--hover-wash)] transition-colors -mx-3 px-3 rounded-[var(--radius-sm)]"
                    >
                      <span className="md:col-span-2 font-mono text-xs text-text-muted pt-1.5">
                        {pub.year}
                        {pub.accessLevel === "GATED" && <span className="ml-2 text-gold">{t("homeV2.members")}</span>}
                      </span>
                      <span className="md:col-span-9">
                        <span className="block font-display text-xl leading-snug group-hover:text-gold transition-colors">
                          {fr && pub.titleFr ? pub.titleFr : pub.title}
                        </span>
                        <span className="mt-2 text-sm text-text-secondary line-clamp-2">
                          {fr && pub.abstractFr ? pub.abstractFr : pub.abstract}
                        </span>
                      </span>
                      <ArrowUpRight className="hidden md:block md:col-span-1 justify-self-end w-4 h-4 mt-1.5 text-text-muted group-hover:text-gold transition-colors" />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Section>
      )}

      {vis.services !== false && (
        <Section
          eyebrow={t("services.title")}
          title={t("homeV2.services_title")}
          intro={t("services.subtitle")}
          action={
            <ButtonLink href="/services" variant="secondary">
              {t("services.view_packages")}
            </ButtonLink>
          }
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-glass-border rounded-[var(--radius-md)] overflow-hidden">
            {services.map((s) => (
              <Link
                key={s.key}
                href="/services"
                className="group p-7 border-r border-b border-glass-border hover:bg-[var(--hover-wash)] transition-colors"
              >
                <s.icon className="w-5 h-5 text-gold mb-6" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  {t(`services.${s.key}`)}
                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-gold" />
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">{t(`services.${s.key}_desc`)}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {vis.trustedBy !== false && (
        <Section
          eyebrow={t("homeV2.worked_eyebrow")}
          title={t("homeV2.worked_title")}
          intro={t("organizations.subtitle")}
        >
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {organizations.map((o) => (
              <li key={o.id} className="min-w-0 flex items-baseline justify-between gap-4 py-4 border-b border-glass-border">
                <a
                  href={o.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group min-w-0"
                >
                  <span className="font-display text-xl group-hover:text-gold transition-colors">{o.abbreviation}</span>
                  <span className="block text-xs text-text-muted truncate">{fr ? o.nameFr : o.name}</span>
                </a>
                <span className="font-mono text-xs text-text-muted text-right">{o.location}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-text-secondary">
            <span className="eyebrow mr-3">{t("stats.countries")}</span>
            {countriesWorked.map((c) => (fr ? c.nameFr : c.name)).join(" · ")}
          </p>
        </Section>
      )}

      {vis.certifications !== false && <CertificationsShowcase />}

      {vis.cta !== false && (
        <section className="py-20 md:py-28 hairline">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="card card-feature p-8 md:p-14 rounded-[var(--radius-lg)] grid md:grid-cols-12 gap-8 items-end">
              <div className="md:col-span-8">
                <p className="eyebrow mb-4">{t("nav.contact")}</p>
                <h2 className="h-section mb-4">{t("contact.title")}</h2>
                <p className="lede max-w-xl">{t("contact.subtitle")}</p>
              </div>
              <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-3 md:items-stretch md:max-w-xs md:ml-auto md:w-full">
                <ButtonLink href="/contact" size="lg" className="group">
                  {t("hero.cta_contact")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </ButtonLink>
                <ButtonLink href="/book" variant="secondary" size="lg">
                  {t("homeV2.book_call")}
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
