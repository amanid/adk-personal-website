export interface ThemeColors {
  charcoal: string;
  navy: string;
  navyLight: string;
  gold: string;
  goldLight: string;
  goldDark: string;
  glass: string;
  glassBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  glassStrongBg: string;
  isDark: boolean;
}

export interface ThemeDefinition {
  id: string;
  label: string;
  labelFr: string;
  colors: ThemeColors;
  swatch: [string, string]; // two preview colors for the switcher
}

export const themes: ThemeDefinition[] = [
  {
    id: "midnight-gold",
    label: "Midnight Gold",
    labelFr: "Or de Minuit",
    swatch: ["#0c0c14", "#c9a84c"],
    colors: {
      charcoal: "#0c0c14",
      navy: "#0f1629",
      navyLight: "#1a2540",
      gold: "#c9a84c",
      goldLight: "#dfc272",
      goldDark: "#a68b32",
      glass: "rgba(255, 255, 255, 0.04)",
      glassBorder: "rgba(255, 255, 255, 0.08)",
      textPrimary: "#eef2f7",
      textSecondary: "#8b9bb4",
      textMuted: "#5a6a82",
      glassStrongBg: "rgba(15, 22, 41, 0.85)",
      isDark: true,
    },
  },
  {
    id: "light-professional",
    label: "Light Professional",
    labelFr: "Professionnel Clair",
    swatch: ["#f8fafc", "#1e3a5f"],
    colors: {
      charcoal: "#f8fafc",
      navy: "#e2e8f0",
      navyLight: "#cbd5e1",
      gold: "#1e3a5f",
      goldLight: "#2d5a8e",
      goldDark: "#14273d",
      glass: "rgba(0, 0, 0, 0.03)",
      glassBorder: "rgba(0, 0, 0, 0.08)",
      textPrimary: "#0f172a",
      textSecondary: "#475569",
      textMuted: "#94a3b8",
      glassStrongBg: "rgba(248, 250, 252, 0.92)",
      isDark: false,
    },
  },
  {
    id: "ocean-blue",
    label: "Ocean Blue",
    labelFr: "Bleu Océan",
    swatch: ["#0a1628", "#22d3ee"],
    colors: {
      charcoal: "#0a1628",
      navy: "#0d1f3c",
      navyLight: "#132d56",
      gold: "#22d3ee",
      goldLight: "#67e8f9",
      goldDark: "#0891b2",
      glass: "rgba(255, 255, 255, 0.04)",
      glassBorder: "rgba(255, 255, 255, 0.08)",
      textPrimary: "#e0f2fe",
      textSecondary: "#7dd3fc",
      textMuted: "#38bdf8",
      glassStrongBg: "rgba(13, 31, 60, 0.85)",
      isDark: true,
    },
  },
  {
    id: "emerald",
    label: "Emerald",
    labelFr: "Émeraude",
    swatch: ["#0a1a14", "#34d399"],
    colors: {
      charcoal: "#0a1a14",
      navy: "#0d2818",
      navyLight: "#153d24",
      gold: "#34d399",
      goldLight: "#6ee7b7",
      goldDark: "#059669",
      glass: "rgba(255, 255, 255, 0.04)",
      glassBorder: "rgba(255, 255, 255, 0.08)",
      textPrimary: "#ecfdf5",
      textSecondary: "#a7f3d0",
      textMuted: "#6ee7b7",
      glassStrongBg: "rgba(13, 40, 24, 0.85)",
      isDark: true,
    },
  },
  {
    id: "burgundy-rose",
    label: "Burgundy Rose",
    labelFr: "Rose Bourgogne",
    swatch: ["#1a0a14", "#f472b6"],
    colors: {
      charcoal: "#1a0a14",
      navy: "#2d1024",
      navyLight: "#451a39",
      gold: "#f472b6",
      goldLight: "#f9a8d4",
      goldDark: "#db2777",
      glass: "rgba(255, 255, 255, 0.04)",
      glassBorder: "rgba(255, 255, 255, 0.08)",
      textPrimary: "#fdf2f8",
      textSecondary: "#f9a8d4",
      textMuted: "#f472b6",
      glassStrongBg: "rgba(45, 16, 36, 0.85)",
      isDark: true,
    },
  },
  {
    id: "sunset-warm",
    label: "Sunset Warm",
    labelFr: "Coucher de Soleil",
    swatch: ["#1a120a", "#f59e0b"],
    colors: {
      charcoal: "#1a120a",
      navy: "#2d1f0e",
      navyLight: "#453117",
      gold: "#f59e0b",
      goldLight: "#fbbf24",
      goldDark: "#d97706",
      glass: "rgba(255, 255, 255, 0.04)",
      glassBorder: "rgba(255, 255, 255, 0.08)",
      textPrimary: "#fffbeb",
      textSecondary: "#fde68a",
      textMuted: "#fbbf24",
      glassStrongBg: "rgba(45, 31, 14, 0.85)",
      isDark: true,
    },
  },
];

export const defaultThemeId = "midnight-gold";

export function getThemeById(id: string): ThemeDefinition {
  return themes.find((t) => t.id === id) || themes[0];
}
