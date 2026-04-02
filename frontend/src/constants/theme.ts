// Agriculture-inspired color palette
export const Colors = {
  light: {
    primary: '#2D6A4F',
    primaryLight: '#40916C',
    primaryDark: '#1B4332',
    secondary: '#74C69D',
    accent: '#D4A373',
    background: '#FEFEFE',
    surface: '#F8FAF8',
    surfaceSecondary: '#F0F4F0',
    text: '#1A1A1A',
    textSecondary: '#5C5C5C',
    textTertiary: '#8A8A8A',
    border: '#E0E5E0',
    error: '#C1292E',
    success: '#2D6A4F',
    warning: '#E9C46A',
    info: '#457B9D',
    white: '#FFFFFF',
    black: '#000000',
    card: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.08)',
    severityMild: '#74C69D',
    severityModerate: '#E9C46A',
    severitySevere: '#C1292E',
  },
  dark: {
    primary: '#52B788',
    primaryLight: '#74C69D',
    primaryDark: '#40916C',
    secondary: '#95D5B2',
    accent: '#E9C46A',
    background: '#0F1410',
    surface: '#1A211C',
    surfaceSecondary: '#242D26',
    text: '#F0F4F0',
    textSecondary: '#B5C2B5',
    textTertiary: '#7A8A7A',
    border: '#2D3A30',
    error: '#E57373',
    success: '#74C69D',
    warning: '#FFD93D',
    info: '#64B5F6',
    white: '#FFFFFF',
    black: '#000000',
    card: '#1A211C',
    shadow: 'rgba(0, 0, 0, 0.3)',
    severityMild: '#74C69D',
    severityModerate: '#E9C46A',
    severitySevere: '#E57373',
  },
};

export const Typography = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    display: 34,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export type ThemeColors = typeof Colors.light;
export type ColorScheme = 'light' | 'dark';
