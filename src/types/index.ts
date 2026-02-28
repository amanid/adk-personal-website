export interface NavItem {
  label: string;
  href: string;
}

export interface Stat {
  value: number;
  suffix: string;
  label: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  roleFr: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string | null;
  description: string[];
  descriptionFr: string[];
  logo?: string;
}

export interface SkillCategory {
  name: string;
  nameFr: string;
  skills: { name: string; level: number }[];
}

export interface Education {
  degree: string;
  degreeFr: string;
  institution: string;
  year: string;
  location: string;
}

export interface Certification {
  name: string;
  issuer: string;
  year: string;
}

export interface ProjectData {
  id: string;
  title: string;
  titleFr: string;
  description: string;
  descriptionFr: string;
  technologies: string[];
  category: string;
  featured: boolean;
  image?: string;
  liveUrl?: string;
  githubUrl?: string;
}

export interface ServiceData {
  id: string;
  icon: string;
  title: string;
  description: string;
  features: string[];
}

export interface PublicationData {
  id: string;
  title: string;
  titleFr: string;
  slug: string;
  abstract: string;
  abstractFr: string;
  authors: string[];
  journal: string;
  year: number;
  category: string;
  pdfUrl?: string;
  tags: string[];
  featured: boolean;
}
