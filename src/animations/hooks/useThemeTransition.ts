/**
 * useThemeTransition — trả về animated interpolated colors khi theme đổi.
 * Dùng Reanimated withTiming để transition color mượt thay vì snap ngay.
 *
 * Phase 6: Theme switch animation
 */
import { useEffect } from 'react';
import {
  useSharedValue,
  withTiming,
  withSequence,
  cancelAnimation,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { AnimationDuration } from '../constants';
import { AnimationEasing } from '../easing';
import { useThemeColors } from '../../shared/theme';
import type { ThemeColors } from '../../shared/theme';
import {useAppStore} from '../../app/store';

/**
 * Hook trả về animated opacity value để fade toàn bộ app khi đổi theme.
 * Cách dùng: wrap root view với Animated.View style={fadeStyle}
 * → khi theme đổi, app fade nhẹ rồi fade back in với màu mới.
 */
export function useThemeTransition() {
  const themeMode = useAppStore(s => s.themeMode);
  const colors = useThemeColors();
  const opacity = useSharedValue(1);

  // Mỗi khi themeMode đổi: luôn restart fade sequence.
  useEffect(() => {
    cancelAnimation(opacity);
    opacity.value = 1;
    opacity.value = withSequence(
      withTiming(0.85, {
        duration: AnimationDuration.fast,
        easing: AnimationEasing.accelerate,
      }),
      withTiming(1, {
        duration: AnimationDuration.normal,
        easing: AnimationEasing.decelerate,
      }),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeMode]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { fadeStyle, colors };
}

export type { ThemeColors };
