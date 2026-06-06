import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useAuthStore} from './authStore';
import {useThemeColors} from '../../shared/theme';

const AuthScreen: React.FC = () => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const {sendEmailOtp, verifyEmailOtp, isSubmitting, error, info} = useAuthStore();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedToken = token.trim();

  const sendCode = () => {
    if (!normalizedEmail || isSubmitting) {
      return;
    }
    sendEmailOtp(normalizedEmail);
  };

  const verifyCode = () => {
    if (!normalizedEmail || !normalizedToken || isSubmitting) {
      return;
    }
    verifyEmailOtp(normalizedEmail, normalizedToken);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.title}>PayNote</Text>
        <Text style={styles.subtitle}>Đăng nhập để đồng bộ dữ liệu tài chính của bạn.</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />

        <TouchableOpacity
          accessibilityRole="button"
          disabled={!normalizedEmail || isSubmitting}
          style={[styles.button, (!normalizedEmail || isSubmitting) && styles.buttonDisabled]}
          onPress={sendCode}>
          {isSubmitting ? <ActivityIndicator color={colors.textOnDark} /> : <Text style={styles.buttonText}>Gửi mã đăng nhập</Text>}
        </TouchableOpacity>

        <Text style={styles.label}>Mã OTP</Text>
        <TextInput
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="number-pad"
          placeholder="Nhập mã trong email"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />

        <TouchableOpacity
          accessibilityRole="button"
          disabled={!normalizedEmail || !normalizedToken || isSubmitting}
          style={[styles.buttonSecondary, (!normalizedEmail || !normalizedToken || isSubmitting) && styles.buttonDisabled]}
          onPress={verifyCode}>
          <Text style={styles.buttonSecondaryText}>Xác nhận</Text>
        </TouchableOpacity>

        {info ? <Text style={styles.info}>{info}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: colors.appBg,
    },
    panel: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 20,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: 0,
    },
    subtitle: {
      color: colors.textSecondary,
      marginTop: 8,
      marginBottom: 24,
      fontSize: 15,
      lineHeight: 22,
    },
    label: {
      color: colors.textPrimary,
      fontWeight: '700',
      marginBottom: 8,
      marginTop: 12,
    },
    input: {
      minHeight: 48,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textPrimary,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 14,
      fontSize: 16,
    },
    button: {
      minHeight: 48,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 14,
      backgroundColor: colors.primary,
    },
    buttonSecondary: {
      minHeight: 48,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 14,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    buttonDisabled: {
      opacity: 0.55,
    },
    buttonText: {
      color: colors.textOnDark,
      fontWeight: '800',
    },
    buttonSecondaryText: {
      color: colors.primary,
      fontWeight: '800',
    },
    info: {
      color: colors.income,
      marginTop: 16,
      lineHeight: 20,
    },
    error: {
      color: colors.expense,
      marginTop: 16,
      lineHeight: 20,
    },
  });

export default AuthScreen;
