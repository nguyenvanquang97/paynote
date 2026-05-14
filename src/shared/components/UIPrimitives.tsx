import React from 'react';
import {View, Text, StyleSheet, type ViewProps, type TextProps} from 'react-native';
import {theme} from '../theme';

export const ScreenContainer: React.FC<ViewProps> = ({style, ...props}) => (
  <View
    style={[styles.screenContainer, style]}
    {...props}
  />
);

export const SectionCard: React.FC<ViewProps> = ({style, ...props}) => (
  <View
    style={[styles.sectionCard, style]}
    {...props}
  />
);

export const PillBadge: React.FC<ViewProps> = ({style, ...props}) => (
  <View
    style={[styles.pillBadge, style]}
    {...props}
  />
);

export const StatusChip: React.FC<ViewProps> = ({style, ...props}) => (
  <View
    style={[styles.statusChip, style]}
    {...props}
  />
);

export const MetricTile: React.FC<ViewProps> = ({style, ...props}) => (
  <View
    style={[styles.metricTile, style]}
    {...props}
  />
);

export const SectionTitle: React.FC<TextProps> = ({style, ...props}) => (
  <Text
    style={[styles.sectionTitle, style]}
    {...props}
  />
);

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  pillBadge: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.xs,
    backgroundColor: theme.colors.surfaceMuted,
  },
  statusChip: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.space.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  metricTile: {
    borderRadius: theme.radius.md,
    padding: theme.space.md,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.text.h3,
    fontWeight: '700',
  },
});

