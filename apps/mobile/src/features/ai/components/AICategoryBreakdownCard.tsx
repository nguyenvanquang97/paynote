import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type Item = {
  label: string;
  amount: number;
  percentage: number;
};

type Props = {
  items: Item[];
  colorText: string;
  colorSub: string;
  colorBorder: string;
  colorBg: string;
};

const formatVnd = (value: number) => `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}đ`;

export default function AICategoryBreakdownCard({items, colorText, colorSub, colorBorder, colorBg}: Props) {
  return (
    <View style={[styles.card, {borderColor: colorBorder, backgroundColor: colorBg}]}> 
      <Text style={[styles.title, {color: colorSub}]}>Chi tiêu theo danh mục</Text>
      {items.map(item => (
        <View key={item.label} style={styles.row}>
          <Text style={[styles.label, {color: colorText}]} numberOfLines={1}>{item.label}</Text>
          <Text style={[styles.value, {color: colorText}]}>{formatVnd(item.amount)} · {item.percentage}%</Text>
        </View>
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
    gap: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
  },
});
