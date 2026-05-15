/**
 * useCountUp — animate số từ giá trị cũ → mới.
 * Dùng cho: balance, totalIncome, totalExpense, stat cards.
 *
 * - Không animate lần mount đầu nếu `animateOnMount = false`.
 * - Chỉ animate khi value thay đổi thật sự.
 */
import { useEffect, useRef } from 'react';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { AnimationDuration } from '../constants';
import { AnimationEasing } from '../easing';

interface CountUpOptions {
  duration?: number;
  animateOnMount?: boolean;
  onComplete?: () => void;
}

export function useCountUp(
  value: number,
  opts: CountUpOptions = {},
) {
  const {
    duration = AnimationDuration.slow,
    animateOnMount = false,
    onComplete,
  } = opts;

  const animatedValue = useSharedValue(animateOnMount ? 0 : value);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (!animateOnMount) {
        animatedValue.value = value;
        return;
      }
    }
    animatedValue.value = withTiming(
      value,
      { duration, easing: AnimationEasing.smooth },
      (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return { animatedValue };
}
