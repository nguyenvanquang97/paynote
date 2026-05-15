/**
 * AnimatedEmptyState — empty state với pulsing icon và fade-in text.
 * Dùng cho: chưa có giao dịch, chưa có thống kê, không tìm thấy kết quả.
 *
 * Phase 7: Empty state animation.
 *
 * Animation:
 * - Fade + slide in toàn bộ container.
 * - Icon pulse rất chậm (loop nhẹ) để tạo cảm giác sống động.
 * - Text + CTA fade in với delay.
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  type ViewStyle,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { useFadeSlideIn } from '../hooks/useFadeSlideIn';
import { AnimationDuration } from '../constants';
import { AnimationEasing } from '../easing';

interface AnimatedEmptyStateProps {
  icon: string;           // Emoji icon
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;  // CTA button etc.
}

export const AnimatedEmptyState: React.FC<AnimatedEmptyStateProps> = ({
  icon,
  title,
  subtitle,
  style,
  iconSize = 52,
  titleStyle,
  subtitleStyle,
  children,
}) => {
  const { animatedStyle: containerStyle } = useFadeSlideIn({ delay: 0, fromY: 20 });

  // Icon: slow pulse scale (loop nhẹ, không gây mất tập trung)
  const iconScale = useSharedValue(1);
  const textOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    // Icon pulse: 1 → 1.06 → 1, 3200ms cycle, rất chậm
    iconScale.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1.07, {
            duration: 1600,
            easing: AnimationEasing.standard,
          }),
          withTiming(1, {
            duration: 1600,
            easing: AnimationEasing.standard,
          }),
        ),
        -1, // infinite
        false,
      ),
    );

    // Text fade in
    textOpacity.value = withDelay(
      150,
      withTiming(1, { duration: AnimationDuration.slow, easing: AnimationEasing.decelerate }),
    );

    // CTA fade in last
    ctaOpacity.value = withDelay(
      350,
      withTiming(1, { duration: AnimationDuration.slow, easing: AnimationEasing.decelerate }),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          alignItems: 'center',
          paddingVertical: 48,
          paddingHorizontal: 24,
        },
        style,
        containerStyle,
      ]}>
      <Animated.Text style={[{ fontSize: iconSize, marginBottom: 16 }, iconStyle]}>
        {icon}
      </Animated.Text>

      <Animated.View style={textStyle}>
        <Text
          style={[
            {
              fontSize: 17,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: subtitle ? 8 : 0,
            },
            titleStyle,
          ]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              {
                fontSize: 14,
                textAlign: 'center',
                lineHeight: 20,
                opacity: 0.7,
              },
              subtitleStyle,
            ]}>
            {subtitle}
          </Text>
        ) : null}
      </Animated.View>

      {children ? (
        <Animated.View style={[{ marginTop: 20 }, ctaStyle]}>
          {children}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};

export default AnimatedEmptyState;
