export type ThemeId =
  | "classic-gold"
  | "modern-minimal"
  | "playful-pastel"
  | "midnight-elegant";

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

// v1 themes vary by color palette only — every theme shares the same clean
// sans-serif type and layout. A full per-theme font/layout system (or a
// drag-and-drop designer) is real scope on its own and is intentionally
// deferred; this proves out "pick and customize a themed invite" without it.
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
      accentDark: "#b8567d",
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
