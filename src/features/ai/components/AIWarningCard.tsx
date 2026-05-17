import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type Props = {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  colorText: string;
};

const severityPalette = {
  low: {bg: '#e7f7eb', border: '#b8e7c5', title: '#227a3a'},
  medium: {bg: '#fff3dd', border: '#f3d6a0', title: '#8a5a0e'},
  high: {bg: '#ffe5e5', border: '#f6b7b7', title: '#a12e2e'},
};

export default function AIWarningCard({title, description, severity, colorText}: Props) {
  const tone = severityPalette[severity] || severityPalette.medium;
  return (
    <View style={[styles.card, {backgroundColor: tone.bg, borderColor: tone.border}]}> 
      <Text style={[styles.title, {color: tone.title}]}>{title}</Text>
      <Text style={[styles.desc, {color: colorText}]}>{description}</Text>
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
    fontSize: 12,
    fontWeight: '800',
  },
  desc: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },
});
