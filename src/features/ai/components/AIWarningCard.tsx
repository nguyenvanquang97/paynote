import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {AIActionButton} from '../types/aiChat.types';

type Props = {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  colorText: string;
  actions?: AIActionButton[];
  onPressAction?: (action: AIActionButton['action']) => void;
};

const severityPalette = {
  low: {bg: '#e7f7eb', border: '#b8e7c5', title: '#227a3a'},
  medium: {bg: '#fff3dd', border: '#f3d6a0', title: '#8a5a0e'},
  high: {bg: '#ffe5e5', border: '#f6b7b7', title: '#a12e2e'},
};

export default function AIWarningCard({
  title,
  description,
  severity,
  colorText,
  actions,
  onPressAction,
}: Props) {
  const tone = severityPalette[severity] || severityPalette.medium;
  return (
    <View style={[styles.card, {backgroundColor: tone.bg, borderColor: tone.border}]}> 
      <Text style={[styles.title, {color: tone.title}]}>{title}</Text>
      <Text style={[styles.desc, {color: colorText}]}>{description}</Text>
      {actions && actions.length > 0 ? (
        <View style={styles.actionsRow}>
          {actions.map((item, idx) => (
            <Pressable
              key={`${item.label}_${idx}`}
              onPress={() => onPressAction?.(item.action)}
              style={[
                styles.actionBtn,
                item.tone === 'primary' && styles.actionBtnPrimary,
                item.tone === 'danger' && styles.actionBtnDanger,
              ]}>
              <Text
                style={[
                  styles.actionTxt,
                  item.tone === 'primary' && styles.actionTxtPrimary,
                  item.tone === 'danger' && styles.actionTxtDanger,
                ]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
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
  actionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionBtnPrimary: {
    borderColor: '#0f79bb',
    backgroundColor: '#e0f3ff',
  },
  actionBtnDanger: {
    borderColor: '#d96b6b',
    backgroundColor: '#ffecec',
  },
  actionTxt: {
    color: '#2d2d2d',
    fontSize: 11,
    fontWeight: '700',
  },
  actionTxtPrimary: {
    color: '#0f79bb',
  },
  actionTxtDanger: {
    color: '#a12e2e',
  },
});
