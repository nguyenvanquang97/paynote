import React, {useMemo, useRef} from 'react';
import {
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useThemeColors} from '../../../shared/theme';

const BUTTON_SIZE = 72;
const EDGE_MARGIN = 24;
const TAB_BAR_SPACE = 90;
const BOTTOM_RIGHT_BLOCK_WIDTH = 132;
const BOTTOM_RIGHT_BLOCK_HEIGHT = 132;

type AIChatFloatingButtonProps = {
  onPress: () => void;
};

export default function AIChatFloatingButton({onPress}: AIChatFloatingButtonProps) {
  const t = useThemeColors();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();

  const colors = useMemo(() => ({
    shadow: t.shadow,
  }), [t]);

  const isInsideBottomRightBlockedZone = (x: number, y: number) => {
    const blockedLeft = width - BOTTOM_RIGHT_BLOCK_WIDTH - EDGE_MARGIN;
    const blockedTop = height - BOTTOM_RIGHT_BLOCK_HEIGHT - insets.bottom - TAB_BAR_SPACE;
    const blockedRight = width - EDGE_MARGIN;
    const blockedBottom = height - insets.bottom - TAB_BAR_SPACE + 8;

    const centerX = x + BUTTON_SIZE / 2;
    const centerY = y + BUTTON_SIZE / 2;
    return (
      centerX >= blockedLeft &&
      centerX <= blockedRight &&
      centerY >= blockedTop &&
      centerY <= blockedBottom
    );
  };

  const clamp = (x: number, y: number) => {
    const minX = EDGE_MARGIN;
    const maxX = Math.max(EDGE_MARGIN, width - BUTTON_SIZE - EDGE_MARGIN);
    const minY = Math.max(insets.top + 10, EDGE_MARGIN + 44);
    const maxY = Math.max(minY, height - BUTTON_SIZE - TAB_BAR_SPACE - insets.bottom - EDGE_MARGIN);
    const clamped = {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };

    if (!isInsideBottomRightBlockedZone(clamped.x, clamped.y)) {
      return clamped;
    }

    return {
      x: Math.max(minX, width - BUTTON_SIZE - BOTTOM_RIGHT_BLOCK_WIDTH - 24),
      y: clamped.y,
    };
  };

  const initial = clamp(EDGE_MARGIN, height);
  const position = useRef(new Animated.ValueXY(initial)).current;
  const isDraggingRef = useRef(false);
  const dragDistanceRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
      onPanResponderGrant: () => {
        isDraggingRef.current = false;
        dragDistanceRef.current = 0;
        position.stopAnimation((value: {x: number; y: number}) => {
          position.setOffset(value);
          position.setValue({x: 0, y: 0});
        });
      },
      onPanResponderMove: (_, gestureState) => {
        dragDistanceRef.current = Math.max(Math.abs(gestureState.dx), Math.abs(gestureState.dy));
        if (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3) {
          isDraggingRef.current = true;
        }
        position.setValue({x: gestureState.dx, y: gestureState.dy});
      },
      onPanResponderRelease: () => {
        position.flattenOffset();
        position.stopAnimation((value: {x: number; y: number}) => {
          const next = clamp(value.x, value.y);
          Animated.spring(position, {
            toValue: next,
            useNativeDriver: false,
            damping: 16,
            stiffness: 180,
            mass: 0.6,
          }).start();
        });

        if (!isDraggingRef.current || dragDistanceRef.current < 4) {
          onPress();
        }
      },
      onPanResponderTerminate: () => {
        position.flattenOffset();
      },
    }),
  ).current;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.button,
          {
            shadowColor: colors.shadow,
          },
          position.getLayout(),
        ]}
        {...panResponder.panHandlers}>
        <Image
          source={require('../../../assets/images/aquang-chat-button-cropped.png')}
          style={styles.buttonImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: {width: 0, height: 0},
  },
  buttonImage: {
    width: '100%',
    height: '100%',
  },
});
