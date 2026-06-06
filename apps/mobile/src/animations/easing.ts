/**
 * Reanimated easing presets for Paynote.
 * Import Easing from reanimated.
 */
import { Easing } from 'react-native-reanimated';

export const AnimationEasing = {
  /** Standard ease-out — card appear, slide in */
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
  /** Standard ease-in — slide out, dismiss */
  accelerate: Easing.bezier(0.4, 0.0, 1, 1),
  /** Standard ease-in-out — move, transition */
  standard: Easing.bezier(0.4, 0.0, 0.2, 1),
  /** Bounce-free spring feel for count-up */
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
} as const;
