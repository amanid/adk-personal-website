import { SkillCategory, Education, Certification } from "@/types";

export const skillCategories: SkillCategory[] = [
  {
    name: "AI & Machine Learning",
    nameFr: "IA & Apprentissage Automatique",
    skills: [
      { name: "Python / PyTorch / TensorFlow", level: 95 },
      { name: "Large Language Models (LLMs) / RAG", level: 90 },
      { name: "NLP & Computer Vision", level: 88 },
      { name: "MLOps / ML Pipelines", level: 92 },
      { name: "Generative AI / LangChain", level: 90 },
    ],
  },
  {
    name: "Data Engineering",
    nameFr: "Ingénierie des Données",
    skills: [
      { name: "Azure / Databricks / Spark", level: 93 },
      { name: "SQL / PostgreSQL / Oracle", level: 95 },
      { name: "ETL / ELT Data Pipelines", level: 94 },
      { name: "Lakehouse / Medallion Architecture", level: 90 },
      { name: "Power BI / Tableau", level: 88 },
    ],
  },
  {
    name: "Statistics & Econometrics",
    nameFr: "Statistique & Économétrie",
    skills: [
      { name: "Statistical Inference & Modeling", level: 95 },
      { name: "Econometrics (Panel, Time Series, IV)", level: 93 },
      { name: "R / Stata / SAS / SPSS", level: 92 },
      { name: "Survey Sampling & Design", level: 92 },
      { name: "Causal Inference & Impact Evaluation", level: 90 },
    ],
  },
  {
    name: "Software & Cloud",
    nameFr: "Logiciel & Cloud",
    skills: [
      { name: "Azure Cloud Services", level: 90 },
      { name: "Docker / Kubernetes", level: 82 },
      { name: "REST APIs / GraphQL", level: 88 },
      { name: "Git / CI-CD / DevOps", level: 90 },
      { name: "TypeScript / JavaScript / Next.js", level: 85 },
    ],
  },
  {
    name: "Strategy & Leadership",
    nameFr: "Stratégie & Leadership",
    skills: [
      { name: "Data Strategy & Governance (DAMA-DMBOK)", level: 92 },
      { name: "Project Management", level: 90 },
      { name: "Team Leadership & Mentoring", level: 88 },
      { name: "Stakeholder Communication", level: 92 },
      { name: "M&E / Survey Design / KoboToolBox", level: 90 },
    ],
  },
];

export const education: Education[] = [
  {
    degree: "MBA, Specialization in Artificial Intelligence",
    degreeFr: "MBA, Spécialisation en Intelligence Artificielle",
    institution: "Nexford University",
    year: "2026",
    location: "USA (Online)",
  },
  {
    degree: "Professional Certificate in Data Engineering, AI & Data Science",
    degreeFr: "Certificat Professionnel en Ingénierie des Données, IA & Science des Données",
    institution: "Massachusetts Institute of Technology (MIT)",
    year: "2025",
    location: "USA (Online)",
  },
  {
    degree: "Applied AI and Data Science Program",
    degreeFr: "Programme Appliqué en IA et Science des Données",
    institution: "Massachusetts Institute of Technology (MIT)",
    year: "2025",
    location: "USA (Online)",
  },
  {
    degree: "MicroMasters in Data, Economics & Development Policy",
    degreeFr: "MicroMasters en Données, Économie & Politique de Développement",
    institution: "Massachusetts Institute of Technology (MIT)",
    year: "2021",
    location: "USA (Online)",
  },
  {
    degree: "Financial Modelling & Valuation Analyst (FMVA)",
    degreeFr: "Analyste en Modélisation Financière & Valorisation (FMVA)",
    institution: "Corporate Finance Institute (CFI)",
    year: "2020",
    location: "Canada (Online)",
  },
  {
    degree: "Master's in Statistics & Econometrics",
    degreeFr: "Master en Statistique & Économétrie",
    institution: "Université Toulouse I Capitole",
    year: "2017",
    location: "Toulouse, France",
  },
  {
    degree: "Data Science Specialization Certificate",
    degreeFr: "Certificat de Spécialisation en Science des Données",
    institution: "Johns Hopkins University",
    year: "2015",
    location: "USA (Online)",
  },
  {
    degree: "Ingénieur Statisticien (Statistics & Information System Engineer)",
    degreeFr: "Ingénieur Statisticien (Statistique & Systèmes d'Information)",
    institution: "ENSEA (École Nationale Supérieure de Statistique et d'Économie Appliquée)",
    year: "2012",
    location: "Abidjan, Côte d'Ivoire",
  },
  {
    degree: "Bachelor in Statistics & Information Systems",
    degreeFr: "Licence en Statistique & Systèmes d'Information",
    institution: "ENSEA (École Nationale Supérieure de Statistique et d'Économie Appliquée)",
    year: "2009",
    location: "Abidjan, Côte d'Ivoire",
  },
];

export const certifications: Certification[] = [
  {
    name: "Professional Certificate in Data Engineering, AI & Data Science",
    issuer: "MIT",
    year: "2025",
  },
  {
    name: "Applied AI and Data Science Program",
    issuer: "MIT",
    year: "2025",
  },
  {
    name: "MicroMasters in Data, Economics & Development Policy",
    issuer: "MIT",
    year: "2021",
  },
  {
    name: "Financial Modelling & Valuation Analyst (FMVA)",
    issuer: "Corporate Finance Institute",
    year: "2020",
  },
  {
    name: "Data Science Specialization",
    issuer: "Johns Hopkins University",
    year: "2015",
  },
];

export const languages = [
  { name: "French", nameFr: "Français", level: "Native", levelFr: "Natif" },
  { name: "English", nameFr: "Anglais", level: "Fluent (C1)", levelFr: "Courant (C1)" },
];
