/**
 * Sistema de diseño de la app web (autónomo, sin shared).
 * Para Expo: copiar valores de colors, spacing, typography a la app móvil.
 */
export { colors } from './colors';
export type { Colors } from './colors';
export { fontSizes, fontWeights, lineHeights, typography } from './typography';
export type { Typography } from './typography';
export { spacing } from './spacing';
export type { Spacing } from './spacing';
export { breakpoints } from './breakpoints';
export type { Breakpoints } from './breakpoints';

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { breakpoints } from './breakpoints';

export const theme = {
  colors,
  typography,
  spacing,
  breakpoints,
} as const;

export type Theme = typeof theme;
