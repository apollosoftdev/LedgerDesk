import { Platform } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 36, fontWeight: '700' as const, letterSpacing: -0.8 },
  h1:      { fontSize: 24, fontWeight: '600' as const, letterSpacing: -0.3 },
  h2:      { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2 },
  h3:      { fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.1 },
  body:    { fontSize: 14, fontWeight: '400' as const },
  bodyBold:{ fontSize: 14, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  label:   { fontSize: 12, fontWeight: '500' as const },
  mono: {
    fontSize: 13,
    fontWeight: '600' as const,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
} as const;

/**
 * Shadow presets — MUI-style elevation.
 * iOS uses shadowColor/Offset/Opacity/Radius, Android uses elevation.
 * On dark surfaces shadows are less visible; the slight surface tint does
 * the visual lifting. Values tuned so both platforms feel consistent.
 */
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;
