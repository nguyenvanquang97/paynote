/**
 * AnimatedNumber — wrapper around NumberFlow with project-compatible API.
 * Keeps old props while delegating rolling animation to number-flow-react-native.
 */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Text, StyleSheet, type StyleProp, type TextStyle} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {NumberFlow} from 'number-flow-react-native';
import {AnimationDuration} from '../constants';
import {AnimationEasing} from '../easing';

export type AnimatedNumberFormat = 'currency' | 'number' | 'percent';

interface AnimatedNumberProps {
  value: number;
  format?: AnimatedNumberFormat;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
  duration?: number;
  /** If false (default), skip animation on first mount. */
  animateOnMount?: boolean;
  /** Optional light pulse on number change (default true). */
  pulseOnChange?: boolean;
}

const formatFallbackValue = (num: number, format: AnimatedNumberFormat): string => {
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  switch (format) {
    case 'currency':
      return `${sign}${new Intl.NumberFormat('vi-VN').format(abs)} ₫`;
    case 'percent':
      return `${sign}${abs.toFixed(1)}%`;
    default:
      return `${sign}${new Intl.NumberFormat('vi-VN').format(abs)}`;
  }
};

const clamp = (num: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, num));

const getAdaptiveDuration = (from: number, to: number, fallback: number): number => {
  const delta = Math.abs(to - from);
  if (delta <= 0) {return 0;}
  if (delta < 1000) {return clamp(fallback, 180, 280);}
  if (delta < 100000) {return clamp(fallback + 80, 240, 420);}
  return clamp(fallback + 180, 320, 700);
};

const FlowEasing = {
  smooth: (t: number): number => 1 - (1 - t) * (1 - t) * (1 - t),
  standard: (t: number): number => t * t * (3 - 2 * t),
  decelerate: (t: number): number => 1 - (1 - t) * (1 - t),
} as const;

const getNumberFormat = (format: AnimatedNumberFormat): Intl.NumberFormatOptions => {
  switch (format) {
    case 'currency':
      return {
        style: 'currency',
        currency: 'VND',
        currencyDisplay: 'narrowSymbol',
        maximumFractionDigits: 0,
      };
    case 'percent':
      return {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      };
    default:
      return {
        style: 'decimal',
        maximumFractionDigits: 0,
      };
  }
};

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  format = 'currency',
  prefix = '',
  suffix = '',
  style,
  duration = AnimationDuration.slow,
  animateOnMount = false,
  pulseOnChange = true,
}) => {
  const pulse = useSharedValue(1);
  const isFirstMount = useRef(true);
  const previousValue = useRef(animateOnMount ? 0 : value);
  const [shouldAnimate, setShouldAnimate] = useState(animateOnMount);
  const [timingDuration, setTimingDuration] = useState(duration);

  const numberFormat = useMemo(() => getNumberFormat(format), [format]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (!animateOnMount) {
        setShouldAnimate(false);
        previousValue.current = value;
        setTimingDuration(duration);
        return;
      }
    }

    if (value !== previousValue.current) {
      const nextDuration = getAdaptiveDuration(previousValue.current, value, duration) || duration;
      setTimingDuration(nextDuration);
      setShouldAnimate(true);
      if (pulseOnChange) {
        pulse.value = withSequence(
          withTiming(1.05, {duration: 110, easing: AnimationEasing.decelerate}),
          withTiming(1, {duration: 170, easing: AnimationEasing.standard}),
        );
      }
      previousValue.current = value;
    }
  }, [animateOnMount, duration, pulse, pulseOnChange, value]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{scale: pulse.value}],
    opacity: pulse.value < 1 ? 0.92 : 1,
  }));

  const safeValue = Number.isFinite(value) ? value : 0;
  const isFallback = !Number.isFinite(value);

  if (isFallback) {
    return (
      <Text style={style}>
        {`${prefix}${formatFallbackValue(safeValue, format)}${suffix}`}
      </Text>
    );
  }

  const flowValue = format === 'percent' ? safeValue / 100 : safeValue;

  return (
    <Animated.View style={pulseStyle}>
      <NumberFlow
        value={flowValue}
        format={numberFormat}
        locales="vi-VN"
        prefix={prefix}
        suffix={suffix}
        style={StyleSheet.flatten(style)}
        animated={shouldAnimate}
        respectMotionPreference
        continuous={false}
        mask
        spinTiming={{
          duration: timingDuration,
          easing: FlowEasing.smooth,
        }}
        transformTiming={{
          duration: timingDuration,
          easing: FlowEasing.standard,
        }}
        opacityTiming={{
          duration: Math.min(timingDuration, 260),
          easing: FlowEasing.decelerate,
        }}
      />
    </Animated.View>
  );
};

export default AnimatedNumber;
