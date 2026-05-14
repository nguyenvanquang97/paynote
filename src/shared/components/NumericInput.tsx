import React from 'react';
import {TextInput, type TextInputProps} from 'react-native';

interface NumericInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (digits: string) => void;
}

const toDigits = (raw: string): string => raw.replace(/[^\d]/g, '');

const formatWithComma = (digits: string): string => {
  if (!digits) {return '';}
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export default function NumericInput({value, onChangeText, ...props}: NumericInputProps) {
  const digits = toDigits(value);
  return (
    <TextInput
      {...props}
      keyboardType="number-pad"
      value={formatWithComma(digits)}
      onChangeText={text => onChangeText(toDigits(text))}
    />
  );
}

