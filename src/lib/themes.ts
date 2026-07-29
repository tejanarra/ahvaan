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

// v1 themes vary by color palette only — every theme shares the same font
// pairing and layout. A full per-theme font/layout system (or a drag-and-
// drop designer) is real scope on its own and is intentionally deferred;
// this proves out "pick and customize a themed invite" without it.
export const THEMES: Theme[] = [
  {
    id: "classic-gold",
    label: "Classic Gold",
    description: "Warm gold & lavender with elegant serif type.",
    colors: {
      background: "#fdfaf6",
      foreground: "#3a2c1a",
      accent: "#a9791f",
      accentDark: "#74490f",
      surface: "#f4e9f6",
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
    description: "Soft pink & mint — friendly and fun, great for parties.",
    colors: {
      background: "#fff7fb",
      foreground: "#3a2c3a",
      accent: "#e879a8",
      accentDark: "#be5a86",
      surface: "#e6f7f0",
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
