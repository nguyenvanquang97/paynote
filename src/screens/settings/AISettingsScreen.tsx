import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useThemeColors} from '../../shared/theme';
import {useAppStore} from '../../app/store';
import {getAIEnvSettings} from '../../config/env';
import {useAIChatStore} from '../../features/ai/store/useAIChatStore';
import {toast} from '../../shared/components/Toast';

const PROVIDER_OPTIONS = [
  {id: 'auto', label: 'Auto'},
  {id: 'mock', label: 'Mock'},
  {id: 'gemini', label: 'Gemini'},
  {id: 'openai', label: 'OpenAI'},
] as const;

const STYLE_OPTIONS = [
  {id: 'normal', label: 'Normal'},
  {id: 'strict', label: 'Strict'},
  {id: 'funny', label: 'Funny'},
] as const;

const AISettingsScreen: React.FC = () => {
  const t = useThemeColors();
  const C = useMemo(() => ({
    bg: t.appBg,
    card: t.surface,
    border: t.border,
    pri: t.primary,
    txt: t.textPrimary,
    sub: t.textSecondary,
    acc: t.primaryDeep,
    muted: t.surfaceMuted,
    onDark: t.textOnDark,
    soft: t.primarySoft,
  }), [t]);
  const s = useMemo(() => createStyles(C), [C]);

  const {
    aiChatEnabled,
    aiUseOnline,
    aiAllowFinancialContext,
    aiResponseStyle,
    aiProviderPreference,
    setAIChatEnabled,
    setAIUseOnline,
    setAIAllowFinancialContext,
    setAIResponseStyle,
    setAIProviderPreference,
  } = useAppStore();
  const clearAIChatMessages = useAIChatStore(state => state.clearMessages);
  const aiEnvSettings = useMemo(() => getAIEnvSettings(), []);

  const renderChoice = (
    value: string,
    onChange: (id: any) => void,
    options: ReadonlyArray<{id: string; label: string}>,
  ) => (
    <View style={s.settingActions}>
      {options.map(option => (
        <TouchableOpacity
          key={option.id}
          style={[s.settingChip, value === option.id && s.settingChipActive]}
          onPress={() => onChange(option.id)}>
          <Text style={[s.settingChipTxt, value === option.id && s.settingChipTxtActive]}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.card}>
        <Text style={s.label}>Trợ lý aQuang</Text>
        <Text style={s.desc}>Provider env: {aiEnvSettings.provider} • Model env: {aiEnvSettings.model}</Text>

        <View style={s.settingRow}>
          <Text style={s.settingLabel}>AI Chat</Text>
          {renderChoice(String(aiChatEnabled), v => setAIChatEnabled(v === 'true'), [
            {id: 'true', label: 'Bật'},
            {id: 'false', label: 'Tắt'},
          ])}
        </View>

        <View style={s.settingRow}>
          <Text style={s.settingLabel}>AI online</Text>
          {renderChoice(String(aiUseOnline), v => setAIUseOnline(v === 'true'), [
            {id: 'true', label: 'Bật'},
            {id: 'false', label: 'Tắt'},
          ])}
        </View>

        <View style={s.settingRow}>
          <Text style={s.settingLabel}>Provider</Text>
          {renderChoice(aiProviderPreference, setAIProviderPreference, PROVIDER_OPTIONS)}
        </View>

        <View style={s.settingRow}>
          <Text style={s.settingLabel}>Dữ liệu tài chính</Text>
          {renderChoice(String(aiAllowFinancialContext), v => setAIAllowFinancialContext(v === 'true'), [
            {id: 'true', label: 'Cho phép'},
            {id: 'false', label: 'Từ chối'},
          ])}
        </View>

        <View style={s.settingRow}>
          <Text style={s.settingLabel}>Phong cách trả lời</Text>
          {renderChoice(aiResponseStyle, setAIResponseStyle, STYLE_OPTIONS)}
        </View>

        <TouchableOpacity
          style={[s.btn, s.subtleBtn]}
          onPress={() => {
            clearAIChatMessages();
            toast.success('Đã xóa lịch sử chat AI');
          }}>
          <Text style={[s.btnTxt, s.subtleBtnTxt]}>Xóa lịch sử chat AI</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const createStyles = (C: {
  bg: string;
  card: string;
  border: string;
  pri: string;
  txt: string;
  sub: string;
  acc: string;
  muted: string;
  onDark: string;
  soft: string;
}) => StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  content: {padding: 16, paddingBottom: 30},
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  label: {color: C.txt, fontSize: 15, fontWeight: '700'},
  desc: {color: C.sub, fontSize: 12, marginTop: 2},
  settingRow: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12,
  },
  settingLabel: {
    color: C.txt,
    fontSize: 13,
    fontWeight: '600',
  },
  settingActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  settingChip: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.muted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  settingChipActive: {
    borderColor: C.pri,
    backgroundColor: C.soft,
  },
  settingChipTxt: {
    color: C.sub,
    fontSize: 12,
    fontWeight: '700',
  },
  settingChipTxtActive: {
    color: C.acc,
  },
  btn: {
    marginTop: 12,
    backgroundColor: C.pri,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  subtleBtn: {
    backgroundColor: C.soft,
    borderWidth: 1,
    borderColor: C.border,
  },
  btnTxt: {color: C.onDark, fontSize: 14, fontWeight: '700'},
  subtleBtnTxt: {color: C.acc},
});

export default AISettingsScreen;
