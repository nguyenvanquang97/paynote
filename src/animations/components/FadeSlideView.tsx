/**
 * FadeSlideView — wrapper fade + translateY khi mount.
 * Dùng cho: stat cards, sections, empty states.
 */
import React from 'react';
import { type ViewStyle, type StyleProp } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeSlideIn } from '../hooks/useFadeSlideIn';

interface FadeSlideViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
  fromY?: number;
}

export const FadeSlideView: React.FC<FadeSlideViewProps> = ({
  children,
  style,
  delay = 0,
  duration,
  fromY = 16,
}) => {
  const { animatedStyle } = useFadeSlideIn({ delay, duration, fromY });

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export default FadeSlideView;
