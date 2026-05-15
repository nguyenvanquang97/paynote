/**
 * ─────────────────────────────────────────────
 *  THEME REGISTRY
 *  Để thêm theme mới:
 *    1. Thêm 1 entry vào THEME_REGISTRY bên dưới.
 *    2. Không cần sửa bất kỳ file nào khác.
 * ─────────────────────────────────────────────
 */

export interface ThemeColors {
  appBg: string;
  surface: string;
  surfaceMuted: string;
  surfaceDark: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textOnDark: string;
  primary: string;
  primaryDeep: string;
  primarySoft: string;
  income: string;
  expense: string;
  warning: string;
  neutral: string;
  shadow: string;
}

export interface ThemeDefinition {
  /** Unique identifier – dùng làm ThemeMode */
  id: string;
  /** Nhãn hiển thị cho người dùng */
  label: string;
  /** Emoji hoặc ký tự đại diện */
  emoji?: string;
  colors: ThemeColors;
}

// ─── Khai báo các themes ───────────────────────────────────────────────────

const LIGHT: ThemeDefinition = {
  id: 'light',
  label: 'Light',
  emoji: '☀️',
  colors: {
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
  },
};

const DARK: ThemeDefinition = {
  id: 'dark',
  label: 'Dark',
  emoji: '🌙',
  colors: {
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
  },
};

const FOREST: ThemeDefinition = {
  id: 'forest',
  label: 'Forest',
  emoji: '🌲',
  colors: {
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
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  THEME REGISTRY – đây là nơi duy nhất cần chỉnh khi thêm/xóa theme
// ─────────────────────────────────────────────────────────────────────────────
export const THEME_REGISTRY: ThemeDefinition[] = [LIGHT, DARK, FOREST];

// ─── Derived helpers (tự động, không cần sửa) ─────────────────────────────

/** Union type của tất cả theme id, e.g. 'light' | 'dark' | 'forest' */
export type ThemeMode = (typeof THEME_REGISTRY)[number]['id'];

/** Default theme khi chưa có lựa chọn */
export const DEFAULT_THEME_ID: ThemeMode = LIGHT.id;

/** Map id → ThemeDefinition để lookup O(1) */
export const THEME_MAP: Record<string, ThemeDefinition> = Object.fromEntries(
  THEME_REGISTRY.map(t => [t.id, t]),
);

/** Tất cả ThemeMode hợp lệ (dùng để validate giá trị từ storage) */
export const VALID_THEME_IDS: ReadonlySet<string> = new Set(
  THEME_REGISTRY.map(t => t.id),
);

/** Lấy màu theo mode, fallback về default nếu mode không tồn tại */
export const getThemeColors = (mode: ThemeMode): ThemeColors =>
  THEME_MAP[mode]?.colors ?? THEME_MAP[DEFAULT_THEME_ID].colors;
