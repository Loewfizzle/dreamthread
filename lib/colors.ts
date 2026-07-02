/**
 * Quiet Midnight color tokens for Dreamthread.
 *
 * These are the source-of-truth hex values for the design system.
 * The actual runtime colors are driven by CSS variables in globals.css
 * (which enables dark mode via prefers-color-scheme and Tailwind integration).
 *
 * Use these in TypeScript/JS when you need the raw values (e.g. for
 * dynamic styles, canvas, charts, or design system documentation).
 */

export const colors = {
  light: {
    background: "#f7f5f0",
    foreground: "#1f2937",
    primary: "#1e2a4a",
    primaryForeground: "#f7f5f0",
    accent: "#8a86c0",
    accentForeground: "#1e2a4a",
    muted: "#6b7280",
    mutedForeground: "#6b7280",
    card: "#fdfaf5",
    cardForeground: "#1f2937",
    border: "#e6e2d9",
  },
  dark: {
    background: "#0c0e17",
    foreground: "#e5e3d9",
    primary: "#4a5a80",
    primaryForeground: "#f7f5f0",
    accent: "#b0acd9",
    accentForeground: "#0c0e17",
    muted: "#9aa0ae",
    mutedForeground: "#9aa0ae",
    card: "#151720",
    cardForeground: "#e5e3d9",
    border: "#2c2e3a",
  },
} as const;

export type ColorMode = keyof typeof colors;
export type ColorToken = keyof typeof colors.light;

/**
 * Helper to get a color token for the current mode.
 * In most cases you should prefer the CSS variables / Tailwind classes instead.
 */
export function getColor(token: ColorToken, mode: ColorMode = "light"): string {
  return colors[mode][token];
}

// Re-export individual values for convenience (light mode defaults)
export const {
  background,
  foreground,
  primary,
  primaryForeground,
  accent,
  accentForeground,
  muted,
  mutedForeground,
  card,
  cardForeground,
  border,
} = colors.light;
