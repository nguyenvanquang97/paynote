import React from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity} from 'react-native';

type Props = {
  prompts: readonly string[];
  onPressPrompt: (prompt: string) => void;
  disabled?: boolean;
  colorBorder: string;
  colorBg: string;
  colorText: string;
};

export default function AIQuickPromptList({
  prompts,
  onPressPrompt,
  disabled,
  colorBorder,
  colorBg,
  colorText,
}: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {prompts.map(prompt => (
        <TouchableOpacity
          key={prompt}
          style={[styles.chip, {borderColor: colorBorder, backgroundColor: colorBg}]}
          onPress={() => onPressPrompt(prompt)}
          disabled={disabled}>
          <Text style={[styles.text, {color: colorText}]}>{prompt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 24,
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
});
