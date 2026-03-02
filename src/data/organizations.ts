export interface Organization {
  id: string;
  name: string;
  nameFr: string;
  abbreviation: string;
  tier: "core" | "advisory";
  website: string;
  location: string;
}

export const organizations: Organization[] = [
  // Core Institutions (primary employers)
  {
    id: "afreximbank",
    name: "African Export-Import Bank",
    nameFr: "Banque Africaine d'Import-Export",
    abbreviation: "Afreximbank",
    tier: "core",
    website: "https://www.afreximbank.com",
    location: "Cairo, Egypt",
  },
  {
    id: "icco",
    name: "International Cocoa Organization",
    nameFr: "Organisation Internationale du Cacao",
    abbreviation: "ICCO",
    tier: "core",
    website: "https://www.icco.org",
    location: "Abidjan, Côte d'Ivoire",
  },
  {
    id: "barry-callebaut",
    name: "Barry-Callebaut",
    nameFr: "Barry-Callebaut",
    abbreviation: "Barry-Callebaut",
    tier: "core",
    website: "https://www.barry-callebaut.com",
    location: "Zurich, Switzerland",
  },
  {
    id: "fhi360",
    name: "FHI 360",
    nameFr: "FHI 360",
    abbreviation: "FHI360",
    tier: "core",
    website: "https://www.fhi360.org",
    location: "Durham, USA",
  },
  {
    id: "icraf",
    name: "World Agroforestry Centre",
    nameFr: "Centre Mondial d'Agroforesterie",
    abbreviation: "ICRAF",
    tier: "core",
    website: "https://www.worldagroforestry.org",
    location: "Nairobi, Kenya",
  },
  {
    id: "pacci",
    name: "Programme PAC-CI / ANRS",
    nameFr: "Programme PAC-CI / ANRS",
    abbreviation: "PAC-CI",
    tier: "core",
    website: "https://www.pacci.ci",
    location: "Abidjan, Côte d'Ivoire",
  },
  // United Nations & International Research (prestigious engagements)
  {
    id: "itu",
    name: "International Telecommunication Union",
    nameFr: "Union Internationale des Télécommunications",
    abbreviation: "ITU",
    tier: "advisory",
    website: "https://www.itu.int",
    location: "Geneva, Switzerland",
  },
  {
    id: "iom",
    name: "International Organization for Migration",
    nameFr: "Organisation Internationale pour les Migrations",
    abbreviation: "IOM",
    tier: "advisory",
    website: "https://www.iom.int",
    location: "Geneva, Switzerland",
  },
  {
    id: "unhcr",
    name: "United Nations High Commissioner for Refugees",
    nameFr: "Haut Commissariat des Nations Unies pour les Réfugiés",
    abbreviation: "UNHCR",
    tier: "advisory",
    website: "https://www.unhcr.org",
    location: "Geneva, Switzerland",
  },
  {
    id: "unidir",
    name: "United Nations Institute for Disarmament Research",
    nameFr: "Institut des Nations Unies pour la Recherche sur le Désarmement",
    abbreviation: "UNIDIR",
    tier: "advisory",
    website: "https://www.unidir.org",
    location: "Geneva, Switzerland",
  },
  {
    id: "icrisat",
    name: "International Crops Research Institute for the Semi-Arid Tropics",
    nameFr: "Institut International de Recherche sur les Cultures des Zones Tropicales Semi-Arides",
    abbreviation: "ICRISAT",
    tier: "advisory",
    website: "https://www.icrisat.org",
    location: "Hyderabad, India",
  },
];
