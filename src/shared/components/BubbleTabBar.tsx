import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Path, Rect, Circle, Line, Polyline} from 'react-native-svg';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';

const {width} = Dimensions.get('window');

const C = {
  bg: '#1a1a2e',
  border: '#2a2a4a',
  active: '#6c5ce7',
  inactive: '#5a5a7a',
  bubble: 'rgba(108, 92, 231, 0.15)',
  text: '#ffffff',
  textInactive: '#6a6a8a',
};

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

const TAB_BAR_HEIGHT = 64;
const BUBBLE_PADDING_H = 14;
const BUBBLE_PADDING_V = 8;

export default function BubbleTabBar({state, descriptors, navigation}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  // On devices without hardware nav bar, insets.bottom = 0
  // On gesture nav devices, insets.bottom > 0
  const bottomPadding = Math.max(insets.bottom, 4);

  const tabCount = state.routes.length;
  const tabWidth = width / tabCount;

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
            <Animated.View style={[styles.tabContent, isActive && styles.tabContentActive]}>
              {ROUTE_ICONS[route.name]?.(color)}
              <Text
                style={[styles.label, {color: labelColor}]}
                numberOfLines={1}>
                {options.tabBarLabel?.toString() || ROUTE_LABELS[route.name] || route.name}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    height: TAB_BAR_HEIGHT + 20, // base height + padding
    alignItems: 'center',
    paddingTop: 8,
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bubble: {
    position: 'absolute',
    top: 6,
    height: TAB_BAR_HEIGHT - 12,
    backgroundColor: C.bubble,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.3)',
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
  },
  tabContentActive: {
    transform: [{scale: 1.05}],
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
