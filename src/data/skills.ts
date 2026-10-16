import { Education, Certification } from "@/types";

// Skills are listed by name only: no self-rated levels. Every entry appears in
// the technical sections of the CVs in public/cv/ (CV1 "Technical
// Proficiency" / "Core Competencies", CV2 "Competencies"). Add nothing the
// CVs do not state.
export interface SkillGroup {
  name: string;
  nameFr: string;
  skills: { name: string }[];
}

const group = (name: string, nameFr: string, skills: string[]): SkillGroup => ({
  name,
  nameFr,
  skills: skills.map((s) => ({ name: s })),
});

export const skillCategories: SkillGroup[] = [
  group("Generative AI & Machine Learning", "IA générative & apprentissage automatique", [
    "LLMs (OpenAI, Claude, LLaMA, Gemini)",
    "LangChain",
    "RAG pipelines",
    "Vector databases (FAISS)",
    "AI agents & Text-to-SQL",
    "AWS Bedrock & SageMaker",
    "NLP",
    "MLflow",
    "scikit-learn",
    "Fraud & anomaly detection",
    "Risk modelling & credit scoring",
    "Churn prediction",
  ]),
  group("Data Engineering & Cloud", "Ingénierie des données & cloud", [
    "Databricks (Spark, Delta Lake, Unity Catalog)",
    "AWS (S3, Athena, Lambda, RDS, Redshift, Kinesis, EC2)",
    "SAP Datasphere",
    "ETL/ELT pipelines",
    "Change Data Capture (CDC)",
    "Real-time streaming pipelines",
    "Medallion & lakehouse architecture",
    "Data warehousing",
    "CI/CD (GitHub Actions)",
    "Docker (basic)",
  ]),
  group("Programming & Databases", "Programmation & bases de données", [
    "Python (PySpark, pandas, FastAPI, Streamlit, Dash)",
    "R",
    "SQL",
    "STATA",
    "EViews",
    "VBA",
    "Oracle (Finacle)",
    "PostgreSQL",
    "SQL Server",
    "MySQL",
    "SQLite",
    "Microsoft Access",
  ]),
  group("Statistics & Econometrics", "Statistique & économétrie", [
    "Time series forecasting (ARIMA, VAR, VECM)",
    "Panel data modelling",
    "Causal inference & A/B testing",
    "Interrupted time series",
    "Structural break analysis",
    "Impact evaluation",
    "Survey design & sampling",
    "GAMS",
  ]),
  group("Data Governance & Architecture", "Gouvernance & architecture des données", [
    "DAMA-DMBOK",
    "Master data management",
    "Data quality frameworks",
    "Data cataloguing (Ataccama)",
    "Metadata management",
    "Data models & ERDs",
    "Role-based access control (RBAC)",
  ]),
  group("Visualisation & Field Data", "Visualisation & collecte de terrain", [
    "Tableau",
    "Power BI",
    "R Shiny",
    "QGIS",
    "ArcGIS",
    "SurveyCTO",
    "ODK",
    "KoboToolBox",
    "CSPro",
    "SPSS",
    "Monitoring & evaluation frameworks",
  ]),
];

export const education: Education[] = [
  {
    degree: "Professional Certificate in Data Engineering",
    degreeFr: "Certificat professionnel en ingénierie des données",
    institution: "Massachusetts Institute of Technology (MIT)",
    year: "2025",
    location: "",
  },
  {
    degree: "Applied AI and Data Science Program",
    degreeFr: "Programme Appliqué en IA et Science des Données",
    institution: "Massachusetts Institute of Technology (MIT)",
    year: "2025",
    location: "",
  },
  {
    degree: "MicroMasters in Data, Economics & Development Policy",
    degreeFr: "MicroMasters en Données, Économie & Politique de Développement",
    institution: "Massachusetts Institute of Technology (MIT)",
    year: "2021",
    location: "",
  },
  {
    degree: "Financial Modelling & Valuation Analyst (FMVA)",
    degreeFr: "Analyste en Modélisation Financière & Valorisation (FMVA)",
    institution: "Corporate Finance Institute (CFI)",
    year: "2020",
    location: "",
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
    location: "",
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
    name: "Professional Certificate in Data Engineering",
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
  { name: "French", nameFr: "Français", level: "Native", levelFr: "Langue maternelle" },
  { name: "English", nameFr: "Anglais", level: "Full professional fluency", levelFr: "Maîtrise professionnelle complète" },
  { name: "Spanish", nameFr: "Espagnol", level: "Basic", levelFr: "Notions" },
];
