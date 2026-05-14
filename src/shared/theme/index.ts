import type {ThemeMode} from '../../app/store';
import {useAppStore} from '../../app/store';

const LIGHT_COLORS = {
  appBg: 'transparent',
  surface: '#eaf5dc',
  surfaceMuted: '#e1efcf',
  surfaceDark: '#0f1711',
  border: '#c7d8b7',
  textPrimary: '#141a16',
  textSecondary: '#526054',
  textOnDark: '#f5f8f5',
  primary: '#62d84e',
  primaryDeep: '#3ea933',
  primarySoft: '#ccf4b8',
  income: '#2fb34e',
  expense: '#e76452',
  warning: '#f0ae3e',
  neutral: '#66706a',
  shadow: '#101711',
} as const;

const DARK_COLORS = {
  appBg: 'transparent',
  surface: '#11191f',
  surfaceMuted: '#1a252d',
  surfaceDark: '#0b1116',
  border: '#2d3b45',
  textPrimary: '#e6eef4',
  textSecondary: '#9fb1bf',
  textOnDark: '#f5f8f5',
  primary: '#4dcf8f',
  primaryDeep: '#2da56d',
  primarySoft: '#19362b',
  income: '#53d28a',
  expense: '#ff7f6d',
  warning: '#f2b84f',
  neutral: '#7e909e',
  shadow: '#030507',
} as const;

const FOREST_COLORS = {
  appBg: 'transparent',
  surface: '#162118',
  surfaceMuted: '#203025',
  surfaceDark: '#0d140f',
  border: '#314638',
  textPrimary: '#e7f1e7',
  textSecondary: '#a8b9aa',
  textOnDark: '#f5f8f5',
  primary: '#78d05f',
  primaryDeep: '#55a543',
  primarySoft: '#2a3f2e',
  income: '#62c878',
  expense: '#ef7a67',
  warning: '#e6b04f',
  neutral: '#90a08e',
  shadow: '#040805',
} as const;

export const getThemeColors = (mode: ThemeMode) => {
  if (mode === 'dark') {return DARK_COLORS;}
  if (mode === 'forest') {return FOREST_COLORS;}
  return LIGHT_COLORS;
};

export const useThemeColors = () => {
  const mode = useAppStore(s => s.themeMode);
  return getThemeColors(mode);
};

export const theme = {
  colors: LIGHT_COLORS,
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 22,
    xl: 28,
    pill: 999,
  },
  space: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
  },
  text: {
    title: 28,
    h2: 20,
    h3: 16,
    body: 14,
    caption: 12,
    micro: 11,
  },
} as const;
