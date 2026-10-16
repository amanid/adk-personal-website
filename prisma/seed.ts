import { PrismaClient } from "@prisma/client";
import { projects as staticProjects } from "../src/data/projects";
import { skillCategories as staticSkillCategories } from "../src/data/skills";
import { experiences as staticExperiences } from "../src/data/experience";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed Admin User
  const adminEmail = "amani_dieudonne@yahoo.fr";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    console.log("Seeding admin user...");
    // Never commit a password: the seed reads it from the environment, and
    // without one the admin can only sign in with Google.
    const seedPassword = process.env.SEED_ADMIN_PASSWORD;
    const hashedPassword = seedPassword ? await bcrypt.hash(seedPassword, 12) : null;
    await prisma.user.create({
      data: {
        name: "KONAN Amani Dieudonné",
        email: adminEmail,
        hashedPassword,
        role: "ADMIN",
      },
    });
    console.log("  Admin user created");
  } else if (existingAdmin.role !== "ADMIN") {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN" },
    });
    console.log("  Existing user promoted to ADMIN");
  } else {
    console.log("  Admin user already exists");
  }

  // Seed Experiences
  const expCount = await prisma.experience.count();
  if (expCount === 0) {
    console.log("Seeding experiences...");
    // From the CV-sourced list in src/data/experience.ts.
    const experiences = staticExperiences.map((e, i) => ({
      role: e.role,
      roleFr: e.roleFr,
      organization: e.organization,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      description: e.description,
      descriptionFr: e.descriptionFr,
      sortOrder: i,
    }));

    for (const exp of experiences) {
      await prisma.experience.create({ data: exp });
    }
    console.log(`  Seeded ${experiences.length} experiences`);
  }

  // Seed Skill Categories & Skills
  const skillCatCount = await prisma.skillCategory.count();
  if (skillCatCount === 0) {
    console.log("Seeding skill categories...");
    // From the CV-sourced list in src/data/skills.ts. The schema still has a
    // `level` column; the site no longer shows self-ratings, so it is 0.
    const categories = staticSkillCategories.map((c, i) => ({
      name: c.name,
      nameFr: c.nameFr,
      sortOrder: i,
      skills: c.skills.map((sk) => ({ name: sk.name, level: 0 })),
    }));

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
      { degree: "Professional Certificate in Data Engineering", degreeFr: "Certificat Professionnel en Ingénierie des Données, IA & Science des Données", institution: "Massachusetts Institute of Technology (MIT)", year: "2025", location: "USA (Online)", sortOrder: 0 },
      { degree: "Applied AI and Data Science Program", degreeFr: "Programme Appliqué en IA et Science des Données", institution: "Massachusetts Institute of Technology (MIT)", year: "2025", location: "USA (Online)", sortOrder: 1 },
      { degree: "MicroMasters in Data, Economics & Development Policy", degreeFr: "MicroMasters en Données, Économie & Politique de Développement", institution: "Massachusetts Institute of Technology (MIT)", year: "2021", location: "USA (Online)", sortOrder: 2 },
      { degree: "Financial Modelling & Valuation Analyst (FMVA)", degreeFr: "Analyste en Modélisation Financière & Valorisation (FMVA)", institution: "Corporate Finance Institute (CFI)", year: "2020", location: "Canada (Online)", sortOrder: 3 },
      { degree: "Master's in Statistics & Econometrics", degreeFr: "Master en Statistique & Économétrie", institution: "Université Toulouse I Capitole", year: "2017", location: "Toulouse, France", sortOrder: 4 },
      { degree: "Data Science Specialization Certificate", degreeFr: "Certificat de Spécialisation en Science des Données", institution: "Johns Hopkins University", year: "2015", location: "USA (Online)", sortOrder: 5 },
      { degree: "Ingénieur Statisticien (Statistics & Information System Engineer)", degreeFr: "Ingénieur Statisticien (Statistique & Systèmes d'Information)", institution: "ENSEA (École Nationale Supérieure de Statistique et d'Économie Appliquée)", year: "2012", location: "Abidjan, Côte d'Ivoire", sortOrder: 6 },
      { degree: "Bachelor in Statistics & Information Systems", degreeFr: "Licence en Statistique & Systèmes d'Information", institution: "ENSEA (École Nationale Supérieure de Statistique et d'Économie Appliquée)", year: "2009", location: "Abidjan, Côte d'Ivoire", sortOrder: 7 },
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
      { name: "Professional Certificate in Data Engineering", issuer: "MIT", year: "2025", sortOrder: 0 },
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
    // Single source of truth: the CV-sourced list in src/data/projects.ts.
    const projects = staticProjects.map((p, i) => ({
      title: p.title,
      titleFr: p.titleFr,
      slug: p.id,
      description: p.description,
      descriptionFr: p.descriptionFr,
      technologies: p.technologies,
      category: p.category,
      featured: p.featured,
      sortOrder: i,
    }));

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
      { title: "Africa's $10 Trillion Opportunity: Regional Dynamics 2010-2025", titleFr: "L'opportunité de 10 000 milliards de dollars de l'Afrique : dynamiques régionales 2010-2025", slug: "africa-10trillion-opportunity-regional-dynamics-2010-2025", abstract: "A comprehensive analytical report examining Africa's economic trajectory and the $10 trillion opportunity across regional dynamics from 2010 to 2025.", abstractFr: "Un rapport analytique complet examinant la trajectoire économique de l'Afrique et l'opportunité de 10 000 milliards de dollars à travers les dynamiques régionales de 2010 à 2025.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa 10Trillion Opportunity Regional Dynamics 2010-2025.pdf", tags: ["Africa", "Economic Growth", "Regional Dynamics", "Trade", "Investment"], featured: true },
      { title: "Africa's $10 Trillion Opportunity: Regional Dynamics", titleFr: "L'opportunité de 10 000 milliards de dollars de l'Afrique : dynamiques régionales", slug: "africa-10trillion-opportunity-regional-dynamics", abstract: "An in-depth analysis of Africa's $10 trillion economic opportunity, exploring regional dynamics, sectoral drivers, and the conditions needed to unlock transformative growth across the continent.", abstractFr: "Une analyse approfondie de l'opportunité économique de 10 000 milliards de dollars de l'Afrique, explorant les dynamiques régionales, les moteurs sectoriels et les conditions nécessaires.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa 10Trillion Opportunity Regional Dynamics.pdf", tags: ["Africa", "Economic Opportunity", "Growth", "Regional Analysis"], featured: false },
      { title: "Africa's Cultural Power: A $100B Growth Frontier", titleFr: "Le pouvoir culturel de l'Afrique : une frontière de croissance de 100 milliards de dollars", slug: "africa-cultural-power-100b-growth-frontier", abstract: "This report explores Africa's creative and cultural industries as a $100 billion growth frontier.", abstractFr: "Ce rapport explore les industries créatives et culturelles de l'Afrique comme une frontière de croissance de 100 milliards de dollars.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa Cultural Power - A $100B Growth Frontier.pdf", tags: ["Africa", "Creative Industries", "Cultural Economy", "Growth"], featured: false },
      { title: "Africa Economies' Heavy Reliance on Commodities", titleFr: "La forte dépendance des économies africaines aux matières premières", slug: "africa-economies-heavy-reliance-commodities", abstract: "An analytical snapshot of African economies' continued heavy reliance on commodities.", abstractFr: "Un état des lieux analytique de la dépendance continue des économies africaines aux matières premières.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa Economies Heavy Reliance On Commodities - A Snapshot As At August 2025.pdf", tags: ["Africa", "Commodities", "Economic Diversification", "Trade"], featured: false },
      { title: "Africa Trade Finance Infrastructure Growth", titleFr: "Croissance de l'infrastructure de financement du commerce en Afrique", slug: "africa-trade-finance-infrastructure-growth", abstract: "An analysis of trade finance infrastructure development across Africa.", abstractFr: "Une analyse du développement de l'infrastructure de financement du commerce à travers l'Afrique.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Trade Finance", pdfUrl: "/publications/Africa Trade Finance Infrastructure Growth.pdf", tags: ["Trade Finance", "Africa", "Infrastructure", "AfCFTA", "Development Finance"], featured: true },
      { title: "Africa's Youth Dividend: Future Workforce", titleFr: "Le dividende jeunesse de l'Afrique : la main-d'œuvre du futur", slug: "africa-youth-dividend-future-workforce", abstract: "This report examines Africa's demographic dividend and the potential of its young population as a transformative workforce.", abstractFr: "Ce rapport examine le dividende démographique de l'Afrique et le potentiel de sa jeune population comme main-d'œuvre transformatrice.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa Youth Dividend Future Workforce.pdf", tags: ["Africa", "Youth", "Demographics", "Workforce", "Education"], featured: false },
      { title: "Africa's Digital Future: Overview", titleFr: "L'avenir numérique de l'Afrique : vue d'ensemble", slug: "africa-digital-future-overview", abstract: "A comprehensive overview of Africa's digital transformation journey.", abstractFr: "Une vue d'ensemble complète du parcours de transformation numérique de l'Afrique.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Digital & Fintech", pdfUrl: "/publications/Africa-Digital-Future-Overview.pdf", tags: ["Africa", "Digital Transformation", "Technology", "Connectivity", "E-Governance"], featured: false },
      { title: "Africa's AI Leap: Finance & Sovereignty", titleFr: "Le bond de l'IA en Afrique : finance et souveraineté", slug: "africa-ai-leap-finance-sovereignty", abstract: "An analysis of how artificial intelligence is transforming Africa's financial sector and questions of data sovereignty.", abstractFr: "Une analyse de la façon dont l'intelligence artificielle transforme le secteur financier de l'Afrique et les questions de souveraineté des données.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "AI & Technology", pdfUrl: "/publications/Africa's AI Leap - Finance & Sovereignty.pdf", tags: ["AI", "Finance", "Data Sovereignty", "Africa", "Fintech"], featured: true },
      { title: "Africa's AI Readiness & the Digital Skills Imperative", titleFr: "La préparation de l'Afrique à l'IA et l'impératif des compétences numériques", slug: "africa-ai-readiness-digital-skills-imperative", abstract: "This report assesses Africa's readiness for the AI revolution and the critical need for digital skills development.", abstractFr: "Ce rapport évalue la préparation de l'Afrique à la révolution de l'IA et le besoin critique de développement des compétences numériques.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "AI & Technology", pdfUrl: "/publications/Africa's AI Readiness & the Digital Skills Imperative.pdf", tags: ["AI", "Digital Skills", "Africa", "Education", "Technology Readiness"], featured: false },
      { title: "Africa's Commodity Leap: From Raw Loss to Value Power", titleFr: "Le bond des matières premières de l'Afrique : de la perte brute au pouvoir de la valeur", slug: "africa-commodity-leap-raw-loss-value-power", abstract: "An examination of Africa's commodity value chain transformation.", abstractFr: "Un examen de la transformation de la chaîne de valeur des matières premières de l'Afrique.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa's Commodity Leap - From Raw Loss to Value Power.pdf", tags: ["Commodities", "Value Addition", "Industrialization", "Africa", "Trade"], featured: false },
      { title: "Africa's Digital Future: Innovation Driving Jobs", titleFr: "L'avenir numérique de l'Afrique : l'innovation au service de l'emploi", slug: "africa-digital-future-innovation-driving-jobs", abstract: "This report explores how digital innovation is creating new employment opportunities across Africa.", abstractFr: "Ce rapport explore comment l'innovation numérique crée de nouvelles opportunités d'emploi à travers l'Afrique.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Digital & Fintech", pdfUrl: "/publications/Africa's Digital Future - Innovation Driving Jobs.pdf", tags: ["Digital Innovation", "Jobs", "Africa", "Startups", "Technology"], featured: false },
      { title: "Africa's Inflation-FX-Debt Stability Framework", titleFr: "Cadre de stabilité inflation-change-dette de l'Afrique", slug: "africa-inflation-fx-debt-stability-framework", abstract: "A macroeconomic analysis presenting a stability framework for managing inflation, foreign exchange volatility, and debt sustainability.", abstractFr: "Une analyse macroéconomique présentant un cadre de stabilité pour gérer les défis interconnectés de l'inflation, de la volatilité du change et de la soutenabilité de la dette.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Macroeconomics", pdfUrl: "/publications/Africa's Inflation–FX–Debt Stability Framework.pdf", tags: ["Inflation", "Foreign Exchange", "Debt", "Macroeconomics", "Africa"], featured: false },
      { title: "Africa's Missing Billions: A Data-Driven Call to End Illicit Financial Flows", titleFr: "Les milliards manquants de l'Afrique : un appel basé sur les données pour mettre fin aux flux financiers illicites", slug: "africa-missing-billions-illicit-financial-flows", abstract: "A data-driven analysis of illicit financial flows from Africa.", abstractFr: "Une analyse basée sur les données des flux financiers illicites provenant d'Afrique.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa's Missing Billions - A Data-Driven Call to End Illicit Financial Flows.pdf", tags: ["Illicit Financial Flows", "Africa", "Data Analysis", "Governance", "Policy"], featured: false },
      { title: "Africa's Prosperity Must Be Built by Africans", titleFr: "La prospérité de l'Afrique doit être construite par les Africains", slug: "africa-prosperity-built-by-africans", abstract: "A thought-leadership piece arguing for African-led development strategies.", abstractFr: "Un article de leadership éclairé plaidant pour des stratégies de développement dirigées par les Africains.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Africa's prosperity must be built by Africans.pdf", tags: ["Africa", "Development", "Leadership", "Self-Reliance", "Policy"], featured: false },
      { title: "Cocoa Demand Rewired: Global Grindings & Origin Rise", titleFr: "La demande de cacao redéfinie : broyages mondiaux et montée des origines", slug: "cocoa-demand-rewired-global-grindings-origin-rise", abstract: "An analysis of shifting global cocoa demand patterns.", abstractFr: "Une analyse de l'évolution des schémas de demande mondiale de cacao.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Agriculture", pdfUrl: "/publications/Cocoa Demand Rewired - Global Grindings & Origin Rise.pdf", tags: ["Cocoa", "Commodities", "Agriculture", "Global Trade", "Market Analysis"], featured: false },
      { title: "Fintech and Digital Payments in Africa: From Mobile Money to Global Scale", titleFr: "Fintech et paiements numériques en Afrique : du mobile money à l'échelle mondiale", slug: "fintech-digital-payments-africa-mobile-money-global-scale", abstract: "A comprehensive analysis of Africa's fintech revolution.", abstractFr: "Une analyse complète de la révolution fintech en Afrique.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Digital & Fintech", pdfUrl: "/publications/Fintech and Digital Payments in Africa - From Mobile Money to Global Scale.pdf", tags: ["Fintech", "Digital Payments", "Mobile Money", "Africa", "Financial Inclusion"], featured: true },
      { title: "Fintech & Digital Payments in Africa", titleFr: "Fintech et paiements numériques en Afrique", slug: "fintech-digital-payments-africa", abstract: "An overview of the fintech and digital payments landscape across Africa.", abstractFr: "Un aperçu du paysage fintech et des paiements numériques à travers l'Afrique.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Digital & Fintech", pdfUrl: "/publications/Fintech-Digital-Payments-Africa.pdf", tags: ["Fintech", "Digital Payments", "Africa", "Banking", "Technology"], featured: false },
      { title: "Global Cotton Market Analysis", titleFr: "Analyse du marché mondial du coton", slug: "global-cotton-market-analysis", abstract: "A data-driven analysis of the global cotton market.", abstractFr: "Une analyse basée sur les données du marché mondial du coton.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Agriculture", pdfUrl: "/publications/Global-Cotton-Market-Analysis.pdf", tags: ["Cotton", "Agriculture", "Global Trade", "Market Analysis", "Africa"], featured: false },
      { title: "Healthtech & Pharma: Africa's Health Sovereignty", titleFr: "Healthtech & Pharma : la souveraineté sanitaire de l'Afrique", slug: "healthtech-pharma-africa-health-sovereignty", abstract: "An analysis of Africa's healthtech and pharmaceutical sector.", abstractFr: "Une analyse du secteur healthtech et pharmaceutique de l'Afrique.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Healthtech & Pharma - Africa's Health Sovereignty.pdf", tags: ["Healthtech", "Pharma", "Africa", "Health Sovereignty", "Innovation"], featured: false },
      { title: "Key Takeaways from DAMA-DMBOK Data Management Framework", titleFr: "Points clés du cadre de gestion des données DAMA-DMBOK", slug: "key-takeaways-dama-dmbok-dmf", abstract: "A practical synthesis of the DAMA-DMBOK Data Management Body of Knowledge framework.", abstractFr: "Une synthèse pratique du cadre DAMA-DMBOK (Data Management Body of Knowledge).", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Data Governance", pdfUrl: "/publications/Key Takeaways From DAMA_DMBOK DMF.pdf", tags: ["Data Governance", "DAMA-DMBOK", "Data Management", "Enterprise", "Best Practices"], featured: false },
      { title: "Multilateral Development Finance Across Africa: A Quick Overview", titleFr: "Le financement multilatéral du développement en Afrique : un aperçu rapide", slug: "multilateral-development-finance-africa-overview", abstract: "A concise overview of multilateral development finance flows to Africa.", abstractFr: "Un aperçu concis des flux de financement multilatéral du développement vers l'Afrique.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Trade Finance", pdfUrl: "/publications/Mutlilateral Development Finance Accross Africa - A Quick Overview.pdf", tags: ["Development Finance", "Multilateral", "Africa", "Aid", "Investment"], featured: false },
      { title: "Price Responsiveness of Artificial Intelligence", titleFr: "La sensibilité au prix de l'intelligence artificielle", slug: "price-responsiveness-artificial-intelligence", abstract: "An economic analysis of AI pricing dynamics.", abstractFr: "Une analyse économique des dynamiques de prix de l'IA.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "AI & Technology", pdfUrl: "/publications/Price Responsiveness of Artificial Intelligence.pdf", tags: ["AI", "Economics", "Pricing", "Market Analysis", "Technology"], featured: false },
      { title: "South-South Cooperation and Africa: Opportunities", titleFr: "La coopération Sud-Sud et l'Afrique : opportunités", slug: "south-south-cooperation-africa-opportunities", abstract: "An analysis of South-South cooperation opportunities for Africa.", abstractFr: "Une analyse des opportunités de coopération Sud-Sud pour l'Afrique.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/South–South Cooperation and Africa Opportunities.pdf", tags: ["South-South Cooperation", "Africa", "Development", "Trade", "Partnerships"], featured: false },
      { title: "The $2 Trillion Imperative: Africa's Path to a Green Industrial Revolution", titleFr: "L'impératif de 2 000 milliards de dollars : la voie de l'Afrique vers une révolution industrielle verte", slug: "2-trillion-imperative-africa-green-industrial-revolution", abstract: "A strategic analysis of Africa's $2 trillion green industrialization opportunity.", abstractFr: "Une analyse stratégique de l'opportunité d'industrialisation verte de 2 000 milliards de dollars de l'Afrique.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/The $2 Trillion Imperative - Africa's Path to a Green Industrial Revolution.pdf", tags: ["Green Industry", "Africa", "Climate", "Renewable Energy", "Sustainability"], featured: false },
      { title: "The R&D Dividend: Knowledge and Growth", titleFr: "Le dividende de la R&D : connaissance et croissance", slug: "rd-dividend-knowledge-growth", abstract: "An analysis of the relationship between R&D investment and economic growth.", abstractFr: "Une analyse de la relation entre l'investissement en recherche et développement et la croissance économique.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/The R&D Dividend – Knowledge and Growth.pdf", tags: ["R&D", "Innovation", "Growth", "Knowledge Economy", "Africa"], featured: false },
      { title: "Unlocking Africa's Agri-Tech Transformation", titleFr: "Débloquer la transformation agri-tech de l'Afrique", slug: "unlocking-africa-agri-tech-transformation", abstract: "A report on the potential of agricultural technology to transform Africa's farming sector.", abstractFr: "Un rapport sur le potentiel de la technologie agricole pour transformer le secteur agricole de l'Afrique.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Agriculture", pdfUrl: "/publications/Unlocking Africa's Agri-Tech Transformation.pdf", tags: ["Agri-Tech", "Agriculture", "Africa", "Innovation", "Food Security"], featured: false },
      { title: "Urban Futures Unlocked: Financing Africa's Cities", titleFr: "Futurs urbains débloqués : financer les villes africaines", slug: "urban-futures-unlocked-financing-africa-cities", abstract: "An analysis of urban financing challenges and opportunities in Africa.", abstractFr: "Une analyse des défis et opportunités de financement urbain en Afrique.", authors: ["KONAN Amani Dieudonné"], journal: "Analytical Report", year: 2025, category: "Africa Economics", pdfUrl: "/publications/Urban Futures Unlocked Financing Africa Cities.pdf", tags: ["Urbanization", "Cities", "Africa", "Infrastructure", "Finance"], featured: false },
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
