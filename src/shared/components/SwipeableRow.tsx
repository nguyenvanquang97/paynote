import React, {useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import {Swipeable} from 'react-native-gesture-handler';
import {theme} from '../theme';
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
  const swipeableRef = useRef<Swipeable>(null);

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
      <View style={styles.actionsContainer}>
        <Animated.View key="delete" style={{transform: [{translateX: trans}]}}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {
              close();
              onDelete();
            }}>
            <AppIcon name="trash" size={20} color={theme.colors.textOnDark} />
            <Text style={styles.actionText}>{deleteLabel}</Text>
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

const styles = StyleSheet.create({
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
  deleteButton: {
    backgroundColor: theme.colors.expense,
  },
  actionText: {
    color: theme.colors.textOnDark,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SwipeableRow;
