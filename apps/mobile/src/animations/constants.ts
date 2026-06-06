// Animation duration constants (ms)
export const AnimationDuration = {
  fast: 120,
  normal: 220,
  slow: 400,
} as const;

export const ChartAnimationDuration = {
  pie: 720,
  bar: 680,
  progress: 520,
  settle: 120,
  skeletonFade: 180,
} as const;

export const ChartAnimationDelay = {
  legendBase: 40,
  legendStep: 26,
  barRender: 100,
} as const;

// Spring configurations for Reanimated
export const SpringConfig = {
  /** Mềm, tự nhiên — dùng cho card appear, modal */
  soft: {
    damping: 14,
    stiffness: 180,
  },
  /** Nhanh, snappy — dùng cho button press, tab switch */
  snappy: {
    damping: 18,
    stiffness: 260,
  },
  /** Rất chắc — dùng cho icon scale */
  tight: {
    damping: 22,
    stiffness: 350,
  },
} as const;

// Scale values for press interactions
export const PressScale = {
  subtle: 0.97,
  normal: 0.94,
  strong: 0.90,
} as const;

// Helper: check if reduce motion is preferred.
// In future, wire this to AccessibilityInfo.isReduceMotionEnabled
export const shouldReduceMotion = (): boolean => false;
