/**
 * Brand tokens lifted from hhgoa.com — keep these in sync with the live site.
 * Colours were sampled from the site stylesheet; the typefaces are the two
 * families the site loads (Imbue for display, Victor Mono for everything else).
 */

export const COLORS = {
  green: "#0b6839",
  greenDeep: "#074a28",
  yellow: "#fee101",
  pink: "#ff0080",
  cream: "#fffbe8",
  white: "#ffffff",
  black: "#000000",
} as const;

export const DISPLAY = "Imbue";
export const MONO = "Victor Mono";

export const EVENT = {
  name: "HACKER HOUSE",
  place: "GOA",
  year: "2026",
  dates: "28–31 OCT 2026",
  datesShort: "28-31 OCT",
  tagline: "LESS NOISE. MORE SIGNAL.",
  host: "2:47 PM STUDIO",
  site: "hhgoa.com",
  hashtag: "#FrameInGoa",
} as const;

/** Ring / accent themes offered in the PFP editor. */
export type ThemeName = "sunrise" | "midnight" | "bougainvillea";

export const THEMES: Record<
  ThemeName,
  { label: string; band: string; ink: string; accent: string; edge: string }
> = {
  sunrise: {
    label: "Sunrise",
    band: COLORS.green,
    ink: COLORS.yellow,
    accent: COLORS.yellow,
    edge: COLORS.cream,
  },
  midnight: {
    label: "Midnight",
    band: COLORS.black,
    ink: COLORS.yellow,
    accent: COLORS.yellow,
    edge: COLORS.green,
  },
  bougainvillea: {
    label: "Bougainvillea",
    band: COLORS.pink,
    ink: COLORS.cream,
    accent: COLORS.yellow,
    edge: COLORS.cream,
  },
};

/** Every font/size combination the canvas renderers ask for, so we can await them. */
export const FONT_PRELOAD = [
  `400 100px "${DISPLAY}"`,
  `700 100px "${DISPLAY}"`,
  `900 100px "${DISPLAY}"`,
  `400 100px "${MONO}"`,
  `500 100px "${MONO}"`,
  `700 100px "${MONO}"`,
];
