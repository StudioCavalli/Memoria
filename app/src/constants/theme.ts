/**
 * Memoria Design Tokens
 *
 * Senior-friendly design system for 80+ year old users.
 * Palette matched to the Memoria website (warm cream/brown).
 * All font sizes are minimum 24pt.
 */

export const Colors = {
  // Backgrounds -- warm, soft tones (website match)
  cream: "#FFF8F0",
  backgroundPrimary: "#FFF8F0",
  backgroundSecondary: "#FFF0E0",
  backgroundCard: "#FFFFFF",
  white: "#FFFFFF",

  // Website palette
  brown: "#7D6340",
  brownDark: "#6B5235",
  brownLight: "#8B6F47",
  orangeSoft: "#E8A87C",
  orangeText: "#9A6429",
  roseDusty: "#D4A5A5",
  greenForest: "#4A7A35",

  // Text -- high contrast against warm backgrounds
  textDark: "#3D2C1E",
  textPrimary: "#3D2C1E",
  textSecondary: "#5C4A3A",
  textMuted: "#7A6555",

  // Button states (website palette)
  buttonIdle: "#7D6340",
  buttonListening: "#E8A87C",
  buttonThinking: "#8B6F47",
  buttonSpeaking: "#4A7A35",

  // Button text
  buttonText: "#FFFFFF",

  // Accent and feedback
  accentWarm: "#E8A87C",
  accentCalm: "#D4A5A5",
  success: "#4A7A35",
  error: "#C62828",

  // Borders and dividers
  border: "#D4C5B5",
  divider: "#E8DDD0",

  // Overlay
  overlay: "rgba(61, 44, 30, 0.4)",
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
    shadowColor: "#7D6340",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: "#7D6340",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  strong: {
    shadowColor: "#7D6340",
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
