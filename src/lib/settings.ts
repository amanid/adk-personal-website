import { prisma } from "./prisma";
import { SMTP_SETTING_PREFIX } from "./email-config";

export const DEFAULT_SECTION_VISIBILITY: Record<string, boolean> = {
  marketTicker: true,
  whoIAm: true,
  stats: true,
  capabilities: true,
  trustedBy: true,
  marketIntelligence: true,
  expertise: true,
  techStack: true,
  careerHighlights: true,
  publications: true,
  projects: true,
  services: true,
  globalReach: true,
  certifications: true,
  impact: true,
  cta: true,
  unResearch: false,
  cvDownload: false,
};

export type SiteSettings = Record<string, string | Record<string, boolean>> & {
  sectionVisibility: Record<string, boolean>;
};

/**
 * Read all site settings (used by both the /api/settings route and server
 * components). Section visibility is merged with the defaults.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const settings: Record<string, string | Record<string, boolean>> = {};
  try {
    // Everything this returns reaches the browser (public /api/settings and
    // server-rendered pages), so mail credentials must never be read here.
    const rows = await prisma.siteSetting.findMany({
      where: {
        AND: [
          { NOT: { key: { startsWith: SMTP_SETTING_PREFIX } } },
          // "private." keys (e.g. the meeting link) are server-only too.
          { NOT: { key: { startsWith: "private." } } },
        ],
      },
    });
    for (const s of rows) {
      if (s.key === "sectionVisibility") {
        try {
          settings[s.key] = { ...DEFAULT_SECTION_VISIBILITY, ...JSON.parse(s.value) };
        } catch {
          settings[s.key] = DEFAULT_SECTION_VISIBILITY;
        }
      } else {
        settings[s.key] = s.value;
      }
    }
  } catch {
    // DB unavailable — fall back to defaults below.
  }
  if (!settings.sectionVisibility) {
    settings.sectionVisibility = DEFAULT_SECTION_VISIBILITY;
  }
  return settings as SiteSettings;
}
