import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed Experiences
  const expCount = await prisma.experience.count();
  if (expCount === 0) {
    console.log("Seeding experiences...");
    const experiences = [
      {
        role: "Manager, Data Scientist / Architect",
        roleFr: "Manager, Data Scientist / Architecte",
        organization: "African Export-Import Bank (Afreximbank)",
        location: "Cairo, Egypt",
        startDate: "Sep 2023",
        endDate: null,
        description: [
          "Designed and implemented end-to-end medallion architecture (Bronze/Silver/Gold) on Databricks with Delta Lake and Unity Catalog, establishing the enterprise data lakehouse foundation for all analytical and operational workloads",
          "Architected Master Data Management (MDM) solutions consolidating party data across four enterprise systems (CRM, Core Banking, Treasury Management, ERP), creating unified golden records for institutional counterparties",
          "Developed comprehensive data architecture blueprints including conceptual and logical data models, entity relationship diagrams, data dictionaries, and data flow documentation for mission-critical financial systems",
          "Created the enterprise data quality framework with automated metrics scripted on Databricks, monitoring completeness, consistency, timeliness, and accuracy across all data domains",
          "Led the selection and planned implementation of Ataccama as the enterprise data management platform, establishing data cataloging and metadata governance capabilities",
          "Built production-grade ETL/ELT pipelines extracting financial data from Oracle Finacle Core Banking System and Calypso Treasury Management System into PostgreSQL and Delta Lake targets",
          "Implemented Change Data Capture (CDC) and real-time streaming capabilities for data synchronization between treasury management systems and the enterprise data warehouse, enabling near-real-time risk monitoring and analytics",
          "Leveraged AWS services extensively: S3 for storage, Athena for serverless querying, Lambda for event-driven processing, RDS and Redshift for managed databases and warehousing, Kinesis for real-time streaming ML pipelines, SageMaker for model training and deployment, EC2 for compute – all orchestrated via boto3 SDK",
          "Established GitHub-based CI/CD pipelines for all data engineering workflows, ensuring version-controlled, reproducible, and auditable deployments across development, staging, and production environments",
          "Administered SAP Datasphere as the enterprise data warehousing platform, integrating structured and unstructured data sources across the organization",
          "Designed and deployed a multi-LLM enterprise chat platform (OpenAI, Claude, LLaMA, Gemini via AWS Bedrock and Databricks) with AI Agents and Text-to-SQL capabilities; built RAG pipelines with vector database architectures (FAISS) for automated document intelligence and knowledge retrieval",
          "Developed predictive analytics applications for real-time financial risk monitoring, counterparty risk scoring, and anomaly detection, delivering actionable intelligence to senior decision-makers",
          "Automated and enhanced the African Commodity Index and internal commodity dashboards across 54 African countries, improving consistency, reproducibility, and analytical depth",
          "Initiated the revamp of the methodological framework of the African Commodity Index to strengthen its analytical robustness and alignment with global best practices",
          "Built end-to-end ML and econometric modelling pipelines (Python, PySpark) for trade flow prediction, regional integration patterns, and cross-country macroeconomic forecasting using IMF DOTS, UNCTAD, and WTO datasets, with MLOps workflows via Databricks MLflow and GitHub CI/CD",
          "Improved research datasets through data quality processes, harmonisation, and methodological standardisation to support future econometric and policy analysis",
        ],
        descriptionFr: [
          "Conception et déploiement d'une architecture medallion de bout en bout (Bronze/Silver/Gold) sur Databricks avec Delta Lake et Unity Catalog, établissant le fondement du data lakehouse d'entreprise pour toutes les charges analytiques et opérationnelles",
          "Architecture de solutions MDM (Master Data Management) consolidant les données de contreparties à travers quatre systèmes d'entreprise (CRM, Core Banking, Treasury Management, ERP), créant des enregistrements unifiés « golden records » pour les contreparties institutionnelles",
          "Développement de blueprints complets d'architecture de données incluant modèles de données conceptuels et logiques, diagrammes entité-relation, dictionnaires de données et documentation des flux de données pour les systèmes financiers critiques",
          "Création du cadre de qualité des données d'entreprise avec des métriques automatisées scriptées sur Databricks, surveillant la complétude, la cohérence, la ponctualité et la précision à travers tous les domaines de données",
          "Direction de la sélection et planification de l'implémentation d'Ataccama comme plateforme de gestion des données d'entreprise, établissant les capacités de catalogage et de gouvernance des métadonnées",
          "Construction de pipelines ETL/ELT de production extrayant les données financières du système Core Banking Oracle Finacle et du système de gestion de trésorerie Calypso vers PostgreSQL et Delta Lake",
          "Implémentation du Change Data Capture (CDC) et des capacités de streaming en temps réel pour la synchronisation des données entre les systèmes de gestion de trésorerie et l'entrepôt de données d'entreprise, permettant le suivi et l'analytique des risques en quasi-temps réel",
          "Utilisation extensive des services AWS : S3 pour le stockage, Athena pour les requêtes serverless, Lambda pour le traitement événementiel, RDS et Redshift pour les bases de données et l'entreposage managés, Kinesis pour les pipelines ML en streaming temps réel, SageMaker pour l'entraînement et le déploiement de modèles, EC2 pour le calcul – le tout orchestré via le SDK boto3",
          "Mise en place de pipelines CI/CD basés sur GitHub pour tous les workflows d'ingénierie de données, garantissant des déploiements versionnés, reproductibles et auditables à travers les environnements de développement, staging et production",
          "Administration de SAP Datasphere comme plateforme d'entreposage de données d'entreprise, intégrant les sources de données structurées et non structurées à travers l'organisation",
          "Conception et déploiement d'une plateforme de chat multi-LLM d'entreprise (OpenAI, Claude, LLaMA, Gemini via AWS Bedrock et Databricks) avec des capacités d'Agents IA et de Text-to-SQL ; construction de pipelines RAG avec des architectures de bases vectorielles (FAISS) pour l'intelligence documentaire automatisée et la recherche de connaissances",
          "Développement d'applications d'analytique prédictive pour le suivi en temps réel des risques financiers, la notation des risques de contrepartie et la détection d'anomalies, fournissant de l'intelligence actionnable aux décideurs seniors",
          "Automatisation et amélioration de l'Indice Africain des Matières Premières et des tableaux de bord internes sur les matières premières à travers 54 pays africains, améliorant la cohérence, la reproductibilité et la profondeur analytique",
          "Initiation de la refonte du cadre méthodologique de l'Indice Africain des Matières Premières pour renforcer sa robustesse analytique et son alignement avec les meilleures pratiques mondiales",
          "Construction de pipelines de modélisation ML et économétrique de bout en bout (Python, PySpark) pour la prédiction des flux commerciaux, les schémas d'intégration régionale et les prévisions macroéconomiques inter-pays utilisant les données du FMI DOTS, CNUCED et OMC, avec des workflows MLOps via Databricks MLflow et GitHub CI/CD",
          "Amélioration des jeux de données de recherche à travers des processus de qualité des données, d'harmonisation et de standardisation méthodologique pour soutenir les futures analyses économétriques et politiques",
        ],
        sortOrder: 0,
      },
      {
        role: "Data Engineer",
        roleFr: "Ingénieur de Données",
        organization: "International Telecommunication Union (ITU)",
        location: "Remote",
        startDate: "Dec 2024",
        endDate: "May 2025",
        description: [
          "Designed and implemented an automated ETL pipeline on Databricks to process heterogeneous infrastructure datasets from six countries (.csv, .xlsx, .gpkg, .tiff), enabling scalable multi-format data ingestion",
          "Developed a dynamic Data Quality (DQ) framework with rule-based checks (completeness, consistency, geographic integrity) and generated dual-format reports (.csv/.xlsx) with diagnostics and remediation guidance",
          "Integrated backend logic into the CPP toolkit frontend, enabling users to upload data, trigger preprocessing, and download reports via a seamless web interface",
          "Delivered YAML-based configuration for pipeline portability and no-code extensibility; coordinated full testing and deployment in shared compute environments",
          "Produced a video walkthrough and technical handover package for long-term sustainability and knowledge transfer",
        ],
        descriptionFr: [
          "Conception et implémentation d'un pipeline ETL automatisé sur Databricks pour traiter des jeux de données d'infrastructure hétérogènes provenant de six pays (.csv, .xlsx, .gpkg, .tiff), permettant une ingestion de données multi-formats évolutive",
          "Développement d'un cadre dynamique de qualité des données (DQ) avec des contrôles basés sur des règles (complétude, cohérence, intégrité géographique) et génération de rapports double format (.csv/.xlsx) avec diagnostics et conseils de remédiation",
          "Intégration de la logique backend dans le frontend du toolkit CPP, permettant aux utilisateurs de télécharger des données, déclencher le prétraitement et télécharger des rapports via une interface web fluide",
          "Livraison d'une configuration basée sur YAML pour la portabilité des pipelines et l'extensibilité sans code ; coordination des tests complets et du déploiement dans des environnements de calcul partagés",
          "Production d'un guide vidéo et d'un package de transfert technique pour la durabilité à long terme et le transfert de connaissances",
        ],
        sortOrder: 1,
      },
      {
        role: "Statistician & Econometrician",
        roleFr: "Statisticien & Économètre",
        organization: "International Cocoa Organization (ICCO)",
        location: "Abidjan, Côte d'Ivoire",
        startDate: "Apr 2017",
        endDate: "Sep 2023",
        description: [
          "Designed and maintained a tailored statistical database application serving as the organization's central data architecture for cocoa market intelligence, streamlining reporting workflows and ensuring data consistency across member countries",
          "Built forecasting models (ARIMA, VAR, VECM) to project global supply, demand, and pricing trends in the cocoa economy, directly informing strategic decisions for ICCO member countries and global stakeholders",
          "Authored and contributed to the Monthly Market Reports and the Quarterly Bulletin of Cocoa Statistics, establishing robust data pipelines for timely and accurate dissemination of market insights",
          "Led annual stock surveys across European warehouses to estimate regional and global end-of-season cocoa bean inventories, managing complex multi-site data collection and validation workflows",
          "Collected, validated, and harmonized global cocoa market data from multiple international sources (futures markets, national statistics, trade data), implementing data quality standards and governance processes",
          "Conducted econometric analyses of price volatility, supply–demand imbalances, and trade flow dynamics to produce evidence-based policy recommendations",
        ],
        descriptionFr: [
          "Conception et maintenance d'une application de base de données statistique sur mesure servant d'architecture centrale de données pour l'intelligence du marché du cacao, rationalisant les workflows de reporting et garantissant la cohérence des données entre les pays membres",
          "Construction de modèles de prévision (ARIMA, VAR, VECM) pour projeter les tendances mondiales de l'offre, de la demande et des prix dans l'économie du cacao, informant directement les décisions stratégiques des pays membres de l'ICCO et des parties prenantes mondiales",
          "Rédaction et contribution aux Rapports Mensuels du Marché et au Bulletin Trimestriel des Statistiques du Cacao, établissant des pipelines de données robustes pour une diffusion rapide et précise des informations de marché",
          "Direction des enquêtes annuelles de stocks dans les entrepôts européens pour estimer les inventaires régionaux et mondiaux de fèves de cacao en fin de saison, gérant des workflows complexes de collecte et validation de données multi-sites",
          "Collecte, validation et harmonisation des données mondiales du marché du cacao provenant de multiples sources internationales (marchés à terme, statistiques nationales, données commerciales), implémentant des normes de qualité des données et des processus de gouvernance",
          "Réalisation d'analyses économétriques de la volatilité des prix, des déséquilibres offre-demande et des dynamiques des flux commerciaux pour produire des recommandations politiques fondées sur les données",
        ],
        sortOrder: 2,
      },
      {
        role: "Researcher (Data Scientist / Statistician)",
        roleFr: "Chercheur (Data Scientist / Statisticien)",
        organization: "United Nations Institute for Disarmament Research (UNIDIR)",
        location: "Remote",
        startDate: "May 2023",
        endDate: "Aug 2023",
        description: [
          "Designed multi-country survey data architectures (Nigeria, Colombia, Iraq, Lake Chad Basin) for the MEAC disarmament and reintegration research project, managing end-to-end data pipelines",
          "Programmed and managed digital data collection via SurveyCTO with automated real-time quality control and validation rules; liaised with field teams on data consistency",
          "Led data cleaning, harmonization, and multivariate statistical analysis pipelines using R and STATA, producing evidence-based insights for post-conflict transition outcomes",
          "Delivered interactive dashboards and visualizations (Power BI) to support stakeholder engagement; ensured compliance with UN data governance and protection standards",
        ],
        descriptionFr: [
          "Conception d'architectures de données d'enquêtes multi-pays (Nigéria, Colombie, Irak, Bassin du Lac Tchad) pour le projet de recherche MEAC sur le désarmement et la réintégration, gérant les pipelines de données de bout en bout",
          "Programmation et gestion de la collecte de données numériques via SurveyCTO avec contrôle qualité automatisé en temps réel et règles de validation ; liaison avec les équipes de terrain sur la cohérence des données",
          "Direction du nettoyage, de l'harmonisation et des pipelines d'analyse statistique multivariée utilisant R et STATA, produisant des analyses fondées sur les données pour les résultats de transition post-conflit",
          "Livraison de tableaux de bord interactifs et de visualisations (Power BI) pour soutenir l'engagement des parties prenantes ; assurance de la conformité avec les normes de gouvernance et de protection des données de l'ONU",
        ],
        sortOrder: 3,
      },
      {
        role: "Data Analyst Consultant",
        roleFr: "Consultant Analyste de Données",
        organization: "International Organization for Migration (IOM)",
        location: "Remote",
        startDate: "Apr 2022",
        endDate: "Nov 2022",
        description: [
          "Developed reproducible R scripts and markdown reports to analyze Migrant Health and Psychosocial Support (MHPSS) data across 8 West African countries, establishing standardized analytical pipelines",
          "Conducted impact evaluation analyses on migration in Guinea, The Gambia, Nigeria, and Senegal, delivering evidence-based findings for programme improvement",
          "Ensured analytical workflows were fully documented and automated for transparency and scalability across future assessments",
        ],
        descriptionFr: [
          "Développement de scripts R reproductibles et de rapports markdown pour analyser les données de Santé des Migrants et de Soutien Psychosocial (MHPSS) dans 8 pays d'Afrique de l'Ouest, établissant des pipelines analytiques standardisés",
          "Réalisation d'analyses d'évaluation d'impact sur la migration en Guinée, Gambie, Nigéria et Sénégal, fournissant des résultats fondés sur les données pour l'amélioration des programmes",
          "Assurance que les workflows analytiques étaient entièrement documentés et automatisés pour la transparence et l'évolutivité des évaluations futures",
        ],
        sortOrder: 4,
      },
      {
        role: "KoboToolBox Consultant",
        roleFr: "Consultant KoboToolBox",
        organization: "United Nations High Commissioner for Refugees (UNHCR)",
        location: "Abidjan, Côte d'Ivoire",
        startDate: "Dec 2016",
        endDate: "Feb 2017",
        description: [
          "Designed and implemented a digital data collection system using KoboToolBox to support field operations and monitoring activities for refugee programmes",
          "Trained field personnel on effective use of online data collection tools and ensured smooth transition from paper-based methods to digital workflows",
          "Digitized all existing UNHCR Côte d'Ivoire data collection instruments and provided ongoing technical guidance to ensure data integrity and reporting consistency",
        ],
        descriptionFr: [
          "Conception et implémentation d'un système de collecte de données numériques utilisant KoboToolBox pour soutenir les opérations de terrain et les activités de suivi des programmes pour les réfugiés",
          "Formation du personnel de terrain sur l'utilisation efficace des outils de collecte de données en ligne et assurance d'une transition fluide des méthodes papier vers les workflows numériques",
          "Numérisation de tous les instruments de collecte de données existants du HCR Côte d'Ivoire et fourniture de conseils techniques continus pour garantir l'intégrité des données et la cohérence des rapports",
        ],
        sortOrder: 5,
      },
      {
        role: "Monitoring & Evaluation Manager",
        roleFr: "Responsable Suivi & Évaluation",
        organization: "Barry-Callebaut (SACO)",
        location: "Abidjan, Côte d'Ivoire",
        startDate: "Aug 2016",
        endDate: "Apr 2017",
        description: [
          "Designed and managed the geotraceability data collection system for the Cocoa Horizons program, architecting data flows from field surveys through to analytical dashboards",
          "Built and maintained master data systems for farmer organizations; defined and monitored KPIs through dashboards to inform strategic decision-making",
          "Delivered a full M&E framework including data architecture, survey design, field execution, impact evaluation protocols, and progress tracking systems",
          "Conducted fieldwork on cocoa demo plots and fermentation practices to evaluate agronomic innovations, combining field statistics with geospatial data collection",
        ],
        descriptionFr: [
          "Conception et gestion du système de collecte de données de géotraçabilité pour le programme Cocoa Horizons, architecturant les flux de données des enquêtes de terrain jusqu'aux tableaux de bord analytiques",
          "Construction et maintenance des systèmes de données maîtres pour les organisations de producteurs ; définition et suivi de KPI via des tableaux de bord pour éclairer la prise de décision stratégique",
          "Livraison d'un cadre complet de S&E incluant architecture de données, conception d'enquêtes, exécution terrain, protocoles d'évaluation d'impact et systèmes de suivi des progrès",
          "Réalisation de travaux de terrain sur les parcelles de démonstration cacao et les pratiques de fermentation pour évaluer les innovations agronomiques, combinant statistiques de terrain et collecte de données géospatiales",
        ],
        sortOrder: 6,
      },
      {
        role: "Consultant",
        roleFr: "Consultant",
        organization: "International Crops Research Institute for the Semi-Arid Tropics (ICRISAT)",
        location: "Bamako, Mali",
        startDate: "Jul 2016",
        endDate: "Jul 2016",
        description: [
          "Facilitated hands-on training for multidisciplinary research professionals on the use of Open Data Kit (ODK) and Cspro for digital survey design and data collection",
          "Introduced participants to statistical packages (R, STATA) for analyzing experimental and survey data",
          "Delivered practical case exercises to enhance participants' analytical and data management skills",
        ],
        descriptionFr: [
          "Animation de formations pratiques pour des professionnels de recherche multidisciplinaires sur l'utilisation d'Open Data Kit (ODK) et Cspro pour la conception d'enquêtes numériques et la collecte de données",
          "Introduction des participants aux logiciels statistiques (R, STATA) pour l'analyse de données expérimentales et d'enquêtes",
          "Livraison d'exercices pratiques de cas pour renforcer les compétences analytiques et de gestion des données des participants",
        ],
        sortOrder: 7,
      },
      {
        role: "Monitoring & Evaluation Officer",
        roleFr: "Chargé de Suivi & Évaluation",
        organization: "Family Health International (FHI360)",
        location: "Abidjan, Côte d'Ivoire",
        startDate: "Nov 2015",
        endDate: "Jul 2016",
        description: [
          "Designed evaluation analysis plans and developed STATA-based scripts for automated data processing across multiple public health projects",
          "Contributed to the development of four impact evaluation protocols and co-authored a peer-reviewed article on adolescent behavioral health",
          "Drafted statistical sections of research protocols, study reports, and manuscripts; provided technical and statistical support for M&E activities",
        ],
        descriptionFr: [
          "Conception de plans d'analyse d'évaluation et développement de scripts basés sur STATA pour le traitement automatisé des données à travers de multiples projets de santé publique",
          "Contribution au développement de quatre protocoles d'évaluation d'impact et co-rédaction d'un article évalué par les pairs sur la santé comportementale des adolescents",
          "Rédaction des sections statistiques des protocoles de recherche, rapports d'études et manuscrits ; fourniture d'un soutien technique et statistique pour les activités de S&E",
        ],
        sortOrder: 8,
      },
      {
        role: "Data Manager",
        roleFr: "Gestionnaire de Données",
        organization: "International Centre for Research in Agroforestry (ICRAF)",
        location: "Abidjan, Côte d'Ivoire",
        startDate: "Jun 2013",
        endDate: "Oct 2015",
        description: [
          "Designed and implemented M&E data architectures for agroforestry research projects; developed and maintained relational databases (Access, PostgreSQL) to monitor performance indicators",
          "Conducted 10+ household studies (baselines, midterms, endlines) across West Africa; migrated data collection workflows from paper to digital systems using Open Data Kit",
          "Automated data analysis and reporting pipelines using R, Excel, and Access; trained research teams in Kenya and Côte d'Ivoire on data quality best practices",
          "Managed complex experimental and survey datasets; performed advanced statistical analyses using R and STATA for peer-reviewed research outputs",
        ],
        descriptionFr: [
          "Conception et implémentation d'architectures de données S&E pour les projets de recherche en agroforesterie ; développement et maintenance de bases de données relationnelles (Access, PostgreSQL) pour le suivi des indicateurs de performance",
          "Réalisation de plus de 10 études auprès des ménages (référence, mi-parcours, fin de projet) à travers l'Afrique de l'Ouest ; migration des workflows de collecte de données du papier vers des systèmes numériques utilisant Open Data Kit",
          "Automatisation des pipelines d'analyse de données et de reporting utilisant R, Excel et Access ; formation des équipes de recherche au Kenya et en Côte d'Ivoire sur les meilleures pratiques de qualité des données",
          "Gestion de jeux de données expérimentales et d'enquêtes complexes ; réalisation d'analyses statistiques avancées utilisant R et STATA pour des publications de recherche évaluées par les pairs",
        ],
        sortOrder: 9,
      },
      {
        role: "Data Manager",
        roleFr: "Gestionnaire de Données",
        organization: "Programme ANRS Coopération Côte d'Ivoire (PAC-CI)",
        location: "Abidjan, Côte d'Ivoire",
        startDate: "Nov 2012",
        endDate: "Jun 2013",
        description: [
          "Harmonized 16 epidemiological datasets from 8 West African countries for the IeDEA consortium, designing cross-country data integration architecture for HIV/AIDS research",
          "Automated key project indicators reporting using custom-built SQL and VBA scripts, reducing manual effort and improving reproducibility",
          "Conducted rigorous data quality assurance, validation, and consistency checks prior to submission to the regional hub in Bordeaux, France",
        ],
        descriptionFr: [
          "Harmonisation de 16 jeux de données épidémiologiques provenant de 8 pays d'Afrique de l'Ouest pour le consortium IeDEA, concevant une architecture d'intégration de données inter-pays pour la recherche sur le VIH/SIDA",
          "Automatisation du reporting des indicateurs clés du projet à l'aide de scripts SQL et VBA personnalisés, réduisant l'effort manuel et améliorant la reproductibilité",
          "Réalisation d'assurance qualité rigoureuse des données, de validation et de contrôles de cohérence avant soumission au hub régional de Bordeaux, France",
        ],
        sortOrder: 10,
      },
    ];

    for (const exp of experiences) {
      await prisma.experience.create({ data: exp });
    }
    console.log(`  Seeded ${experiences.length} experiences`);
  }

  // Seed Skill Categories & Skills
  const skillCatCount = await prisma.skillCategory.count();
  if (skillCatCount === 0) {
    console.log("Seeding skill categories...");
    const categories = [
      {
        name: "AI & Machine Learning",
        nameFr: "IA & Apprentissage Automatique",
        sortOrder: 0,
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
        sortOrder: 1,
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
        sortOrder: 2,
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
        sortOrder: 3,
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
        sortOrder: 4,
        skills: [
          { name: "Data Strategy & Governance (DAMA-DMBOK)", level: 92 },
          { name: "Project Management", level: 90 },
          { name: "Team Leadership & Mentoring", level: 88 },
          { name: "Stakeholder Communication", level: 92 },
          { name: "M&E / Survey Design / KoboToolBox", level: 90 },
        ],
      },
    ];

    for (const cat of categories) {
      const { skills, ...catData } = cat;
      await prisma.skillCategory.create({
        data: {
          ...catData,
          skills: {
            create: skills,
          },
        },
      });
    }
    console.log(`  Seeded ${categories.length} skill categories`);
  }

  // Seed Education
  const eduCount = await prisma.education.count();
  if (eduCount === 0) {
    console.log("Seeding education...");
    const educations = [
      { degree: "MBA, Specialization in Artificial Intelligence", degreeFr: "MBA, Spécialisation en Intelligence Artificielle", institution: "Nexford University", year: "2026", location: "USA (Online)", sortOrder: 0 },
      { degree: "Professional Certificate in Data Engineering, AI & Data Science", degreeFr: "Certificat Professionnel en Ingénierie des Données, IA & Science des Données", institution: "Massachusetts Institute of Technology (MIT)", year: "2025", location: "USA (Online)", sortOrder: 1 },
      { degree: "Applied AI and Data Science Program", degreeFr: "Programme Appliqué en IA et Science des Données", institution: "Massachusetts Institute of Technology (MIT)", year: "2025", location: "USA (Online)", sortOrder: 2 },
      { degree: "MicroMasters in Data, Economics & Development Policy", degreeFr: "MicroMasters en Données, Économie & Politique de Développement", institution: "Massachusetts Institute of Technology (MIT)", year: "2021", location: "USA (Online)", sortOrder: 3 },
      { degree: "Financial Modelling & Valuation Analyst (FMVA)", degreeFr: "Analyste en Modélisation Financière & Valorisation (FMVA)", institution: "Corporate Finance Institute (CFI)", year: "2020", location: "Canada (Online)", sortOrder: 4 },
      { degree: "Master's in Statistics & Econometrics", degreeFr: "Master en Statistique & Économétrie", institution: "Université Toulouse I Capitole", year: "2017", location: "Toulouse, France", sortOrder: 5 },
      { degree: "Data Science Specialization Certificate", degreeFr: "Certificat de Spécialisation en Science des Données", institution: "Johns Hopkins University", year: "2015", location: "USA (Online)", sortOrder: 6 },
      { degree: "Ingénieur Statisticien (Statistics & Information System Engineer)", degreeFr: "Ingénieur Statisticien (Statistique & Systèmes d'Information)", institution: "ENSEA (École Nationale Supérieure de Statistique et d'Économie Appliquée)", year: "2012", location: "Abidjan, Côte d'Ivoire", sortOrder: 7 },
      { degree: "Bachelor in Statistics & Information Systems", degreeFr: "Licence en Statistique & Systèmes d'Information", institution: "ENSEA (École Nationale Supérieure de Statistique et d'Économie Appliquée)", year: "2009", location: "Abidjan, Côte d'Ivoire", sortOrder: 8 },
    ];

    for (const edu of educations) {
      await prisma.education.create({ data: edu });
    }
    console.log(`  Seeded ${educations.length} education entries`);
  }

  // Seed Certifications
  const certCount = await prisma.certification.count();
  if (certCount === 0) {
    console.log("Seeding certifications...");
    const certifications = [
      { name: "Professional Certificate in Data Engineering, AI & Data Science", issuer: "MIT", year: "2025", sortOrder: 0 },
      { name: "Applied AI and Data Science Program", issuer: "MIT", year: "2025", sortOrder: 1 },
      { name: "MicroMasters in Data, Economics & Development Policy", issuer: "MIT", year: "2021", sortOrder: 2 },
      { name: "Financial Modelling & Valuation Analyst (FMVA)", issuer: "Corporate Finance Institute", year: "2020", sortOrder: 3 },
      { name: "Data Science Specialization", issuer: "Johns Hopkins University", year: "2015", sortOrder: 4 },
    ];

    for (const cert of certifications) {
      await prisma.certification.create({ data: cert });
    }
    console.log(`  Seeded ${certifications.length} certifications`);
  }

  // Seed Projects (if none exist)
  const projectCount = await prisma.project.count();
  if (projectCount === 0) {
    console.log("Seeding projects...");
    const projects = [
      { title: "NexusAI - Enterprise AI Assistant", titleFr: "NexusAI - Assistant IA d'Entreprise", slug: "nexusai-enterprise-ai-assistant", description: "Generative AI-powered knowledge management assistant for Afreximbank. Built with LangChain, Azure OpenAI, and RAG architecture to enable intelligent document search and automated report generation.", descriptionFr: "Assistant de gestion des connaissances alimenté par l'IA générative pour Afreximbank. Construit avec LangChain, Azure OpenAI et l'architecture RAG pour permettre la recherche intelligente de documents et la génération automatisée de rapports.", technologies: ["Python", "LangChain", "Azure OpenAI", "RAG", "FastAPI", "React"], category: "AI/ML", featured: true, sortOrder: 0 },
      { title: "Enterprise Lakehouse Architecture", titleFr: "Architecture Lakehouse d'Entreprise", slug: "enterprise-lakehouse-architecture", description: "Designed and implemented a modern data lakehouse on Azure Databricks for unified batch and real-time analytics. Handles 500M+ banking transactions with medallion architecture (Bronze/Silver/Gold).", descriptionFr: "Conception et mise en œuvre d'un data lakehouse moderne sur Azure Databricks pour l'analytique batch et temps réel unifiée. Traitement de plus de 500M de transactions bancaires avec architecture medallion (Bronze/Silver/Gold).", technologies: ["Azure", "Databricks", "Spark", "Delta Lake", "Python", "SQL"], category: "Data Engineering", featured: true, sortOrder: 1 },
      { title: "Banking ETL Pipeline", titleFr: "Pipeline ETL Bancaire", slug: "banking-etl-pipeline", description: "High-performance ETL system processing 500M+ transactions daily with 99.9% SLA compliance. Includes real-time monitoring, error handling, and automated data quality checks.", descriptionFr: "Système ETL haute performance traitant plus de 500M de transactions quotidiennement avec conformité SLA de 99,9%. Inclut la surveillance en temps réel, la gestion des erreurs et les contrôles automatisés de qualité des données.", technologies: ["Python", "Apache Airflow", "PostgreSQL", "Azure", "Docker"], category: "Data Engineering", featured: true, sortOrder: 2 },
      { title: "Master Data Management Solution", titleFr: "Solution MDM (Master Data Management)", slug: "master-data-management-solution", description: "Enterprise MDM platform ensuring data consistency and quality across 50+ countries. Implemented data governance frameworks, deduplication algorithms, and golden record management.", descriptionFr: "Plateforme MDM d'entreprise assurant la cohérence et la qualité des données dans plus de 50 pays. Mise en œuvre de cadres de gouvernance des données, d'algorithmes de déduplication et de gestion des enregistrements de référence.", technologies: ["Python", "SQL", "Azure", "Power BI", "REST APIs"], category: "Data Governance", featured: true, sortOrder: 3 },
      { title: "Credit Risk Scoring Model", titleFr: "Modèle de Notation du Risque de Crédit", slug: "credit-risk-scoring-model", description: "Machine learning model for credit risk assessment using gradient boosting and deep learning. Achieved 94% accuracy in default prediction with interpretable model explanations.", descriptionFr: "Modèle d'apprentissage automatique pour l'évaluation du risque de crédit utilisant le gradient boosting et le deep learning. Précision de 94% dans la prédiction de défaut avec des explications de modèle interprétables.", technologies: ["Python", "XGBoost", "TensorFlow", "SHAP", "scikit-learn"], category: "AI/ML", featured: false, sortOrder: 4 },
      { title: "Global ICT Development Index", titleFr: "Indice Mondial de Développement des TIC", slug: "global-ict-development-index", description: "Predictive models for ITU's global ICT development indicators using data from 193 member states. Automated data pipelines and interactive policy dashboards.", descriptionFr: "Modèles prédictifs pour les indicateurs de développement des TIC de l'UIT à partir de données de 193 États membres. Pipelines de données automatisés et tableaux de bord interactifs pour les décideurs.", technologies: ["Python", "R", "Power BI", "PostgreSQL", "Azure"], category: "Analytics", featured: false, sortOrder: 5 },
      { title: "Migration Flow Analytics", titleFr: "Analyse des Flux Migratoires", slug: "migration-flow-analytics", description: "Real-time analytics platform for monitoring migration patterns and flows. Processing 100K+ records monthly with geospatial visualization and predictive modeling.", descriptionFr: "Plateforme d'analyse en temps réel pour le suivi des patterns et flux migratoires. Traitement de plus de 100K enregistrements mensuels avec visualisation géospatiale et modélisation prédictive.", technologies: ["Python", "PostgreSQL", "QGIS", "Power BI", "R"], category: "Analytics", featured: false, sortOrder: 6 },
      { title: "NLP Document Analysis System", titleFr: "Système d'Analyse de Documents NLP", slug: "nlp-document-analysis-system", description: "Natural Language Processing system for analyzing UN disarmament resolutions and documents. Includes topic modeling, sentiment analysis, and automated summarization.", descriptionFr: "Système de traitement du langage naturel pour l'analyse des résolutions et documents de désarmement de l'ONU. Inclut la modélisation de sujets, l'analyse de sentiment et le résumé automatisé.", technologies: ["Python", "spaCy", "BERT", "ElasticSearch", "Flask"], category: "AI/ML", featured: false, sortOrder: 7 },
    ];

    for (const project of projects) {
      await prisma.project.create({ data: project });
    }
    console.log(`  Seeded ${projects.length} projects`);
  }

  // Seed Publications (if none exist)
  const pubCount = await prisma.publication.count();
  if (pubCount === 0) {
    console.log("Seeding publications...");
    const publications = [
      { title: "Africa's $10 Trillion Opportunity: Regional Dynamics 2010-2025", titleFr: "L'opportunité de 10 000 milliards de dollars de l'Afrique : dynamiques régionales 2010-2025", slug: "africa-10trillion-opportunity-regional-dynamics-2010-2025", abstract: "A comprehensive analytical report examining Africa's economic trajectory and the $10 trillion opportunity across regional dynamics from 2010 to 2025.", abstractFr: "Un rapport analytique complet examinant la trajectoire économique de l'Afrique et l'opportunité de 10 000 milliards de dollars à travers les dynamiques régionales de 2010 à 2025.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa 10Trillion Opportunity Regional Dynamics 2010-2025.pdf", tags: ["Africa", "Economic Growth", "Regional Dynamics", "Trade", "Investment"], featured: true },
      { title: "Africa's $10 Trillion Opportunity: Regional Dynamics", titleFr: "L'opportunité de 10 000 milliards de dollars de l'Afrique : dynamiques régionales", slug: "africa-10trillion-opportunity-regional-dynamics", abstract: "An in-depth analysis of Africa's $10 trillion economic opportunity, exploring regional dynamics, sectoral drivers, and the conditions needed to unlock transformative growth across the continent.", abstractFr: "Une analyse approfondie de l'opportunité économique de 10 000 milliards de dollars de l'Afrique, explorant les dynamiques régionales, les moteurs sectoriels et les conditions nécessaires.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa 10Trillion Opportunity Regional Dynamics.pdf", tags: ["Africa", "Economic Opportunity", "Growth", "Regional Analysis"], featured: false },
      { title: "Africa's Cultural Power: A $100B Growth Frontier", titleFr: "Le pouvoir culturel de l'Afrique : une frontière de croissance de 100 milliards de dollars", slug: "africa-cultural-power-100b-growth-frontier", abstract: "This report explores Africa's creative and cultural industries as a $100 billion growth frontier.", abstractFr: "Ce rapport explore les industries créatives et culturelles de l'Afrique comme une frontière de croissance de 100 milliards de dollars.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa Cultural Power - A $100B Growth Frontier.pdf", tags: ["Africa", "Creative Industries", "Cultural Economy", "Growth"], featured: false },
      { title: "Africa Economies' Heavy Reliance on Commodities", titleFr: "La forte dépendance des économies africaines aux matières premières", slug: "africa-economies-heavy-reliance-commodities", abstract: "An analytical snapshot of African economies' continued heavy reliance on commodities.", abstractFr: "Un état des lieux analytique de la dépendance continue des économies africaines aux matières premières.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa Economies Heavy Reliance On Commodities - A Snapshot As At August 2025.pdf", tags: ["Africa", "Commodities", "Economic Diversification", "Trade"], featured: false },
      { title: "Africa Trade Finance Infrastructure Growth", titleFr: "Croissance de l'infrastructure de financement du commerce en Afrique", slug: "africa-trade-finance-infrastructure-growth", abstract: "An analysis of trade finance infrastructure development across Africa.", abstractFr: "Une analyse du développement de l'infrastructure de financement du commerce à travers l'Afrique.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Trade Finance", pdfUrl: "/publications/Africa Trade Finance Infrastructure Growth.pdf", tags: ["Trade Finance", "Africa", "Infrastructure", "AfCFTA", "Development Finance"], featured: true },
      { title: "Africa's Youth Dividend: Future Workforce", titleFr: "Le dividende jeunesse de l'Afrique : la main-d'œuvre du futur", slug: "africa-youth-dividend-future-workforce", abstract: "This report examines Africa's demographic dividend and the potential of its young population as a transformative workforce.", abstractFr: "Ce rapport examine le dividende démographique de l'Afrique et le potentiel de sa jeune population comme main-d'œuvre transformatrice.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa Youth Dividend Future Workforce.pdf", tags: ["Africa", "Youth", "Demographics", "Workforce", "Education"], featured: false },
      { title: "Africa's Digital Future: Overview", titleFr: "L'avenir numérique de l'Afrique : vue d'ensemble", slug: "africa-digital-future-overview", abstract: "A comprehensive overview of Africa's digital transformation journey.", abstractFr: "Une vue d'ensemble complète du parcours de transformation numérique de l'Afrique.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Digital & Fintech", pdfUrl: "/publications/Africa-Digital-Future-Overview.pdf", tags: ["Africa", "Digital Transformation", "Technology", "Connectivity", "E-Governance"], featured: false },
      { title: "Africa's AI Leap: Finance & Sovereignty", titleFr: "Le bond de l'IA en Afrique : finance et souveraineté", slug: "africa-ai-leap-finance-sovereignty", abstract: "An analysis of how artificial intelligence is transforming Africa's financial sector and questions of data sovereignty.", abstractFr: "Une analyse de la façon dont l'intelligence artificielle transforme le secteur financier de l'Afrique et les questions de souveraineté des données.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "AI & Technology", pdfUrl: "/publications/Africa's AI Leap - Finance & Sovereignty.pdf", tags: ["AI", "Finance", "Data Sovereignty", "Africa", "Fintech"], featured: true },
      { title: "Africa's AI Readiness & the Digital Skills Imperative", titleFr: "La préparation de l'Afrique à l'IA et l'impératif des compétences numériques", slug: "africa-ai-readiness-digital-skills-imperative", abstract: "This report assesses Africa's readiness for the AI revolution and the critical need for digital skills development.", abstractFr: "Ce rapport évalue la préparation de l'Afrique à la révolution de l'IA et le besoin critique de développement des compétences numériques.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "AI & Technology", pdfUrl: "/publications/Africa's AI Readiness & the Digital Skills Imperative.pdf", tags: ["AI", "Digital Skills", "Africa", "Education", "Technology Readiness"], featured: false },
      { title: "Africa's Commodity Leap: From Raw Loss to Value Power", titleFr: "Le bond des matières premières de l'Afrique : de la perte brute au pouvoir de la valeur", slug: "africa-commodity-leap-raw-loss-value-power", abstract: "An examination of Africa's commodity value chain transformation.", abstractFr: "Un examen de la transformation de la chaîne de valeur des matières premières de l'Afrique.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa's Commodity Leap - From Raw Loss to Value Power.pdf", tags: ["Commodities", "Value Addition", "Industrialization", "Africa", "Trade"], featured: false },
      { title: "Africa's Digital Future: Innovation Driving Jobs", titleFr: "L'avenir numérique de l'Afrique : l'innovation au service de l'emploi", slug: "africa-digital-future-innovation-driving-jobs", abstract: "This report explores how digital innovation is creating new employment opportunities across Africa.", abstractFr: "Ce rapport explore comment l'innovation numérique crée de nouvelles opportunités d'emploi à travers l'Afrique.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Digital & Fintech", pdfUrl: "/publications/Africa's Digital Future - Innovation Driving Jobs.pdf", tags: ["Digital Innovation", "Jobs", "Africa", "Startups", "Technology"], featured: false },
      { title: "Africa's Inflation-FX-Debt Stability Framework", titleFr: "Cadre de stabilité inflation-change-dette de l'Afrique", slug: "africa-inflation-fx-debt-stability-framework", abstract: "A macroeconomic analysis presenting a stability framework for managing inflation, foreign exchange volatility, and debt sustainability.", abstractFr: "Une analyse macroéconomique présentant un cadre de stabilité pour gérer les défis interconnectés de l'inflation, de la volatilité du change et de la soutenabilité de la dette.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Macroeconomics", pdfUrl: "/publications/Africa's Inflation–FX–Debt Stability Framework.pdf", tags: ["Inflation", "Foreign Exchange", "Debt", "Macroeconomics", "Africa"], featured: false },
      { title: "Africa's Missing Billions: A Data-Driven Call to End Illicit Financial Flows", titleFr: "Les milliards manquants de l'Afrique : un appel basé sur les données pour mettre fin aux flux financiers illicites", slug: "africa-missing-billions-illicit-financial-flows", abstract: "A data-driven analysis of illicit financial flows from Africa.", abstractFr: "Une analyse basée sur les données des flux financiers illicites provenant d'Afrique.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa's Missing Billions - A Data-Driven Call to End Illicit Financial Flows.pdf", tags: ["Illicit Financial Flows", "Africa", "Data Analysis", "Governance", "Policy"], featured: false },
      { title: "Africa's Prosperity Must Be Built by Africans", titleFr: "La prospérité de l'Afrique doit être construite par les Africains", slug: "africa-prosperity-built-by-africans", abstract: "A thought-leadership piece arguing for African-led development strategies.", abstractFr: "Un article de leadership éclairé plaidant pour des stratégies de développement dirigées par les Africains.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa's prosperity must be built by Africans.pdf", tags: ["Africa", "Development", "Leadership", "Self-Reliance", "Policy"], featured: false },
      { title: "Cocoa Demand Rewired: Global Grindings & Origin Rise", titleFr: "La demande de cacao redéfinie : broyages mondiaux et montée des origines", slug: "cocoa-demand-rewired-global-grindings-origin-rise", abstract: "An analysis of shifting global cocoa demand patterns.", abstractFr: "Une analyse de l'évolution des schémas de demande mondiale de cacao.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Agriculture", pdfUrl: "/publications/Cocoa Demand Rewired - Global Grindings & Origin Rise.pdf", tags: ["Cocoa", "Commodities", "Agriculture", "Global Trade", "Market Analysis"], featured: false },
      { title: "Fintech and Digital Payments in Africa: From Mobile Money to Global Scale", titleFr: "Fintech et paiements numériques en Afrique : du mobile money à l'échelle mondiale", slug: "fintech-digital-payments-africa-mobile-money-global-scale", abstract: "A comprehensive analysis of Africa's fintech revolution.", abstractFr: "Une analyse complète de la révolution fintech en Afrique.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Digital & Fintech", pdfUrl: "/publications/Fintech and Digital Payments in Africa - From Mobile Money to Global Scale.pdf", tags: ["Fintech", "Digital Payments", "Mobile Money", "Africa", "Financial Inclusion"], featured: true },
      { title: "Fintech & Digital Payments in Africa", titleFr: "Fintech et paiements numériques en Afrique", slug: "fintech-digital-payments-africa", abstract: "An overview of the fintech and digital payments landscape across Africa.", abstractFr: "Un aperçu du paysage fintech et des paiements numériques à travers l'Afrique.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Digital & Fintech", pdfUrl: "/publications/Fintech-Digital-Payments-Africa.pdf", tags: ["Fintech", "Digital Payments", "Africa", "Banking", "Technology"], featured: false },
      { title: "Global Cotton Market Analysis", titleFr: "Analyse du marché mondial du coton", slug: "global-cotton-market-analysis", abstract: "A data-driven analysis of the global cotton market.", abstractFr: "Une analyse basée sur les données du marché mondial du coton.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Agriculture", pdfUrl: "/publications/Global-Cotton-Market-Analysis.pdf", tags: ["Cotton", "Agriculture", "Global Trade", "Market Analysis", "Africa"], featured: false },
      { title: "Healthtech & Pharma: Africa's Health Sovereignty", titleFr: "Healthtech & Pharma : la souveraineté sanitaire de l'Afrique", slug: "healthtech-pharma-africa-health-sovereignty", abstract: "An analysis of Africa's healthtech and pharmaceutical sector.", abstractFr: "Une analyse du secteur healthtech et pharmaceutique de l'Afrique.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Healthtech & Pharma - Africa's Health Sovereignty.pdf", tags: ["Healthtech", "Pharma", "Africa", "Health Sovereignty", "Innovation"], featured: false },
      { title: "Key Takeaways from DAMA-DMBOK Data Management Framework", titleFr: "Points clés du cadre de gestion des données DAMA-DMBOK", slug: "key-takeaways-dama-dmbok-dmf", abstract: "A practical synthesis of the DAMA-DMBOK Data Management Body of Knowledge framework.", abstractFr: "Une synthèse pratique du cadre DAMA-DMBOK (Data Management Body of Knowledge).", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Data Governance", pdfUrl: "/publications/Key Takeaways From DAMA_DMBOK DMF.pdf", tags: ["Data Governance", "DAMA-DMBOK", "Data Management", "Enterprise", "Best Practices"], featured: false },
      { title: "Multilateral Development Finance Across Africa: A Quick Overview", titleFr: "Le financement multilatéral du développement en Afrique : un aperçu rapide", slug: "multilateral-development-finance-africa-overview", abstract: "A concise overview of multilateral development finance flows to Africa.", abstractFr: "Un aperçu concis des flux de financement multilatéral du développement vers l'Afrique.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Trade Finance", pdfUrl: "/publications/Mutlilateral Development Finance Accross Africa - A Quick Overview.pdf", tags: ["Development Finance", "Multilateral", "Africa", "Aid", "Investment"], featured: false },
      { title: "Price Responsiveness of Artificial Intelligence", titleFr: "La sensibilité au prix de l'intelligence artificielle", slug: "price-responsiveness-artificial-intelligence", abstract: "An economic analysis of AI pricing dynamics.", abstractFr: "Une analyse économique des dynamiques de prix de l'IA.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "AI & Technology", pdfUrl: "/publications/Price Responsiveness of Artificial Intelligence.pdf", tags: ["AI", "Economics", "Pricing", "Market Analysis", "Technology"], featured: false },
      { title: "South-South Cooperation and Africa: Opportunities", titleFr: "La coopération Sud-Sud et l'Afrique : opportunités", slug: "south-south-cooperation-africa-opportunities", abstract: "An analysis of South-South cooperation opportunities for Africa.", abstractFr: "Une analyse des opportunités de coopération Sud-Sud pour l'Afrique.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/South–South Cooperation and Africa Opportunities.pdf", tags: ["South-South Cooperation", "Africa", "Development", "Trade", "Partnerships"], featured: false },
      { title: "The $2 Trillion Imperative: Africa's Path to a Green Industrial Revolution", titleFr: "L'impératif de 2 000 milliards de dollars : la voie de l'Afrique vers une révolution industrielle verte", slug: "2-trillion-imperative-africa-green-industrial-revolution", abstract: "A strategic analysis of Africa's $2 trillion green industrialization opportunity.", abstractFr: "Une analyse stratégique de l'opportunité d'industrialisation verte de 2 000 milliards de dollars de l'Afrique.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/The $2 Trillion Imperative - Africa's Path to a Green Industrial Revolution.pdf", tags: ["Green Industry", "Africa", "Climate", "Renewable Energy", "Sustainability"], featured: false },
      { title: "The R&D Dividend: Knowledge and Growth", titleFr: "Le dividende de la R&D : connaissance et croissance", slug: "rd-dividend-knowledge-growth", abstract: "An analysis of the relationship between R&D investment and economic growth.", abstractFr: "Une analyse de la relation entre l'investissement en recherche et développement et la croissance économique.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/The R&D Dividend – Knowledge and Growth.pdf", tags: ["R&D", "Innovation", "Growth", "Knowledge Economy", "Africa"], featured: false },
      { title: "Unlocking Africa's Agri-Tech Transformation", titleFr: "Débloquer la transformation agri-tech de l'Afrique", slug: "unlocking-africa-agri-tech-transformation", abstract: "A report on the potential of agricultural technology to transform Africa's farming sector.", abstractFr: "Un rapport sur le potentiel de la technologie agricole pour transformer le secteur agricole de l'Afrique.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Agriculture", pdfUrl: "/publications/Unlocking Africa's Agri-Tech Transformation.pdf", tags: ["Agri-Tech", "Agriculture", "Africa", "Innovation", "Food Security"], featured: false },
      { title: "Urban Futures Unlocked: Financing Africa's Cities", titleFr: "Futurs urbains débloqués : financer les villes africaines", slug: "urban-futures-unlocked-financing-africa-cities", abstract: "An analysis of urban financing challenges and opportunities in Africa.", abstractFr: "Une analyse des défis et opportunités de financement urbain en Afrique.", authors: ["Konan Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Urban Futures Unlocked Financing Africa Cities.pdf", tags: ["Urbanization", "Cities", "Africa", "Infrastructure", "Finance"], featured: false },
    ];

    for (const pub of publications) {
      await prisma.publication.create({ data: pub });
    }
    console.log(`  Seeded ${publications.length} publications`);
  }

  // Seed Site Settings
  const settingsCount = await prisma.siteSetting.count();
  if (settingsCount === 0) {
    console.log("Seeding site settings...");
    const settings = [
      { key: "profilePhoto", value: "/images/profile.jpg" },
      { key: "heroGreeting", value: "Hello, I'm Amani" },
      { key: "heroGreetingFr", value: "Bonjour, je suis Amani" },
      { key: "heroDescription", value: "Data Scientist & AI Engineer" },
      { key: "heroDescriptionFr", value: "Data Scientist & Ingénieur IA" },
      { key: "aboutBio", value: "I am a data scientist and AI engineer with over 12 years of experience working at the intersection of data, technology, and development across international organizations." },
      { key: "aboutBioFr", value: "Je suis un data scientist et ingénieur IA avec plus de 12 ans d'expérience à l'intersection des données, de la technologie et du développement au sein d'organisations internationales." },
      { key: "whoIAmText", value: "A passionate data scientist and AI engineer driving innovation across Africa and beyond." },
      { key: "whoIAmTextFr", value: "Un data scientist et ingénieur IA passionné, moteur d'innovation à travers l'Afrique et au-delà." },
    ];

    for (const setting of settings) {
      await prisma.siteSetting.create({ data: setting });
    }
    console.log(`  Seeded ${settings.length} site settings`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
