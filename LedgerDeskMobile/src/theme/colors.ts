export const darkColors = {
  // Base surfaces — deep, neutral, slightly cool
  bg: '#0A0A0F',
  bgElevated: '#11111A',
  surface: '#17171F',
  surfaceAlt: '#1E1E28',
  surfaceHover: '#24242F',
  border: '#2A2A36',
  borderSubtle: '#1F1F29',
  divider: '#22222C',

  // Text — high-contrast pearlescent neutrals
  text: '#F5F5F7',
  textMuted: '#9C9CA8',
  textDim: '#6B6B78',
  textInverse: '#0A0A0F',

  // Luxury accent — gold / amber for primary actions
  accent: '#D4AF37',
  accentHover: '#E4C158',
  accentMuted: '#8A7225',
  accentBg: 'rgba(212, 175, 55, 0.12)',

  // Semantic money colors
  income: '#4ADE80',
  incomeBg: 'rgba(74, 222, 128, 0.12)',
  expense: '#F87171',
  expenseBg: 'rgba(248, 113, 113, 0.12)',

  // Status
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#EF4444',
  info: '#60A5FA',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.72)',
  scrim: 'rgba(10, 10, 15, 0.94)',
} as const;

export const lightColors = {
  bg: '#FAFAFA',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F5F7',
  surfaceHover: '#EDEDF0',
  border: '#E5E5EA',
  borderSubtle: '#EFEFF2',
  divider: '#E8E8ED',

  text: '#0A0A0F',
  textMuted: '#6B6B78',
  textDim: '#9C9CA8',
  textInverse: '#FFFFFF',

  accent: '#B8961F',
  accentHover: '#D4AF37',
  accentMuted: '#9C7E1A',
  accentBg: 'rgba(212, 175, 55, 0.14)',

  income: '#16A34A',
  incomeBg: 'rgba(22, 163, 74, 0.1)',
  expense: '#DC2626',
  expenseBg: 'rgba(220, 38, 38, 0.1)',

  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',

  overlay: 'rgba(0, 0, 0, 0.5)',
  scrim: 'rgba(250, 250, 250, 0.94)',
} as const;

export type ThemeColors = typeof darkColors;
