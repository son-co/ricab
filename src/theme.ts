export const colors = {
  bg: '#F6F7EA',
  surface: '#FFFFFF',
  surfaceAlt: '#FBFCF4',
  primary: '#1E5B45',
  primaryDark: '#14432F',
  primarySoft: '#E4F0E8',
  accent: '#F2D479',
  accentInk: '#1F3F2E',
  text: '#152A21',
  textMuted: '#6D7C74',
  textFaint: '#95A29B',
  border: '#E4E8DA',
  borderStrong: '#D3DAC7',
  danger: '#C9564A',
  dangerSoft: '#FBEAE7',
  warning: '#D9873F',
  warningSoft: '#FDF1E4',
  info: '#3D6FA6',
  infoSoft: '#E9F1FA',
  success: '#2E7D52',
  successSoft: '#E4F0E8',
  greySoft: '#EFF1E7',
  white: '#FFFFFF',
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  xl: 32,
  pill: 999,
} as const;

export const space = (n: number): number => n * 4;

export const shadow = {
  card: {
    shadowColor: '#1E3A2F',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  soft: {
    shadowColor: '#1E3A2F',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 32,
} as const;
