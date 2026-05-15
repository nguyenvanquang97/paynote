/**
 * usePressScale — spring scale animation khi press in/out.
 * Dùng Reanimated shared value → chạy trên UI thread.
 */
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SpringConfig, PressScale, shouldReduceMotion } from '../constants';

interface PressScaleOptions {
  scale?: number;
  springConfig?: typeof SpringConfig.snappy;
}

export function usePressScale(opts: PressScaleOptions = {}) {
  const {
    scale = PressScale.normal,
    springConfig = SpringConfig.snappy,
  } = opts;
  const reduceMotion = shouldReduceMotion();

  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {return {};}
    return {
      transform: [
        {
          scale: withSpring(pressed.value ? scale : 1, springConfig),
        },
      ],
    };
  });

  const onPressIn = () => { pressed.value = true; };
  const onPressOut = () => { pressed.value = false; };

  return { animatedStyle, onPressIn, onPressOut };
}
