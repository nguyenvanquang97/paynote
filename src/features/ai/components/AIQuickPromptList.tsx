import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

type PromptChip = {
  label: string;
  prompt: string;
};

type Props = {
  prompts: readonly PromptChip[];
  onPressPrompt: (prompt: string) => void;
  disabled?: boolean;
  colorBorder: string;
  colorBg: string;
  colorText: string;
};

const DEFAULT_VISIBLE_CHIPS = 4;

export default function AIQuickPromptList({
  prompts,
  onPressPrompt,
  disabled,
  colorBorder,
  colorBg,
  colorText,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const visiblePrompts = useMemo(
    () => (expanded ? prompts : prompts.slice(0, DEFAULT_VISIBLE_CHIPS)),
    [expanded, prompts],
  );
  const canExpand = prompts.length > DEFAULT_VISIBLE_CHIPS;

  return (
    <View style={styles.content}>
      {visiblePrompts.map(item => (
        <TouchableOpacity
          key={item.prompt}
          style={[styles.chip, {borderColor: colorBorder, backgroundColor: colorBg}]}
          onPress={() => onPressPrompt(item.prompt)}
          disabled={disabled}>
          <Text style={[styles.text, {color: colorText}]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
      {canExpand && (
        <TouchableOpacity
          style={[styles.expandChip, {borderColor: colorBorder, backgroundColor: colorBg}]}
          onPress={() => setExpanded(prev => !prev)}
          disabled={disabled}>
          <Text style={[styles.expandTxt, {color: colorText}]}>
            {expanded ? 'Thu gọn' : 'Xem thêm'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  expandChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  expandTxt: {
    fontSize: 12,
    fontWeight: '800',
  },
});
