import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type Props = {
  title: string;
  value: number;
  subtitle?: string;
  colorText: string;
  colorSub: string;
  colorBorder: string;
  colorBg: string;
  colorAccent: string;
};

const formatVnd = (value: number) => `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}đ`;

export default function AISummaryCard({
  title,
  value,
  subtitle,
  colorText,
  colorSub,
  colorBorder,
  colorBg,
  colorAccent,
}: Props) {
  return (
    <View style={[styles.card, {borderColor: colorBorder, backgroundColor: colorBg}]}> 
      <Text style={[styles.title, {color: colorSub}]}>{title}</Text>
      <Text style={[styles.value, {color: colorAccent}]}>{formatVnd(value)}</Text>
      {subtitle ? <Text style={[styles.subtitle, {color: colorText}]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
  },
  value: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
  },
});
