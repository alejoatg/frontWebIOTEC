/**
 * Paleta de colores del sistema de diseño (Web).
 * Principal: naranja. Secundario: gris. Para Expo: copiar valores a la app móvil.
 */
export const colors = {
  primary: {
    50: '#FFF5F0',
    100: '#FFE8DC',
    200: '#FFD4C2',
    300: '#FFB399',
    400: '#FF8A66',
    500: '#F77F00',
    600: '#E85D04',
    700: '#D54D00',
    800: '#B03D00',
    900: '#8B2E00',
  },
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  semantic: {
    background: '#FFFFFF',
    backgroundSubtle: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    borderFocus: '#F77F00',
    error: '#DC2626',
    success: '#059669',
    warning: '#D97706',
  },
} as const;

export type Colors = typeof colors;
