/**
 * SuccessCheck — checkmark animation sau khi submit giao dịch thành công.
 * Hiển thị: circle expand + checkmark draw + fade out.
 * Duration: ~800ms total.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { AnimationDuration } from '../constants';

interface SuccessCheckProps {
  visible: boolean;
  size?: number;
  color?: string;
  onDone?: () => void;
}

export const SuccessCheck: React.FC<SuccessCheckProps> = ({
  visible,
  size = 56,
  color = '#62d84e',
  onDone,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      scale.value = 0;
      opacity.value = 0;
      return;
    }

    // Pop in
    scale.value = withSequence(
      withSpring(1.15, { damping: 12, stiffness: 280 }),
      withSpring(1, { damping: 18, stiffness: 300 }),
    );
    opacity.value = withTiming(1, { duration: 200 });

    // Fade out after 700ms
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: AnimationDuration.normal });
      scale.value = withTiming(0.8, { duration: AnimationDuration.normal });
      if (onDone) {
        setTimeout(onDone, AnimationDuration.normal);
      }
    }, 700);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible && scale.value === 0) {return null;}

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          alignSelf: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        },
        containerStyle,
      ]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 8,
        }}>
        <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 12l6 6L20 6"
            stroke="#fff"
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Animated.View>
  );
};

export default SuccessCheck;
