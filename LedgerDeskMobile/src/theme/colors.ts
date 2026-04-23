/**
 * LedgerDesk color tokens — MUI-style palettes.
 * Shape mirrors the HTML mockup: grey surfaces, primary blue, success green,
 * error orange-red, info purple. Each semantic palette exposes lighter/light/
 * main/dark/darker shades so components can pick the right variant.
 */

export const grey = {
  50:  '#FCFDFD',
  100: '#F9FAFB',
  200: '#F4F6F8',
  300: '#DFE3E8',
  400: '#C4CDD5',
  500: '#919EAB',
  600: '#637381',
  700: '#454F5B',
  800: '#1C252E',
  900: '#141A21',
} as const;

export const primaryPalette = {
  lighter: '#D0ECFE',
  light:   '#73BAFB',
  main:    '#1877F2',
  dark:    '#0C44AE',
  darker:  '#042174',
} as const;

export const successPalette = {
  lighter: '#D3FCD2',
  light:   '#77ED8B',
  main:    '#22C55E',
  dark:    '#118D57',
  darker:  '#065E49',
} as const;

export const errorPalette = {
  lighter: '#FFE9D5',
  light:   '#FFAC82',
  main:    '#FF5630',
  dark:    '#B71D18',
  darker:  '#7A0916',
} as const;

export const infoPalette = {
  lighter: '#EFD6FF',
  light:   '#C684FF',
  main:    '#8E33FF',
  dark:    '#5119B7',
  darker:  '#27097A',
} as const;

export const darkColors = {
  // Surfaces (grey-900 base, grey-800 raised)
  bg:            grey[900],
  bgElevated:    grey[800],
  surface:       grey[800],
  surfaceAlt:    '#263440',
  surfaceHover:  '#2E3944',
  surfacePress:  grey[700],

  // Dividers / outlines (grey-500 with alpha)
  border:        'rgba(145, 158, 171, 0.22)',
  borderSubtle:  'rgba(145, 158, 171, 0.10)',
  divider:       'rgba(145, 158, 171, 0.10)',

  // Text
  text:         '#FFFFFF',
  textMuted:    grey[400],
  textDim:      grey[500],
  textInverse:  '#FFFFFF',

  // Primary (action + accent)
  primary:      primaryPalette.main,
  primaryHi:    primaryPalette.light,
  primaryLo:    primaryPalette.dark,
  primaryCont:  primaryPalette.darker,
  primaryBg:    'rgba(24, 119, 242, 0.14)',
  onPrimary:    '#FFFFFF',

  // Legacy accent aliases (keep so existing screens don't break)
  accent:       primaryPalette.main,
  accentHover:  primaryPalette.light,
  accentMuted:  primaryPalette.dark,
  accentBg:     'rgba(24, 119, 242, 0.14)',

  // Semantic money colors — success = income, error = expense
  income:       successPalette.main,
  incomeBg:     'rgba(34, 197, 94, 0.14)',
  expense:      errorPalette.main,
  expenseBg:    'rgba(255, 86, 48, 0.12)',

  // Status
  success:      successPalette.main,
  successBg:    'rgba(34, 197, 94, 0.14)',
  warning:      '#FFA726',
  danger:       errorPalette.main,
  dangerBg:     'rgba(255, 86, 48, 0.12)',
  info:         infoPalette.main,
  infoBg:       'rgba(142, 51, 255, 0.14)',

  // Overlays
  overlay:      'rgba(0, 0, 0, 0.72)',
  scrim:        'rgba(20, 26, 33, 0.94)',
} as const;

export const lightColors = {
  bg:            grey[100],
  bgElevated:    '#FFFFFF',
  surface:       '#FFFFFF',
  surfaceAlt:    grey[200],
  surfaceHover:  grey[300],
  surfacePress:  grey[400],

  border:        'rgba(145, 158, 171, 0.32)',
  borderSubtle:  'rgba(145, 158, 171, 0.18)',
  divider:       'rgba(145, 158, 171, 0.18)',

  text:         grey[900],
  textMuted:    grey[600],
  textDim:      grey[500],
  textInverse:  '#FFFFFF',

  primary:      primaryPalette.main,
  primaryHi:    primaryPalette.light,
  primaryLo:    primaryPalette.dark,
  primaryCont:  primaryPalette.lighter,
  primaryBg:    'rgba(24, 119, 242, 0.10)',
  onPrimary:    '#FFFFFF',

  accent:       primaryPalette.main,
  accentHover:  primaryPalette.light,
  accentMuted:  primaryPalette.dark,
  accentBg:     'rgba(24, 119, 242, 0.10)',

  income:       successPalette.dark,
  incomeBg:     'rgba(17, 141, 87, 0.10)',
  expense:      errorPalette.main,
  expenseBg:    'rgba(255, 86, 48, 0.10)',

  success:      successPalette.dark,
  successBg:    'rgba(17, 141, 87, 0.10)',
  warning:      '#ED6C02',
  danger:       errorPalette.main,
  dangerBg:     'rgba(255, 86, 48, 0.10)',
  info:         infoPalette.dark,
  infoBg:       'rgba(142, 51, 255, 0.08)',

  overlay:      'rgba(15, 23, 42, 0.5)',
  scrim:        'rgba(249, 250, 251, 0.94)',
} as const;

export type ThemeColors = typeof darkColors;
