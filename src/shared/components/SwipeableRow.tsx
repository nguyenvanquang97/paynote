import React, {useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import {Swipeable} from 'react-native-gesture-handler';

interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onEdit,
  onDelete,
  editLabel = 'Sửa',
  deleteLabel = 'Xóa',
}) => {
  const swipeableRef = useRef<Swipeable>(null);

  const close = () => swipeableRef.current?.close();

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _drag: Animated.AnimatedInterpolation<number>,
  ) => {
    const actions: React.ReactNode[] = [];

    if (onEdit) {
      const trans = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [onDelete ? 160 : 80, 0],
      });
      actions.push(
        <Animated.View key="edit" style={{transform: [{translateX: trans}]}}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => {
              close();
              onEdit();
            }}>
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionText}>{editLabel}</Text>
          </TouchableOpacity>
        </Animated.View>,
      );
    }

    if (onDelete) {
      const trans = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [80, 0],
      });
      actions.push(
        <Animated.View key="delete" style={{transform: [{translateX: trans}]}}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {
              close();
              onDelete();
            }}>
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={styles.actionText}>{deleteLabel}</Text>
          </TouchableOpacity>
        </Animated.View>,
      );
    }

    return <View style={styles.actionsContainer}>{actions}</View>;
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
    width: 76,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    marginLeft: 6,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#1e3a5f',
  },
  deleteButton: {
    backgroundColor: '#3d1515',
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SwipeableRow;
