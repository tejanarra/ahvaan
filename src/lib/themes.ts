export type ThemeId =
  | "classic-gold"
  | "modern-minimal"
  | "playful-pastel"
  | "midnight-elegant"
  | "garden-party"
  | "ocean-air"
  | "fiesta"
  | "ink-and-blush";

export type Theme = {
  id: ThemeId;
  label: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    accent: string;
    accentDark: string;
    surface: string;
  };
};

// Phase 2 (docs/04-design-system.md "Stage system"): 8 presets, colors +
// typography. Font pairs live in src/lib/theme-fonts.ts (next/font/google
// instances can't be constructed dynamically, so the pairing table has to
// live in its own module) — resolveThemeFonts(theme.id) looks up the pair
// for whichever theme is active. Existing events referencing the original
// 4 ids are unaffected: same colors, they simply gain their theme's fonts.
export const THEMES: Theme[] = [
  {
    id: "classic-gold",
    label: "Classic Gold",
    description: "Warm amber accent on a soft neutral background.",
    colors: {
      background: "#fdfaf6",
      foreground: "#2d2418",
      accent: "#a9791f",
      accentDark: "#74490f",
      surface: "#f6efe0",
    },
  },
  {
    id: "modern-minimal",
    label: "Modern Minimal",
    description: "Clean black & white with plenty of whitespace.",
    colors: {
      background: "#ffffff",
      foreground: "#18181b",
      accent: "#27272a",
      accentDark: "#09090b",
      surface: "#f4f4f5",
    },
  },
  {
    id: "playful-pastel",
    label: "Playful Pastel",
    description: "Soft rose accent — friendly and light, great for parties.",
    colors: {
      background: "#fff8fb",
      foreground: "#33222c",
      accent: "#e0729d",
      // Darkened from #b8567d — docs/08 contrast sweep found the original
      // failed AA (4.5:1) as text against both this theme's background
      // and surface (~4.3/3.9:1); this hits ~4.75/5.3:1 while staying the
      // same rose hue.
      accentDark: "#a24c6e",
      surface: "#fbe9f1",
    },
  },
  {
    id: "midnight-elegant",
    label: "Midnight Elegant",
    description: "Deep navy & silver — formal and dramatic.",
    colors: {
      background: "#0f1420",
      foreground: "#f2f4f8",
      accent: "#c9d4e3",
      accentDark: "#8fa3bf",
      surface: "#1b2436",
    },
  },
  {
    id: "garden-party",
    label: "Garden Party",
    description: "Sage & terracotta on cream — outdoor, brunch, alive.",
    colors: {
      background: "#faf7ee",
      foreground: "#2c3324",
      accent: "#7c8c5e",
      // Darkened from #c1633b — failed AA as text against both this
      // theme's background and surface (~3.8/3.6:1); this hits
      // ~4.76/5.1:1 while staying the same terracotta hue.
      accentDark: "#a25332",
      surface: "#eef0e1",
    },
  },
  {
    id: "ocean-air",
    label: "Ocean Air",
    description: "Dusty blue on off-white — coastal and calm.",
    colors: {
      background: "#f6f8f9",
      foreground: "#22333d",
      accent: "#5b8299",
      accentDark: "#365a6b",
      surface: "#e7eef1",
    },
  },
  {
    id: "fiesta",
    label: "Fiesta",
    description: "Saturated coral & marigold on warm white — loud parties.",
    colors: {
      background: "#fffaf2",
      foreground: "#2c1810",
      accent: "#e8552f",
      // Nudged darker from #c23e1e — passed against background (~5.05:1)
      // but failed against surface (~4.47:1); this hits ~4.77:1 against
      // surface while staying the same coral-red.
      accentDark: "#ba3c1d",
      surface: "#ffe9d6",
    },
  },
  {
    id: "ink-and-blush",
    label: "Ink & Blush",
    description: "Charcoal with a blush accent on white — editorial, chic.",
    colors: {
      background: "#ffffff",
      foreground: "#1c1917",
      accent: "#c98a95",
      accentDark: "#9c5c68",
      surface: "#f7f2f2",
    },
  },
];

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export type ThemeColorOverrides = Partial<Theme["colors"]>;

// A host can nudge individual colors of their chosen theme without leaving
// the preset system entirely — overrides live on the page schema (see
// PageSchema.themeOverrides) since they're a "page builder" concern, same
// as block-level custom CSS, not a new theme_id.
export function resolveThemeColors(themeId: string | null | undefined, overrides: ThemeColorOverrides | undefined) {
  const base = getTheme(themeId).colors;
  return { ...base, ...overrides };
}
