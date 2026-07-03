import React, { useEffect, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useThemeColors } from '../theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { SpringConfig } from '../../animations/constants';

const TAB_ICON_SIZE = 22;

// SVG icon components
const DashboardIcon = ({ color }: { color: string }) => (
  <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  </Svg>
);

const TransactionsIcon = ({ color }: { color: string }) => (
  <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Rect x="9" y="3" width="6" height="4" rx="1" stroke={color} strokeWidth="2" />
    <Line x1="9" y1="12" x2="15" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="9" y1="16" x2="13" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ChartsIcon = ({ color }: { color: string }) => (
  <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="12" width="4" height="9" rx="1" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <Rect x="10" y="7" width="4" height="14" rx="1" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <Rect x="17" y="3" width="4" height="18" rx="1" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  </Svg>
);

const CategoriesIcon = ({ color }: { color: string }) => (
  <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7h18M3 12h12M3 17h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="19" cy="17" r="2.5" stroke={color} strokeWidth="2" />
    <Path d="M21 17.5V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const SettingsIcon = ({ color }: { color: string }) => (
  <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19.14 12.94a7.8 7.8 0 000-1.88l2-1.55a.55.55 0 00.13-.7l-1.9-3.29a.55.55 0 00-.66-.24l-2.35.95a7.08 7.08 0 00-1.62-.94l-.35-2.5a.55.55 0 00-.54-.45h-3.8a.55.55 0 00-.54.45l-.35 2.5c-.57.22-1.12.54-1.62.94l-2.35-.95a.55.55 0 00-.66.24L2.73 8.8a.55.55 0 00.13.7l2 1.55a7.8 7.8 0 000 1.88l-2 1.55a.55.55 0 00-.13.7l1.9 3.29a.55.55 0 00.66.24l2.35-.95c.5.4 1.05.72 1.62.94l.35 2.5a.55.55 0 00.54.45h3.8a.55.55 0 00.54-.45l.35-2.5c.57-.22 1.12-.54 1.62-.94l2.35.95a.55.55 0 00.66-.24l1.9-3.29a.55.55 0 00-.13-.7l-2-1.55z"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="12" r="2.7" stroke={color} strokeWidth="1.7" />
  </Svg>
);

const AIChatIcon = ({ color }: { color: string }) => (
  <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="4" width="16" height="12" rx="3" stroke={color} strokeWidth="2" />
    <Path d="M10 16v2.5h4V16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="9" cy="10" r="1" fill={color} />
    <Circle cx="15" cy="10" r="1" fill={color} />
  </Svg>
);

const ROUTE_ICONS: Record<string, (color: string) => React.ReactNode> = {
  Dashboard: (c) => <DashboardIcon color={c} />,
  Transactions: (c) => <TransactionsIcon color={c} />,
  Charts: (c) => <ChartsIcon color={c} />,
  Categories: (c) => <CategoriesIcon color={c} />,
  AIChat: (c) => <AIChatIcon color={c} />,
  Settings: (c) => <SettingsIcon color={c} />,
};

const ROUTE_LABELS: Record<string, string> = {
  Dashboard: 'Tổng quan',
  Transactions: 'Giao dịch',
  Charts: 'Biểu đồ',
  Categories: 'Danh mục',
  AIChat: 'AI',
  Settings: 'Cài đặt',
};

const TAB_BAR_HEIGHT = 70;
const BUBBLE_PADDING_H = 14;
const BUBBLE_PADDING_V = 8;

// Single tab item — each tab manages its own Reanimated shared values
function TabItem({
  route,
  isActive,
  tabWidth,
  C,
  options,
  onPress,
}: {
  route: any;
  isActive: boolean;
  tabWidth: number;
  C: { active: string; inactive: string; text: string; textInactive: string };
  options: any;
  onPress: () => void;
}) {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isActive ? 1 : 0, SpringConfig.soft);
  }, [isActive, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -4], Extrapolation.CLAMP) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.16], Extrapolation.CLAMP) },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.8, 1], Extrapolation.CLAMP),
  }));

  const color = isActive ? C.active : C.inactive;
  const labelColor = isActive ? C.text : C.textInactive;

  return (
    <TouchableOpacity
      key={route.key}
      onPress={onPress}
      activeOpacity={0.7}
      style={[tabItemStyle.tab, { width: tabWidth }]}
      accessibilityRole="button"
      accessibilityState={isActive ? { selected: true } : {}}>
      <View style={tabItemStyle.tabContent}>
        <Animated.View style={iconStyle}>
          {ROUTE_ICONS[route.name]?.(color)}
        </Animated.View>
        <Animated.Text
          style={[tabItemStyle.label, { color: labelColor }, labelStyle]}
          numberOfLines={2}
          ellipsizeMode="clip">
          {options.tabBarLabel?.toString() || ROUTE_LABELS[route.name] || route.name}
        </Animated.Text>
      </View>
    </TouchableOpacity>
  );
}

const tabItemStyle = StyleSheet.create({
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: BUBBLE_PADDING_V,
    paddingHorizontal: BUBBLE_PADDING_H,
    zIndex: 1,
  },
  tabContent: {
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  label: {
    width: '100%',
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0,
  },
});

export default function BubbleTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const t = useThemeColors();
  const C = useMemo(() => ({
    bg: t.surface,
    border: t.border,
    active: t.primaryDeep,
    inactive: t.neutral,
    bubble: t.primarySoft,
    text: t.textPrimary,
    textInactive: t.textSecondary,
    shadow: t.shadow,
  }), [t]);
  const styles = useMemo(() => createStyles(C), [C]);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 4);

  const tabCount = state.routes.length;
  const tabWidth = width / tabCount;

  // Reanimated: bubble slides to active tab
  const bubbleX = useSharedValue(state.index * tabWidth);

  useEffect(() => {
    bubbleX.value = withSpring(state.index * tabWidth, {
      damping: 20,
      stiffness: 200,
    });
  }, [state.index, tabWidth, bubbleX]);

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bubbleX.value + 8 }],
  }));

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      {/* Animated bubble background — Reanimated, UI thread */}
      <Animated.View
        style={[
          styles.bubble,
          { width: tabWidth - 16 },
          bubbleStyle,
        ]}
      />

      {/* Tabs */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isActive = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isActive && !event.defaultPrevented) {
            navigation.jumpTo(route.name);
          }
        };

        return (
          <TabItem
            key={route.key}
            route={route}
            isActive={isActive}
            tabWidth={tabWidth}
            C={C}
            options={options}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

const createStyles = (C: {
  bg: string;
  border: string;
  active: string;
  inactive: string;
  bubble: string;
  text: string;
  textInactive: string;
  shadow: string;
}) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderTopWidth: 0,
    height: TAB_BAR_HEIGHT + 20,
    alignItems: 'center',
    paddingTop: 8,
    position: 'relative',
    elevation: 12,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  bubble: {
    position: 'absolute',
    top: 6,
    height: TAB_BAR_HEIGHT - 12,
    backgroundColor: C.bubble,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
});
