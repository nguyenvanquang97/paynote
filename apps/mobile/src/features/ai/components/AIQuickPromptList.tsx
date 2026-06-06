import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';

type PromptChip = {
  label: string;
  prompt: string;
};

type Props = {
  prompts: readonly PromptChip[];
  onPressPrompt: (prompt: string) => void;
  expanded?: boolean;
  onPressLauncher?: () => void;
  disabled?: boolean;
  colorBorder: string;
  colorBg: string;
  colorText: string;
  fabColor?: string;
  fabIconColor?: string;
  fabShadowColor?: string;
  maxVisibleChips?: number;
  showExpand?: boolean;
};

const FAB_SIZE = 60;
const CONTAINER_HEIGHT = 196;
const CONTAINER_PADDING = 10;

export default function AIQuickPromptList({
  expanded = false,
  onPressLauncher,
  disabled,
  colorBg,
  colorText,
  fabColor,
  fabIconColor,
  fabShadowColor,
}: Props) {
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: expanded ? 1 : 0,
      friction: 8,
      tension: 110,
      useNativeDriver: true,
    }).start();
  }, [expandAnim, expanded]);

  return (
    <View style={styles.container}>
      <View style={styles.fabWrap}>
        <Pressable
          style={[
            styles.fab,
            {
              backgroundColor: fabColor || colorBg,
              shadowColor: fabShadowColor || '#000',
            },
            disabled && styles.fabDisabled,
            expanded && styles.fabActive,
          ]}
          onPress={() => !disabled && onPressLauncher?.()}
          disabled={disabled}>
          <Animated.Text
            style={[
              styles.fabIcon,
              {
                color: fabIconColor || colorText,
                transform: [{
                  rotate: expandAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                  }),
                }],
              },
            ]}>
            +
          </Animated.Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: FAB_SIZE + CONTAINER_PADDING * 2,
    height: CONTAINER_HEIGHT,
    position: 'relative',
  },
  fabWrap: {
    position: 'absolute',
    right: CONTAINER_PADDING,
    top: (CONTAINER_HEIGHT - FAB_SIZE) / 2,
    zIndex: 40,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  fabActive: {
    opacity: 0.92,
  },
  fabDisabled: {
    opacity: 0.5,
  },
  fabIcon: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '500',
    marginTop: -2,
  },
});
