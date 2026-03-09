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

export type PublicationType =
  | "JOURNAL_ARTICLE"
  | "CONFERENCE_PAPER"
  | "WORKING_PAPER"
  | "THESIS_DISSERTATION"
  | "BOOK_CHAPTER"
  | "TECHNICAL_REPORT"
  | "PREPRINT"
  | "ANALYTICAL_REPORT";

export type ResearchActivityType =
  | "RESEARCH_PAPER"
  | "JOURNAL_ARTICLE"
  | "CONFERENCE_PAPER"
  | "WORKING_PAPER"
  | "TECHNICAL_REPORT"
  | "BOOK_CHAPTER"
  | "DATASET_RELEASE"
  | "CONFERENCE_ATTENDED"
  | "TALK_GIVEN"
  | "PEER_REVIEW"
  | "GRANT_RECEIVED"
  | "MILESTONE"
  | "WORKSHOP"
  | "AWARD"
  | "TEACHING"
  | "SUPERVISION"
  | "COLLABORATION"
  | "PATENT"
  | "SOFTWARE_RELEASE"
  | "OTHER";

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
  publicationType: PublicationType;
  doi?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  publisherFr?: string;
  conferenceName?: string;
  conferenceNameFr?: string;
  conferenceLocation?: string;
  bookTitle?: string;
  bookTitleFr?: string;
  institution?: string;
  institutionFr?: string;
  month?: number;
  url?: string;
  downloadCount?: number;
  citationCount?: number;
  views?: number;
  accessLevel?: "FREE" | "GATED";
  dataUrl?: string;
  supplementaryUrl?: string;
}

export interface ResearchActivityData {
  id: string;
  type: ResearchActivityType;
  title: string;
  titleFr?: string;
  description?: string;
  descriptionFr?: string;
  date: string;
  location?: string;
  locationFr?: string;
  url?: string;
  paperUrl?: string;
  dataUrl?: string;
  supplementaryUrl?: string;
  accessLevel?: "FREE" | "GATED";
  published?: boolean;
}
