// Structured, bilingual content for the Doctor of Business Administration (DBA) page.
// Scholarly content is mirrored EN/FR; the page selects by active locale.

export interface Bilingual {
  en: string;
  fr: string;
}

export interface FrameworkLens {
  role: Bilingual;
  name: Bilingual;
  description: Bilingual;
}

export interface KeyFact {
  label: Bilingual;
  value: Bilingual;
}

export interface Finding {
  title: Bilingual;
  body: Bilingual;
}

export interface Contribution {
  index: string;
  title: Bilingual;
  body: Bilingual;
}

export interface DeclarationPoint {
  en: string;
  fr: string;
}

export const dbaThesis = {
  institution: "IIBM Institute of Business Management",
  degree: {
    en: "Doctor of Business Administration (DBA)",
    fr: "Doctorat en Administration des Affaires (DBA)",
  },
  option: {
    en: "Specialisation: Artificial Intelligence",
    fr: "Spécialité : Intelligence Artificielle",
  },
  title: {
    en: "Renting Intelligence",
    fr: "Louer l'Intelligence",
  },
  subtitle: {
    en: "An Analysis of AI Applications in Sourcing Choices to Shape Performance in International Development",
    fr: "Une analyse des applications de l'IA dans les choix d'approvisionnement pour façonner la performance dans le développement international",
  },
  candidate: "KONAN Amani Dieudonné",
  supervisor: "Dr. T. P. Singh",
  date: {
    en: "June 2026",
    fr: "Juin 2026",
  },
  thesisLine: {
    en: "A thesis submitted in fulfilment of the requirements for the degree of Doctor of Business Administration.",
    fr: "Thèse soumise en vue de l'obtention du diplôme de Doctorat en Administration des Affaires.",
  },
};

export const keyFacts: KeyFact[] = [
  {
    label: { en: "Degree", fr: "Diplôme" },
    value: { en: "Doctor of Business Administration", fr: "Doctorat en Administration des Affaires" },
  },
  {
    label: { en: "Specialisation", fr: "Spécialité" },
    value: { en: "Artificial Intelligence", fr: "Intelligence Artificielle" },
  },
  {
    label: { en: "Supervisor", fr: "Directeur de recherche" },
    value: { en: "Dr. T. P. Singh", fr: "Dr. T. P. Singh" },
  },
  {
    label: { en: "Submission", fr: "Soumission" },
    value: { en: "June 2026", fr: "Juin 2026" },
  },
  {
    label: { en: "Method", fr: "Méthode" },
    value: { en: "Quasi-experimental, public-data econometrics", fr: "Économétrie quasi-expérimentale sur données publiques" },
  },
  {
    label: { en: "Evidence standard", fr: "Standard de preuve" },
    value: { en: "Strict zero-fabrication, fully reproducible", fr: "Zéro fabrication, intégralement reproductible" },
  },
];

export const abstractParagraphs: Bilingual[] = [
  {
    en: "Within roughly thirty months, generative artificial intelligence has moved from experimental novelty to operational dependency inside international development institutions. Multilateral development banks, United Nations agencies and large international non-governmental organizations are now committing measurable shares of their administrative budgets to foundation-model tooling, yet they do so under three intersecting uncertainties for which no replicable, sector-specific evidence exists: an upstream supply of model capability concentrated in a handful of foreign providers, internal governance configurations that vary widely with unknown performance consequences, and operational outcomes that have never been measured with the quasi-experimental rigour the sector routinely demands of its programme work.",
    fr: "En une trentaine de mois, l'intelligence artificielle générative est passée du statut de nouveauté expérimentale à celui de dépendance opérationnelle au sein des institutions du développement international. Banques multilatérales de développement, agences des Nations Unies et grandes organisations non gouvernementales internationales consacrent désormais une part mesurable de leur budget administratif aux outils fondés sur des modèles de fondation, mais le font sous trois incertitudes croisées pour lesquelles n'existe aucune preuve sectorielle reproductible : une offre amont de capacités concentrée entre les mains de quelques fournisseurs étrangers, des configurations de gouvernance internes très variables aux conséquences inconnues sur la performance, et des résultats opérationnels jamais mesurés avec la rigueur quasi-expérimentale que le secteur exige pourtant de ses propres programmes.",
  },
  {
    en: "This thesis addresses that gap with a design built entirely on public data, and it is organized around a single claim: that generative AI does not raise institutional performance by itself, but only where absorptive capacity and governance maturity convert a rented, externally controlled capability into usable organizational capability. The study assembles a census frame of approximately eighty development organizations spanning 2020 to 2026, codes their AI sourcing strategies and governance configurations from protocol-coded public disclosures, and constructs a quarterly institution-quarter outcome panel of forty-five institutions with machine-readable activity data.",
    fr: "Cette thèse comble cette lacune au moyen d'un dispositif entièrement construit sur des données publiques, et s'organise autour d'une thèse unique : l'IA générative n'élève pas la performance institutionnelle par elle-même, mais seulement là où la capacité d'absorption et la maturité de gouvernance convertissent une capacité louée, contrôlée de l'extérieur, en capacité organisationnelle réellement utilisable. L'étude constitue une base de recensement d'environ quatre-vingts organisations de développement couvrant 2020 à 2026, codifie leurs stratégies d'approvisionnement en IA et leurs configurations de gouvernance à partir de divulgations publiques codées par protocole, et construit un panel trimestriel institution-trimestre de quarante-cinq institutions disposant de données d'activité exploitables par machine.",
  },
  {
    en: "The causal impact of generative-AI adoption on observable outcomes — project and procurement cycle time, document throughput and independent evaluation ratings — is approached through staggered difference-in-differences using the Callaway and Sant'Anna (2021) estimator, supplemented by synthetic-control methods (Abadie et al., 2010; Arkhangelsky et al., 2021) and guarded against selection by an adoption-propensity model with inverse-probability weighting. The framework integrates four load-bearing lenses: Resource-Dependence Theory at its core, the supplier-side oligopoly of concentrated upstream markets as the environment, the Technology-Organization-Environment framework as the governance scaffold, and Absorptive Capacity Theory as the conversion mechanism — set within strategic-management and behavioural foundations.",
    fr: "L'impact causal de l'adoption de l'IA générative sur des résultats observables — délais de cycle des projets et de la passation des marchés, débit documentaire et notes d'évaluation indépendante — est abordé par une méthode de différences-en-différences à adoption échelonnée fondée sur l'estimateur de Callaway et Sant'Anna (2021), complétée par des méthodes de contrôle synthétique (Abadie et al., 2010 ; Arkhangelsky et al., 2021) et prémunie contre la sélection par un modèle de propension à l'adoption avec pondération par probabilité inverse. Le cadre intègre quatre prismes porteurs : la Théorie de la Dépendance aux Ressources en son cœur, l'oligopole côté offre des marchés amont concentrés comme environnement, le cadre Technologie-Organisation-Environnement comme ossature de gouvernance, et la Théorie de la Capacité d'Absorption comme mécanisme de conversion — le tout ancré dans des fondements de management stratégique et comportementaux.",
  },
  {
    en: "Consistent with a strict zero-fabrication standard, the thesis reports what the public evidence currently establishes and reserves the confirmatory estimates of the primary evaluation outcome until the treatment variable has been validated by independent coders and the long-lagged ratings have accrued. What is established now is substantial. The upstream market is concentrated at the capability frontier — an effective two to five suppliers by training compute — confirming the supplier-side oligopoly and the buyer-side dependence it imposes on development institutions as a measured feature of the market rather than a stylization.",
    fr: "Conformément à un strict standard de zéro fabrication, la thèse rapporte ce que les preuves publiques établissent à ce jour et réserve les estimations confirmatoires du résultat d'évaluation principal jusqu'à ce que la variable de traitement ait été validée par des codeurs indépendants et que les notes à long délai se soient accumulées. Ce qui est d'ores et déjà établi est substantiel. Le marché amont est concentré à la frontière des capacités — deux à cinq fournisseurs effectifs selon la puissance de calcul d'entraînement — confirmant l'oligopole côté offre et la dépendance côté acheteur qu'il impose aux institutions de développement comme une caractéristique mesurée du marché, et non comme une stylisation.",
  },
  {
    en: "Most consequentially for the central claim, adoption is shown to be non-random: the larger, more transparent and better-resourced institutions adopt sooner and at higher intensity — a positive selection the design measures directly and corrects for, and the empirical signature of the very capability gradient the mechanism predicts. The provisional proxy estimates remain uninformative, by the battery's own placebo and sensitivity results, which is reported as a constraint of post-adoption time and outcome lag rather than as evidence of no effect. That non-interpretability is itself informative: it demonstrates that the present public record is sufficient to detect adoption selection and run the estimator, but not yet sufficient to support a stable performance-effect claim.",
    fr: "Plus déterminant encore pour la thèse centrale, l'adoption se révèle non aléatoire : les institutions plus grandes, plus transparentes et mieux dotées adoptent plus tôt et avec une intensité plus forte — une sélection positive que le dispositif mesure directement et corrige, et la signature empirique du gradient de capacité même que le mécanisme prédit. Les estimations provisoires par approximation demeurent non informatives, selon les propres résultats de placebo et de sensibilité de la batterie de tests, ce qui est rapporté comme une contrainte de temps post-adoption et de délai des résultats, et non comme une preuve d'absence d'effet. Cette non-interprétabilité est elle-même informative : elle démontre que le dossier public actuel suffit à détecter la sélection à l'adoption et à faire tourner l'estimateur, mais ne suffit pas encore à étayer une affirmation stable d'effet sur la performance.",
  },
];

export const claimStatement: Bilingual = {
  en: "Generative AI does not raise institutional performance by itself — only where absorptive capacity and governance maturity convert a rented, externally controlled capability into usable organizational capability.",
  fr: "L'IA générative n'élève pas la performance institutionnelle par elle-même — seulement là où la capacité d'absorption et la maturité de gouvernance convertissent une capacité louée, contrôlée de l'extérieur, en capacité organisationnelle utilisable.",
};

export const frameworkLenses: FrameworkLens[] = [
  {
    role: { en: "Core", fr: "Cœur" },
    name: { en: "Resource-Dependence Theory", fr: "Théorie de la Dépendance aux Ressources" },
    description: {
      en: "Frames AI capability as a critical resource controlled by external providers, making the institution dependent on actors it cannot govern.",
      fr: "Pose la capacité d'IA comme une ressource critique contrôlée par des fournisseurs externes, rendant l'institution dépendante d'acteurs qu'elle ne peut gouverner.",
    },
  },
  {
    role: { en: "Environment", fr: "Environnement" },
    name: { en: "Supplier-Side Oligopoly", fr: "Oligopole côté offre" },
    description: {
      en: "Characterizes the concentrated upstream market — an effective two to five frontier suppliers by training compute — that conditions every buyer's choices.",
      fr: "Caractérise le marché amont concentré — deux à cinq fournisseurs de pointe effectifs selon la puissance de calcul — qui conditionne les choix de chaque acheteur.",
    },
  },
  {
    role: { en: "Scaffold", fr: "Ossature" },
    name: { en: "Technology-Organization-Environment", fr: "Technologie-Organisation-Environnement" },
    description: {
      en: "Provides the governance scaffold linking technological readiness, organizational configuration and environmental pressure into one adoption logic.",
      fr: "Fournit l'ossature de gouvernance reliant la maturité technologique, la configuration organisationnelle et la pression environnementale en une seule logique d'adoption.",
    },
  },
  {
    role: { en: "Mechanism", fr: "Mécanisme" },
    name: { en: "Absorptive Capacity Theory", fr: "Théorie de la Capacité d'Absorption" },
    description: {
      en: "Supplies the conversion mechanism: the institution's ability to recognize, assimilate and apply rented capability is what turns it into performance.",
      fr: "Apporte le mécanisme de conversion : la capacité de l'institution à reconnaître, assimiler et appliquer la capacité louée est ce qui la transforme en performance.",
    },
  },
];

export const designMetrics: KeyFact[] = [
  {
    label: { en: "Census frame", fr: "Base de recensement" },
    value: { en: "~80 development organizations", fr: "~80 organisations de développement" },
  },
  {
    label: { en: "Observation window", fr: "Fenêtre d'observation" },
    value: { en: "2020 – 2026", fr: "2020 – 2026" },
  },
  {
    label: { en: "Outcome panel", fr: "Panel de résultats" },
    value: { en: "45 institutions, quarterly", fr: "45 institutions, trimestriel" },
  },
  {
    label: { en: "Primary estimator", fr: "Estimateur principal" },
    value: { en: "Callaway & Sant'Anna (2021) staggered DiD", fr: "DiD échelonné de Callaway & Sant'Anna (2021)" },
  },
  {
    label: { en: "Robustness", fr: "Robustesse" },
    value: { en: "Synthetic control, placebo & sensitivity battery", fr: "Contrôle synthétique, batterie placebo et sensibilité" },
  },
  {
    label: { en: "Selection guard", fr: "Garde-fou de sélection" },
    value: { en: "Adoption-propensity model + IPW", fr: "Modèle de propension à l'adoption + IPW" },
  },
];

export const findings: Finding[] = [
  {
    title: { en: "Concentrated upstream supply", fr: "Offre amont concentrée" },
    body: {
      en: "The capability frontier resolves to an effective two-to-five suppliers by training compute, confirming a supplier-side oligopoly and the buyer-side dependence it imposes as a measured market feature, not a stylization.",
      fr: "La frontière des capacités se résume à deux à cinq fournisseurs effectifs selon la puissance de calcul d'entraînement, confirmant un oligopole côté offre et la dépendance côté acheteur qu'il impose comme une caractéristique mesurée du marché, non une stylisation.",
    },
  },
  {
    title: { en: "Adoption is non-random", fr: "L'adoption n'est pas aléatoire" },
    body: {
      en: "Larger, more transparent and better-resourced institutions adopt sooner and at higher intensity — a positive selection the design measures and corrects for, and the empirical signature of the capability gradient the mechanism predicts.",
      fr: "Les institutions plus grandes, plus transparentes et mieux dotées adoptent plus tôt et plus intensément — une sélection positive que le dispositif mesure et corrige, et la signature empirique du gradient de capacité prédit par le mécanisme.",
    },
  },
  {
    title: { en: "A working public-data apparatus", fr: "Un appareil opérationnel sur données publiques" },
    body: {
      en: "The full quasi-experimental apparatus runs end-to-end on real public data — group-time and event-study estimates, a placebo and sensitivity battery, a time-to-adoption survival model and an archetype clustering on the 45-institution panel.",
      fr: "L'appareil quasi-expérimental complet fonctionne de bout en bout sur des données publiques réelles — estimations groupe-temps et d'étude d'événement, batterie de placebo et de sensibilité, modèle de survie du délai d'adoption et classification par archétypes sur le panel de 45 institutions.",
    },
  },
  {
    title: { en: "Honest, bounded provisional result", fr: "Un résultat provisoire honnête et borné" },
    body: {
      en: "The provisional proxy estimates remain uninformative by the battery's own placebo and sensitivity results — reported as a constraint of post-adoption time and outcome lag, not as evidence of no effect. The record can detect selection and run the estimator; it cannot yet support a stable effect claim.",
      fr: "Les estimations provisoires par approximation demeurent non informatives selon les propres tests de placebo et de sensibilité — rapportées comme une contrainte de temps post-adoption et de délai des résultats, non comme une preuve d'absence d'effet. Le dossier peut détecter la sélection et faire tourner l'estimateur ; il ne peut pas encore étayer une affirmation stable d'effet.",
    },
  },
];

export const contributions: Contribution[] = [
  {
    index: "01",
    title: { en: "A theoretical reframing", fr: "Un recadrage théorique" },
    body: {
      en: "AI adoption in institutions is recast as a moderated rather than a direct effect, in which absorptive capacity and governance maturity are the mechanism that converts rented intelligence into capability.",
      fr: "L'adoption de l'IA dans les institutions est reconçue comme un effet modéré plutôt que direct, où la capacité d'absorption et la maturité de gouvernance constituent le mécanisme qui convertit l'intelligence louée en capacité.",
    },
  },
  {
    index: "02",
    title: { en: "A board-level decision framework", fr: "Un cadre de décision pour les conseils" },
    body: {
      en: "An AI Sourcing Decision Framework operationalizes the central claim for practice, giving boards and executives a structured way to weigh sourcing choices against governance and capacity.",
      fr: "Un cadre de décision d'approvisionnement en IA opérationnalise la thèse centrale pour la pratique, offrant aux conseils et dirigeants une manière structurée d'arbitrer les choix d'approvisionnement au regard de la gouvernance et de la capacité.",
    },
  },
  {
    index: "03",
    title: { en: "A reproducible public-data asset", fr: "Un actif reproductible sur données publiques" },
    body: {
      en: "A working, reproducible apparatus and a published, machine-readable institution-quarter dataset become a shared sectoral asset and a methodological precedent for quasi-experimental evaluation of AI adoption in non-corporate, outcome-focused settings.",
      fr: "Un appareil opérationnel et reproductible ainsi qu'un jeu de données institution-trimestre publié et exploitable par machine deviennent un actif sectoriel partagé et un précédent méthodologique pour l'évaluation quasi-expérimentale de l'adoption de l'IA dans des contextes non commerciaux, centrés sur les résultats.",
    },
  },
  {
    index: "04",
    title: { en: "The structural market finding", fr: "Le constat structurel de marché" },
    body: {
      en: "The finding of supplier-side concentration, and the buyer-side dependence it imposes, is established as a measured market feature — the structural fact that motivates the entire inquiry.",
      fr: "Le constat de concentration côté offre, et de la dépendance côté acheteur qu'elle impose, est établi comme une caractéristique mesurée du marché — le fait structurel qui motive l'ensemble de l'enquête.",
    },
  },
];

export const practicalMessage: Bilingual = {
  en: "Development institutions should build absorptive capacity and governance maturity before procuring AI tools, not after — because rented capability converts into performance only where those complements already exist.",
  fr: "Les institutions de développement devraient bâtir leur capacité d'absorption et leur maturité de gouvernance avant d'acquérir des outils d'IA, et non après — car la capacité louée ne se convertit en performance que là où ces compléments existent déjà.",
};

export const keywords: Bilingual[] = [
  { en: "generative artificial intelligence", fr: "intelligence artificielle générative" },
  { en: "foundation models", fr: "modèles de fondation" },
  { en: "supplier concentration", fr: "concentration des fournisseurs" },
  { en: "absorptive capacity", fr: "capacité d'absorption" },
  { en: "international development", fr: "développement international" },
  { en: "impact evaluation", fr: "évaluation d'impact" },
  { en: "difference-in-differences", fr: "différences-en-différences" },
  { en: "synthetic control", fr: "contrôle synthétique" },
  { en: "AI governance", fr: "gouvernance de l'IA" },
  { en: "public-data econometrics", fr: "économétrie sur données publiques" },
];

export const declarationIntro: Bilingual = {
  en: "I, KONAN Amani Dieudonné, declare that this thesis, entitled “Renting Intelligence: An Analysis of AI Applications in Sourcing Choices to Shape Performance in International Development”, is my own work. It is submitted in fulfilment of the requirements for the degree of Doctor of Business Administration at the IIBM Institute of Business Management. I confirm that:",
  fr: "Je, KONAN Amani Dieudonné, déclare que cette thèse, intitulée « Louer l'Intelligence : une analyse des applications de l'IA dans les choix d'approvisionnement pour façonner la performance dans le développement international », est mon œuvre. Elle est soumise en vue de l'obtention du diplôme de Doctorat en Administration des Affaires de l'IIBM Institute of Business Management. Je confirme que :",
};

export const declarationPoints: DeclarationPoint[] = [
  {
    en: "the work was conducted by me as a candidate for the degree;",
    fr: "le travail a été mené par moi-même en tant que candidat au diplôme ;",
  },
  {
    en: "where I have consulted the published work of others, this is always clearly attributed and cited;",
    fr: "lorsque j'ai consulté les travaux publiés d'autrui, ceux-ci sont toujours clairement attribués et cités ;",
  },
  {
    en: "all empirical results reported in this thesis are derived from publicly available data sources and from analysis code published alongside the thesis, and are fully reproducible;",
    fr: "tous les résultats empiriques rapportés dans cette thèse proviennent de sources de données publiquement accessibles et d'un code d'analyse publié avec la thèse, et sont intégralement reproductibles ;",
  },
  {
    en: "no part of this thesis has previously been submitted for a degree or any other qualification at this or any other institution;",
    fr: "aucune partie de cette thèse n'a été précédemment soumise pour un diplôme ou toute autre qualification, dans cette institution ou dans une autre ;",
  },
  {
    en: "I have acknowledged all main sources of help.",
    fr: "j'ai reconnu toutes les principales sources d'aide.",
  },
];
