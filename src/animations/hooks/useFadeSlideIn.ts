/**
 * useFadeSlideIn — fade + translateY animation khi component mount.
 * Dùng cho: card, section, empty state.
 */
import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { AnimationDuration } from '../constants';
import { AnimationEasing } from '../easing';

interface FadeSlideInOptions {
  delay?: number;
  duration?: number;
  fromY?: number;
}

export function useFadeSlideIn(opts: FadeSlideInOptions = {}) {
  const {
    delay = 0,
    duration = AnimationDuration.normal,
    fromY = 16,
  } = opts;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(fromY);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: AnimationEasing.decelerate }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration, easing: AnimationEasing.decelerate }),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { animatedStyle };
}
