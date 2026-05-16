import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { create } from 'zustand';
import { useAppStore } from '../../app/store';
import { useThemeColors } from '../theme';
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
  show: (message, type = 'info', duration = 6000) => {
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

// ─── Single Toast Item ────────────────────────────────────────────────────────

const ToastItem: React.FC<{ item: ToastItem }> = ({ item }) => {
  const t = useThemeColors();
  const mode = useAppStore(s => s.themeMode);
  const C = useMemo(() => ({
    text: t.textPrimary,
    successBg: mode === 'light' ? '#e8f9ed' : '#183626',
    errorBg: mode === 'light' ? '#fdf0ee' : '#3b1e1a',
    infoBg: mode === 'light' ? '#eaf5dc' : '#1d3525',
    warningBg: mode === 'light' ? '#fff8e8' : '#3a2f1a',
    success: t.income,
    expense: t.expense,
    primary: t.primary,
    primaryDeep: t.primaryDeep,
    warning: t.warning,
    warningIcon: mode === 'light' ? '#c97b0a' : '#f7c66b',
  }), [mode, t]);
  const styles = useMemo(() => createStyles(C), [C]);

  const hide = useToastStore(s => s.hide);
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const toastConfig: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
    success: { bg: C.successBg, border: C.success, icon: 'check-circle', iconColor: C.success },
    error: { bg: C.errorBg, border: C.expense, icon: 'x-circle', iconColor: C.expense },
    info: { bg: C.infoBg, border: C.primary, icon: 'info', iconColor: C.primaryDeep },
    warning: { bg: C.warningBg, border: C.warning, icon: 'warning', iconColor: C.warningIcon },
  };
  const config = toastConfig[item.type];

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
    const timer = setTimeout(() => dismiss(), item.duration ?? 6000);
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
        styles.toast,
        { backgroundColor: config.bg, borderColor: config.border },
        { transform: [{ translateY }], opacity },
      ]}>
      <AppIcon name={config.icon as any} size={20} color={config.iconColor} />
      <Text style={styles.msg} numberOfLines={3}>{item.message}</Text>
      <TouchableOpacity
        onPress={dismiss}
        hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
        style={styles.closeBtn}>
        <AppIcon name="close" size={16} color={C.text} />
        <Text style={styles.closeTxt}>Đóng</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Toast Container ──────────────────────────────────────────────────────────

export const ToastContainer: React.FC = () => {
  const t = useThemeColors();
  const mode = useAppStore(s => s.themeMode);
  const C = useMemo(() => ({
    text: t.textPrimary,
    successBg: mode === 'light' ? '#e8f9ed' : '#183626',
    errorBg: mode === 'light' ? '#fdf0ee' : '#3b1e1a',
    infoBg: mode === 'light' ? '#eaf5dc' : '#1d3525',
    warningBg: mode === 'light' ? '#fff8e8' : '#3a2f1a',
    success: t.income,
    expense: t.expense,
    primary: t.primary,
    primaryDeep: t.primaryDeep,
    warning: t.warning,
    warningIcon: mode === 'light' ? '#c97b0a' : '#f7c66b',
  }), [mode, t]);
  const styles = useMemo(() => createStyles(C), [C]);

  const toasts = useToastStore(s => s.toasts);
  if (toasts.length === 0) { return null; }
  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map(item => <ToastItem key={item.id} item={item} />)}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (C: {
  text: string;
  successBg: string;
  errorBg: string;
  infoBg: string;
  warningBg: string;
  success: string;
  expense: string;
  primary: string;
  primaryDeep: string;
  warning: string;
  warningIcon: string;
}) => StyleSheet.create({
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
    color: C.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  closeBtn: {
    minWidth: 52,
    height: 28,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
  },
  closeTxt: {
    color: C.text,
    fontSize: 11,
    fontWeight: '700',
  },
});
