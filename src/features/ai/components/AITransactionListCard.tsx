import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

type Item = {
  id: string;
  amount: number;
  title: string;
  date: string;
};

type Props = {
  items: Item[];
  onPressTransaction?: (id: string) => void;
  colorText: string;
  colorSub: string;
  colorBorder: string;
  colorBg: string;
};

const formatVnd = (value: number) => `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}đ`;

export default function AITransactionListCard({
  items,
  onPressTransaction,
  colorText,
  colorSub,
  colorBorder,
  colorBg,
}: Props) {
  return (
    <View style={[styles.card, {borderColor: colorBorder, backgroundColor: colorBg}]}> 
      <Text style={[styles.title, {color: colorSub}]}>Giao dịch đáng chú ý</Text>
      {items.map(item => (
        <Pressable
          key={item.id}
          style={styles.row}
          onPress={() => onPressTransaction?.(item.id)}>
          <View style={styles.left}>
            <Text style={[styles.itemTitle, {color: colorText}]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.itemDate, {color: colorSub}]}>{item.date}</Text>
          </View>
          <Text style={[styles.amount, {color: colorText}]}>{formatVnd(item.amount)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    gap: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  left: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemDate: {
    marginTop: 2,
    fontSize: 11,
  },
  amount: {
    fontSize: 12,
    fontWeight: '700',
  },
});
