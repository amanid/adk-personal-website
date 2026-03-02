import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_SECTION_VISIBILITY: Record<string, boolean> = {
  marketTicker: true,
  whoIAm: true,
  stats: true,
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

export async function GET() {
  try {
    const settingsArr = await prisma.siteSetting.findMany();
    const settings: Record<string, string | Record<string, boolean>> = {};
    for (const s of settingsArr) {
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
    if (!settings.sectionVisibility) {
      settings.sectionVisibility = DEFAULT_SECTION_VISIBILITY;
    }
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
