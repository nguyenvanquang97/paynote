import React, {useRef, useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import {Swipeable} from 'react-native-gesture-handler';
import {useThemeColors} from '../theme';
import AppIcon from './AppIcon';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  deleteLabel?: string;
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onDelete,
  deleteLabel = 'Xóa',
}) => {
  const colors = useThemeColors();
  const swipeableRef = useRef<Swipeable>(null);

  // Dynamic styles theo theme
  const dynStyles = useMemo(
    () =>
      StyleSheet.create({
        deleteButton: {backgroundColor: colors.expense},
        actionText: {color: colors.textOnDark, fontSize: 14, fontWeight: '700'},
      }),
    [colors],
  );

  const close = () => swipeableRef.current?.close();

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _drag: Animated.AnimatedInterpolation<number>,
  ) => {
    if (!onDelete) {return <View />;}

    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });

    return (
      <View style={staticStyles.actionsContainer}>
        <Animated.View key="delete" style={{transform: [{translateX: trans}]}}>
          <TouchableOpacity
            style={[staticStyles.actionButton, dynStyles.deleteButton]}
            onPress={() => {
              close();
              onDelete();
            }}>
            <AppIcon name="trash" size={20} color={colors.textOnDark} />
            <Text style={dynStyles.actionText}>{deleteLabel}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      renderRightActions={renderRightActions}
      overshootRight={false}>
      {children}
    </Swipeable>
  );
};

// Styles không phụ thuộc màu — tạo 1 lần ở module level
const staticStyles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    height: '100%',
    width: 82,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    marginLeft: 6,
    gap: 6,
    paddingVertical: 8,
  },
});

export default SwipeableRow;
