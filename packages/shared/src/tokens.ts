/**
 * Kekego Brand Identity, Visual Tokens & Design System
 * Primary: Tricycle Amber (#F59E0B)
 * Secondary: Deep Transit Emerald (#0F766E)
 */

export const BRAND_COLORS = {
  primary: {
    DEFAULT: "#F59E0B",
    hover: "#D97706",
    active: "#B45309",
    subtle: "#FEF3C7",
  },
  secondary: {
    DEFAULT: "#0F766E",
    hover: "#115E59",
    active: "#134E4A",
    subtle: "#CCFBF1",
  },
  neutral: {
    canvasLight: "#F8FAFC",
    cardLight: "#FFFFFF",
    borderLight: "#E2E8F0",
    textMuted: "#64748B",
    textPrimary: "#0F172A",
    // Dark / Driver Night Mode
    canvasDark: "#090D16",
    cardDark: "#131B2E",
    borderDark: "#1E293B",
    textLight: "#F8FAFC",
    textMutedDark: "#94A3B8",
  },
  status: {
    success: "#10B981", // Active ride / verified
    warning: "#F97316", // Surge / alert
    error: "#EF4444",   // SOS / cancellation
    info: "#0284C7",    // En route
  },
} as const;

export const TYPOGRAPHY = {
  fontSans: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "JetBrains Mono, Menlo, monospace",
} as const;

export const SPACING_GRID = {
  unit: 4,
  touchTargetMin: 48, // 48px min touch target
} as const;
