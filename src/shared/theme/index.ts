/**
 * Theme public API
 * Import mọi thứ liên quan đến theme từ đây.
 */

export type {ThemeColors, ThemeDefinition, ThemeMode} from './themes';
export {
  THEME_REGISTRY,
  THEME_MAP,
  VALID_THEME_IDS,
  DEFAULT_THEME_ID,
  getThemeColors,
} from './themes';

import {useAppStore} from '../../app/store';
import {getThemeColors} from './themes';

/** Hook lấy màu của theme hiện tại */
export const useThemeColors = () => {
  const mode = useAppStore(s => s.themeMode);
  return getThemeColors(mode);
};

// ─── Static design tokens (không phụ thuộc theme) ─────────────────────────
export const theme = {
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
