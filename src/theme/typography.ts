/**
 * Tipografía: tamaños, pesos, line-height. Legible en móvil, buen contraste.
 */
export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeights = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.625,
  loose: 1.75,
} as const;

export const typography = {
  fontSizes,
  fontWeights,
  lineHeights,
  fontFamily: {
    sans: 'var(--font-sans), system-ui, -apple-system, sans-serif',
    mono: 'var(--font-mono), ui-monospace, monospace',
  },
} as const;

export type Typography = typeof typography;
