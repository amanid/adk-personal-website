/**
 * Countries where the CVs place the work: on site, or the countries a remote
 * engagement covered. Source: public/cv/*.pdf. Do not add a country the CVs
 * do not name; the "countries" figure on the site is this list's length.
 */
export const countriesWorked: { name: string; nameFr: string; how: string }[] = [
  { name: "Côte d'Ivoire", nameFr: "Côte d'Ivoire", how: "ICCO, Barry-Callebaut, FHI 360, ICRAF, UNHCR, PAC-CI" },
  { name: "Egypt", nameFr: "Égypte", how: "Afreximbank, Cairo" },
  { name: "Mali", nameFr: "Mali", how: "ICRISAT training" },
  { name: "Kenya", nameFr: "Kenya", how: "ICRAF team training" },
  { name: "Nigeria", nameFr: "Nigeria", how: "IOM, UNIDIR" },
  { name: "Senegal", nameFr: "Sénégal", how: "IOM" },
  { name: "Guinea", nameFr: "Guinée", how: "IOM" },
  { name: "The Gambia", nameFr: "Gambie", how: "IOM" },
  { name: "Colombia", nameFr: "Colombie", how: "UNIDIR" },
  { name: "Iraq", nameFr: "Irak", how: "UNIDIR" },
];
