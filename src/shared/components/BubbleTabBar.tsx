import React, {useRef, useEffect, useMemo} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Path, Rect, Circle, Line, Polyline} from 'react-native-svg';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useThemeColors} from '../theme';

const TAB_ICON_SIZE = 22;

// SVG icon components
const DashboardIcon = ({color}: {color: string}) => (
  <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  </Svg>
);

const TransactionsIcon = ({color}: {color: string}) => (
  <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Rect x="9" y="3" width="6" height="4" rx="1" stroke={color} strokeWidth="2" />
    <Line x1="9" y1="12" x2="15" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="9" y1="16" x2="13" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ChartsIcon = ({color}: {color: string}) => (
  <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="12" width="4" height="9" rx="1" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <Rect x="10" y="7" width="4" height="14" rx="1" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <Rect x="17" y="3" width="4" height="18" rx="1" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  </Svg>
);

const CategoriesIcon = ({color}: {color: string}) => (
  <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7h18M3 12h12M3 17h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="19" cy="17" r="2.5" stroke={color} strokeWidth="2" />
    <Path d="M21 17.5V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const SettingsIcon = ({color}: {color: string}) => (
  <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    <Path
      d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const ROUTE_ICONS: Record<string, (color: string) => React.ReactNode> = {
  Dashboard: (c) => <DashboardIcon color={c} />,
  Transactions: (c) => <TransactionsIcon color={c} />,
  Charts: (c) => <ChartsIcon color={c} />,
  Categories: (c) => <CategoriesIcon color={c} />,
  Settings: (c) => <SettingsIcon color={c} />,
};

const ROUTE_LABELS: Record<string, string> = {
  Dashboard: 'Tổng quan',
  Transactions: 'Giao dịch',
  Charts: 'Biểu đồ',
  Categories: 'Danh mục',
  Settings: 'Cài đặt',
};

const TAB_BAR_HEIGHT = 70;
const BUBBLE_PADDING_H = 14;
const BUBBLE_PADDING_V = 8;

export default function BubbleTabBar({state, descriptors, navigation}: BottomTabBarProps) {
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
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // On devices without hardware nav bar, insets.bottom = 0
  // On gesture nav devices, insets.bottom > 0
  const bottomPadding = Math.max(insets.bottom, 4);

  const tabCount = state.routes.length;
  const tabWidth = width / tabCount;
  const tabAnims = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(
      state.routes.map((route, idx) => [route.key, new Animated.Value(state.index === idx ? 1 : 0)]),
    ),
  ).current;

  // Animated value for bubble horizontal position
  const bubbleAnim = useRef(new Animated.Value(state.index * tabWidth)).current;

  useEffect(() => {
    Animated.spring(bubbleAnim, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [state.index, tabWidth, bubbleAnim]);

  useEffect(() => {
    const animations = state.routes.map((route, idx) =>
      Animated.spring(tabAnims[route.key], {
        toValue: state.index === idx ? 1 : 0,
        useNativeDriver: true,
        damping: 14,
        stiffness: 180,
      }),
    );
    Animated.parallel(animations).start();
  }, [state.index, state.routes, tabAnims]);

  return (
    <View
      style={[
        styles.container,
        {paddingBottom: bottomPadding},
      ]}>
      {/* Animated bubble background */}
      <Animated.View
        style={[
          styles.bubble,
          {
            width: tabWidth - 16,
            transform: [{
              translateX: Animated.add(bubbleAnim, new Animated.Value(8)),
            }],
          },
        ]}
      />

      {/* Tabs */}
      {state.routes.map((route, index) => {
        const {options} = descriptors[route.key];
        const isActive = state.index === index;
        const color = isActive ? C.active : C.inactive;
        const labelColor = isActive ? C.text : C.textInactive;
        const anim = tabAnims[route.key];
        const iconTranslateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        });
        const iconScale = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.16],
        });
        const labelOpacity = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        });

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={[styles.tab, {width: tabWidth}]}
            accessibilityRole="button"
            accessibilityState={isActive ? {selected: true} : {}}>
            <Animated.View style={styles.tabContent}>
              <Animated.View
                style={{
                  transform: [{translateY: iconTranslateY}, {scale: iconScale}],
                }}>
                {ROUTE_ICONS[route.name]?.(color)}
              </Animated.View>
              <Animated.Text
                style={[styles.label, {color: labelColor, opacity: labelOpacity}]}
                numberOfLines={2}
                ellipsizeMode="clip">
                {options.tabBarLabel?.toString() || ROUTE_LABELS[route.name] || route.name}
              </Animated.Text>
            </Animated.View>
          </TouchableOpacity>
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
    height: TAB_BAR_HEIGHT + 20, // base height + padding
    alignItems: 'center',
    paddingTop: 8,
    position: 'relative',
    elevation: 12,
    shadowColor: C.shadow,
    shadowOffset: {width: 0, height: -2},
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
