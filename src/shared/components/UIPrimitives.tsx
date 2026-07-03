import React from 'react';
import {View, Text, StyleSheet, type ViewProps, type TextProps} from 'react-native';
import {theme, useThemeColors} from '../theme';

// ─── ScreenContainer ────────────────────────────────────────────────────────
export const ScreenContainer: React.FC<ViewProps> = ({style, ...props}) => {
  const colors = useThemeColors();
  return (
    <View
      style={[{flex: 1, backgroundColor: colors.appBg}, style]}
      {...props}
    />
  );
};

// ─── SectionCard ─────────────────────────────────────────────────────────────
export const SectionCard: React.FC<ViewProps> = ({style, ...props}) => {
  const colors = useThemeColors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: theme.space.lg,
          shadowColor: colors.shadow,
          shadowOffset: {width: 0, height: 6},
          shadowOpacity: 0.06,
          shadowRadius: 14,
          elevation: 2,
        },
        style,
      ]}
      {...props}
    />
  );
};

// ─── PillBadge ───────────────────────────────────────────────────────────────
export const PillBadge: React.FC<ViewProps> = ({style, ...props}) => {
  const colors = useThemeColors();
  return (
    <View
      style={[
        {
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.xs,
          backgroundColor: colors.surfaceMuted,
        },
        style,
      ]}
      {...props}
    />
  );
};

// ─── StatusChip ──────────────────────────────────────────────────────────────
export const StatusChip: React.FC<ViewProps> = ({style, ...props}) => {
  const colors = useThemeColors();
  return (
    <View
      style={[
        {
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.space.md,
          paddingVertical: 5,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        style,
      ]}
      {...props}
    />
  );
};

// ─── MetricTile ──────────────────────────────────────────────────────────────
export const MetricTile: React.FC<ViewProps> = ({style, ...props}) => {
  const colors = useThemeColors();
  return (
    <View
      style={[
        {
          borderRadius: theme.radius.md,
          padding: theme.space.md,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
      {...props}
    />
  );
};

// ─── SectionTitle ─────────────────────────────────────────────────────────────
export const SectionTitle: React.FC<TextProps> = ({style, ...props}) => {
  const colors = useThemeColors();
  return (
    <Text
      style={[
        {
          color: colors.textPrimary,
          fontSize: theme.text.h3,
          fontWeight: '700',
        },
        style,
      ]}
      {...props}
    />
  );
};

// Kept for backward-compat (không dùng theme.colors nữa)
export const _styles = StyleSheet.create({
  hidden: {display: 'none'},
});
