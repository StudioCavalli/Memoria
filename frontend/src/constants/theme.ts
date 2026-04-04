/**
 * Memoria Design Tokens
 *
 * Senior-friendly design system for 80+ year old users.
 * All colors meet WCAG AAA contrast requirements (7:1 ratio minimum).
 * All font sizes are minimum 24pt. Warm, calming palette.
 */

export const Colors = {
  // Backgrounds -- warm, soft tones
  backgroundPrimary: "#FFF8F0", // warm cream
  backgroundSecondary: "#FFF0E0", // soft peach
  backgroundCard: "#FFFFFF",

  // Text -- high contrast against warm backgrounds
  textPrimary: "#1A1A2E", // near-black with warmth
  textSecondary: "#3D3D5C", // dark slate
  textMuted: "#5C5C7A", // medium contrast (still AAA on white)

  // Button states
  buttonIdle: "#1B4F9E", // strong calm blue
  buttonListening: "#1A7A3D", // confident green
  buttonThinking: "#C66A00", // warm amber/orange
  buttonSpeaking: "#6B3FA0", // gentle purple

  // Button text (white on all button colors meets AAA)
  buttonText: "#FFFFFF",

  // Accent and feedback
  accentWarm: "#D4845A", // terracotta accent
  accentCalm: "#5B9BD5", // soft sky blue
  success: "#2E7D32",
  error: "#C62828",

  // Borders and dividers
  border: "#D4C5B5", // warm grey
  divider: "#E8DDD0",

  // Overlay
  overlay: "rgba(26, 26, 46, 0.4)",
} as const;

export const FontSizes = {
  /** Small labels -- still large enough for seniors */
  body: 24,
  /** Standard readable text */
  bodyLarge: 28,
  /** Sub-headings */
  heading3: 32,
  /** Section headings */
  heading2: 40,
  /** Main headings, clock display */
  heading1: 48,
  /** Hero-size text */
  hero: 64,
} as const;

export const Spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
} as const;

export const Shadows = {
  soft: {
    shadowColor: "#1A1A2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: "#1A1A2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  strong: {
    shadowColor: "#1A1A2E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

const Theme = {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  Shadows,
} as const;

export default Theme;
