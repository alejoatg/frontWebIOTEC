/** Escala de espaciado (base 4px). */
const base = 4;

export const spacing = {
  0: 0,
  1: base * 1,
  2: base * 2,
  3: base * 3,
  4: base * 4,
  5: base * 5,
  6: base * 6,
  8: base * 8,
  10: base * 10,
  12: base * 12,
  16: base * 16,
  20: base * 20,
  24: base * 24,
  32: base * 32,
  40: base * 40,
  48: base * 48,
  64: base * 64,
} as const;

export type Spacing = typeof spacing;
