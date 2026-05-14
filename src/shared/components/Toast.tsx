import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { create } from 'zustand';
import { theme } from '../theme';
import AppIcon from './AppIcon';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  show: (message: string, type?: ToastType, duration?: number) => void;
  hide: (id: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (message, type = 'info', duration = 3000) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    set(s => ({ toasts: [...s.toasts.slice(-2), { id, message, type, duration }] }));
  },
  hide: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

// ─── API ──────────────────────────────────────────────────────────────────────

export const toast = {
  success: (msg: string, duration?: number) => useToastStore.getState().show(msg, 'success', duration),
  error: (msg: string, duration?: number) => useToastStore.getState().show(msg, 'error', duration),
  info: (msg: string, duration?: number) => useToastStore.getState().show(msg, 'info', duration),
  warning: (msg: string, duration?: number) => useToastStore.getState().show(msg, 'warning', duration),
};

// ─── Config ───────────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
  success: { bg: '#e8f9ed', border: theme.colors.income, icon: 'check-circle', iconColor: theme.colors.income },
  error:   { bg: '#fdf0ee', border: theme.colors.expense, icon: 'x-circle', iconColor: theme.colors.expense },
  info:    { bg: '#eaf5dc', border: theme.colors.primary, icon: 'info', iconColor: theme.colors.primaryDeep },
  warning: { bg: '#fff8e8', border: theme.colors.warning, icon: 'warning', iconColor: '#c97b0a' },
};

// ─── Single Toast Item ────────────────────────────────────────────────────────

const ToastItem: React.FC<{ item: ToastItem }> = ({ item }) => {
  const hide = useToastStore(s => s.hide);
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = TOAST_CONFIG[item.type];

  useEffect(() => {
    // slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 180,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // auto dismiss
    const timer = setTimeout(() => dismiss(), item.duration ?? 3000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 80, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => hide(item.id));
  };

  return (
    <Animated.View
      style={[
        s.toast,
        { backgroundColor: config.bg, borderColor: config.border },
        { transform: [{ translateY }], opacity },
      ]}>
      <AppIcon name={config.icon as any} size={20} color={config.iconColor} />
      <Text style={s.msg} numberOfLines={3}>{item.message}</Text>
    </Animated.View>
  );
};

// ─── Toast Container ──────────────────────────────────────────────────────────

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore(s => s.toasts);
  if (toasts.length === 0) { return null; }
  return (
    <View style={s.container} pointerEvents="none">
      {toasts.map(item => <ToastItem key={item.id} item={item} />)}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  msg: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
