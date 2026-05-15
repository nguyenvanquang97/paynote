/**
 * AnimatedPressable — thay thế TouchableOpacity/Pressable với spring scale.
 * Dùng cho: FAB, button, card có thể nhấn, filter chips.
 */
import React from 'react';
import { type ViewStyle, type StyleProp } from 'react-native';
import Animated from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { usePressScale } from '../hooks/usePressScale';
import { type SpringConfig, PressScale } from '../constants';

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scale?: number;
  springConfig?: (typeof SpringConfig)[keyof typeof SpringConfig];
  disabled?: boolean;
  /** Accessibility */
  accessibilityRole?: string;
  accessibilityLabel?: string;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  onPress,
  onLongPress,
  style,
  scale = PressScale.normal,
  disabled = false,
}) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({ scale });

  const tap = Gesture.Tap()
    .onBegin(() => { runOnJS(onPressIn)(); })
    .onFinalize((_, success) => {
      runOnJS(onPressOut)();
      if (success && onPress && !disabled) {
        runOnJS(onPress)();
      }
    })
    .enabled(!disabled);

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      if (onLongPress && !disabled) {
        runOnJS(onLongPress)();
      }
    })
    .enabled(!disabled && !!onLongPress);

  const gesture = onLongPress
    ? Gesture.Exclusive(longPress, tap)
    : tap;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

export default AnimatedPressable;
