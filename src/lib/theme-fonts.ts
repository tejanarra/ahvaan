import {
  Cormorant_Garamond,
  Source_Sans_3,
  Archivo,
  Inter,
  Quicksand,
  Nunito_Sans,
  Marcellus,
  Figtree,
  Lora,
  Karla,
  Libre_Baskerville,
  Lato,
  Bricolage_Grotesque,
  Mulish,
  Playfair_Display,
} from "next/font/google";
import type { ThemeId } from "@/lib/themes";

// Every Stage (guest-theme) font pair, each its own next/font/google
// instance so Next can self-host + subset it. Imported once here, applied
// per-theme by className on the page root (see resolveThemeFontClassName)
// — only the active event's two font stylesheets are ever emitted for a
// given request, never all 8 themes' worth (docs/04-design-system.md:
// "the Studio never pays for them ... except inside the builder preview").
const cormorantGaramond = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-t-cormorant" });
const sourceSans3 = Source_Sans_3({ subsets: ["latin"], variable: "--font-t-source-sans" });
const archivo = Archivo({ subsets: ["latin"], variable: "--font-t-archivo" });
const inter = Inter({ subsets: ["latin"], variable: "--font-t-inter" });
const quicksand = Quicksand({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-t-quicksand" });
const nunitoSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-t-nunito-sans" });
const marcellus = Marcellus({ subsets: ["latin"], weight: "400", variable: "--font-t-marcellus" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-t-figtree" });
const lora = Lora({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-t-lora" });
const karla = Karla({ subsets: ["latin"], variable: "--font-t-karla" });
const libreBaskerville = Libre_Baskerville({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-t-libre-baskerville" });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-t-lato" });
const bricolageGrotesque = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-t-bricolage" });
const mulish = Mulish({ subsets: ["latin"], variable: "--font-t-mulish" });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-t-playfair" });

export type ThemeFontPair = {
  displayClassName: string;
  bodyClassName: string;
  displayVar: string;
  bodyVar: string;
};

const THEME_FONTS: Record<ThemeId, ThemeFontPair> = {
  "classic-gold": {
    displayClassName: cormorantGaramond.className,
    bodyClassName: sourceSans3.className,
    displayVar: cormorantGaramond.style.fontFamily,
    bodyVar: sourceSans3.style.fontFamily,
  },
  "modern-minimal": {
    displayClassName: archivo.className,
    bodyClassName: inter.className,
    displayVar: archivo.style.fontFamily,
    bodyVar: inter.style.fontFamily,
  },
  "playful-pastel": {
    displayClassName: quicksand.className,
    bodyClassName: nunitoSans.className,
    displayVar: quicksand.style.fontFamily,
    bodyVar: nunitoSans.style.fontFamily,
  },
  "midnight-elegant": {
    displayClassName: marcellus.className,
    bodyClassName: figtree.className,
    displayVar: marcellus.style.fontFamily,
    bodyVar: figtree.style.fontFamily,
  },
  "garden-party": {
    displayClassName: lora.className,
    bodyClassName: karla.className,
    displayVar: lora.style.fontFamily,
    bodyVar: karla.style.fontFamily,
  },
  "ocean-air": {
    displayClassName: libreBaskerville.className,
    bodyClassName: lato.className,
    displayVar: libreBaskerville.style.fontFamily,
    bodyVar: lato.style.fontFamily,
  },
  fiesta: {
    displayClassName: bricolageGrotesque.className,
    bodyClassName: inter.className,
    displayVar: bricolageGrotesque.style.fontFamily,
    bodyVar: inter.style.fontFamily,
  },
  "ink-and-blush": {
    displayClassName: playfairDisplay.className,
    bodyClassName: mulish.className,
    displayVar: playfairDisplay.style.fontFamily,
    bodyVar: mulish.style.fontFamily,
  },
};

export function resolveThemeFonts(themeId: string | null | undefined): ThemeFontPair {
  return THEME_FONTS[(themeId as ThemeId) ?? "classic-gold"] ?? THEME_FONTS["classic-gold"];
}
