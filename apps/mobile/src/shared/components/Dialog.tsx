import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { create } from 'zustand';
import { useAppStore } from '../../app/store';
import { useThemeColors } from '../theme';
import AppIcon from './AppIcon';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DialogVariant = 'default' | 'danger' | 'success' | 'warning';

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
}

interface DialogConfig {
  title: string;
  message: string;
  buttons?: DialogButton[];
  variant?: DialogVariant;
}

interface DialogStore {
  visible: boolean;
  config: DialogConfig | null;
  open: (config: DialogConfig) => void;
  close: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useDialogStore = create<DialogStore>((set) => ({
  visible: false,
  config: null,
  open: (config) => set({ visible: true, config }),
  close: () => set({ visible: false }),
}));

// ─── API ──────────────────────────────────────────────────────────────────────

export const dialog = {
  /** Simple info/success/error alert (1 button OK) */
  alert: (title: string, message: string, variant: DialogVariant = 'default') => {
    useDialogStore.getState().open({
      title,
      message,
      variant,
      buttons: [{ text: 'Đóng', style: 'cancel' }],
    });
  },

  /** Confirm dialog with cancel + confirm */
  confirm: (
    title: string,
    message: string,
    options?: {
      confirmText?: string;
      cancelText?: string;
      variant?: DialogVariant;
      onConfirm?: () => void | Promise<void>;
      onCancel?: () => void;
    }
  ) => {
    useDialogStore.getState().open({
      title,
      message,
      variant: options?.variant ?? 'default',
      buttons: [
        {
          text: options?.cancelText ?? 'Hủy',
          style: 'cancel',
          onPress: options?.onCancel,
        },
        {
          text: options?.confirmText ?? 'Xác nhận',
          style: options?.variant === 'danger' ? 'destructive' : 'default',
          onPress: options?.onConfirm,
        },
      ],
    });
  },
};

// ─── Dialog Component ─────────────────────────────────────────────────────────

export const DialogContainer: React.FC = () => {
  const t = useThemeColors();
  const mode = useAppStore(s => s.themeMode);
  const C = useMemo(() => ({
    bg: t.surface,
    border: t.border,
    text: t.textPrimary,
    textSecondary: t.textSecondary,
    primaryDeep: t.primaryDeep,
    primarySoft: t.primarySoft,
    income: t.income,
    expense: t.expense,
    warning: t.warning,
    overlay: 'rgba(0, 0, 0, 0.55)',
    iconDangerBg: mode === 'light' ? '#fde8e3' : '#3a1f1a',
    iconSuccessBg: mode === 'light' ? '#e2f9ea' : '#163524',
    iconWarningBg: mode === 'light' ? '#fff3d6' : '#3e3018',
    warningIcon: mode === 'light' ? '#c97b0a' : '#f7c66b',
  }), [mode, t]);
  const s = useMemo(() => createStyles(C), [C]);

  const { visible, config, close } = useDialogStore();
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 280,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0.85);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  if (!config) { return null; }

  const variant = config.variant ?? 'default';
  const variantConfig: Record<DialogVariant, { icon: string; iconColor: string; iconBg: string }> = {
    default: { icon: 'info', iconColor: C.primaryDeep, iconBg: C.primarySoft },
    danger: { icon: 'trash', iconColor: C.expense, iconBg: C.iconDangerBg },
    success: { icon: 'check-circle', iconColor: C.income, iconBg: C.iconSuccessBg },
    warning: { icon: 'warning', iconColor: C.warningIcon, iconBg: C.iconWarningBg },
  };
  const buttonColors: Record<NonNullable<DialogButton['style']>, string> = {
    default: C.primaryDeep,
    cancel: C.textSecondary,
    destructive: C.expense,
  };
  const varConf = variantConfig[variant];
  const buttons = config.buttons ?? [{ text: 'Đóng', style: 'cancel' as const }];

  const handleButton = async (btn: DialogButton) => {
    close();
    // Small delay so modal closes before onPress side-effects (e.g. another dialog)
    setTimeout(() => {
      btn.onPress?.();
    }, 200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}>
      <View style={{ flex: 1 }}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: C.overlay }]}
          onPress={close}
        />

        <View style={s.centeredView} pointerEvents="box-none">
          <Animated.View style={[s.card, { transform: [{ scale }], opacity }]}>
            {/* Icon header */}
            <View style={[s.iconWrap, { backgroundColor: varConf.iconBg }]}>
              <AppIcon name={varConf.icon as any} size={26} color={varConf.iconColor} />
            </View>

            {/* Title */}
            <Text style={s.title}>{config.title}</Text>

            {/* Message */}
            <Text style={s.message}>{config.message}</Text>

            {/* Divider */}
            <View style={s.divider} />

            {/* Buttons */}
            <View style={[s.btnRow, buttons.length === 1 && s.btnRowSingle]}>
              {buttons.map((btn, idx) => {
                const isLast = idx === buttons.length - 1;
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      s.btn,
                      buttons.length > 1 && !isLast && s.btnBorderRight,
                      isDestructive && s.btnDestructive,
                      !isDestructive && isLast && s.btnPrimary,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleButton(btn)}>
                    <Text
                      style={[
                        s.btnText,
                        isDestructive && { color: buttonColors.destructive },
                        isCancel && !isDestructive && { color: buttonColors.cancel },
                        !isDestructive && isLast && { color: buttonColors.default, fontWeight: '700' },
                      ]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (C: {
  bg: string;
  border: string;
  text: string;
  textSecondary: string;
  primaryDeep: string;
  primarySoft: string;
  income: string;
  expense: string;
  warning: string;
  overlay: string;
  iconDangerBg: string;
  iconSuccessBg: string;
  iconWarningBg: string;
  warningIcon: string;
}) => StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    backgroundColor: C.bg,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    paddingTop: 28,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: C.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  message: {
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
  },
  btnRow: {
    flexDirection: 'row',
    height: 54,
  },
  btnRowSingle: {},
  btn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnBorderRight: {
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  btnPrimary: {},
  btnDestructive: {},
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
});
