/**
 * TransactionAppearCard — wrapper cho giao dịch mới.
 *
 * Khi `isNew = true`:
 *  1. Slide + fade in từ trên xuống.
 *  2. Highlight background nhẹ trong 1500ms.
 *  3. Amount scale nhẹ.
 *  4. Sau 1500ms: clear highlight, gọi `onAnimationEnd`.
 */
import React, { useEffect } from 'react';
import { type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { SpringConfig, AnimationDuration } from '../constants';
import { AnimationEasing } from '../easing';

interface TransactionAppearCardProps {
  children: React.ReactNode;
  isNew?: boolean;
  style?: StyleProp<ViewStyle>;
  highlightColor?: string;
  /** Gọi sau khi highlight animation xong */
  onAnimationEnd?: () => void;
}

const HIGHLIGHT_DURATION = 1500;

export const TransactionAppearCard: React.FC<TransactionAppearCardProps> = ({
  children,
  isNew = false,
  style,
  highlightColor = 'rgba(98, 216, 78, 0.12)',
  onAnimationEnd,
}) => {
  const opacity = useSharedValue(isNew ? 0 : 1);
  const translateY = useSharedValue(isNew ? -20 : 0);
  const highlightOpacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!isNew) {return;}

    // 1. Slide + fade in
    opacity.value = withTiming(1, {
      duration: AnimationDuration.normal,
      easing: AnimationEasing.decelerate,
    });
    translateY.value = withSpring(0, SpringConfig.soft);

    // 2. Highlight flash
    highlightOpacity.value = withSequence(
      withTiming(1, { duration: 200, easing: AnimationEasing.standard }),
      withDelay(
        HIGHLIGHT_DURATION - 400,
        withTiming(0, { duration: 400, easing: AnimationEasing.accelerate }),
      ),
    );

    // 3. Amount scale pulse
    scale.value = withSequence(
      withSpring(1.04, SpringConfig.snappy),
      withDelay(200, withSpring(1, SpringConfig.soft)),
    );

    // 4. Notify parent after highlight ends
    if (onAnimationEnd) {
      const timer = setTimeout(() => {
        runOnJS(onAnimationEnd)();
      }, HIGHLIGHT_DURATION);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    ...StyleSheet_absoluteFill,
    borderRadius: 20,
    backgroundColor: highlightColor,
    opacity: highlightOpacity.value,
    pointerEvents: 'none' as any,
  }));

  return (
    <Animated.View style={[style, cardStyle]}>
      {children}
      <Animated.View style={highlightStyle} />
    </Animated.View>
  );
};

// Inline absoluteFill to avoid extra import
const StyleSheet_absoluteFill: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export default TransactionAppearCard;
