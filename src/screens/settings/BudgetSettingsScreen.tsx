import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  TextInput,
} from 'react-native';
import dayjs from 'dayjs';
import { useAppStore } from '../../app/store';
import { useThemeColors } from '../../shared/theme';
import NumericInput from '../../shared/components/NumericInput';
import { CATEGORY_EMOJI, CATEGORY_ICONS, CATEGORY_LABELS } from '../../shared/constants';
import { toast } from '../../shared/components/Toast';
import { generateBudgetRoast } from '../../services/geminiRoastService';
import { getGeminiApiKeyFromEnv } from '../../config/env';
import { PERSONA_OPTIONS } from '../../services/notifications';
import {
  startPeriodicRoastReminder,
  stopPeriodicRoastReminder,
  triggerPeriodicRoastReminderNow,
  requestPostNotificationsPermission,
  configurePeriodicRoast,
} from '../../native';

const BudgetSettingsScreen: React.FC = () => {
  const t = useThemeColors();
  const C = useMemo(() => ({
    bg: t.appBg,
    card: t.surface,
    border: t.border,
    pri: t.primary,
    ok: t.income,
    err: t.expense,
    txt: t.textPrimary,
    sub: t.textSecondary,
    muted: t.surfaceMuted,
    soft: t.primarySoft,
    onDark: t.textOnDark,
  }), [t]);
  const s = useMemo(() => createStyles(C), [C]);

  const {
    customCategories,
    budgetAlertsEnabled,
    aiBudgetAlertsEnabled,
    notificationPersona,
    notificationIntensity,
    allowStrongLanguage,
    geminiApiKey,
    setBudgetAlertsEnabled,
    setAiBudgetAlertsEnabled,
    setNotificationPersona,
    setNotificationIntensity,
    setAllowStrongLanguage,
    setGeminiApiKey,
    setCategoryBudget,
    removeCategoryBudget,
    getBudgetStatus,
    pushInAppNotification,
    notificationMemory,
    inAppNotifications,
    loadNotificationMemory,
    loadTransactions,
    loadStats,
  } = useAppStore();

  const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<string>('other');
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const nowYear = dayjs().year();
  const nowMonth = dayjs().month() + 1;
  const monthKey = `${nowYear}-${String(nowMonth).padStart(2, '0')}`;

  const systemCategoryIds = Object.keys(CATEGORY_ICONS);
  const customCategoryIds = Object.keys(customCategories);
  const allCategoryIds = Array.from(new Set([...systemCategoryIds, ...customCategoryIds]));

  const budgetRows = allCategoryIds.map(categoryId => {
    const status = getBudgetStatus(categoryId, nowYear, nowMonth);
    return {
      categoryId,
      label: CATEGORY_LABELS[categoryId] || customCategories[categoryId]?.name || categoryId,
      emoji: CATEGORY_ICONS[categoryId]
        ? CATEGORY_EMOJI[categoryId] || CATEGORY_EMOJI.other
        : customCategories[categoryId]?.icon || '📌',
      status,
    };
  });

  const budgetSummary = budgetRows.reduce(
    (acc, row) => {
      if (!row.status.exists) { return acc; }
      acc.totalLimit += row.status.limit;
      acc.totalSpent += row.status.spent;
      if (row.status.isOver) { acc.overCount += 1; }
      return acc;
    },
    { totalLimit: 0, totalSpent: 0, overCount: 0 },
  );

  const formatCurrency = (amount: number): string =>
    `${new Intl.NumberFormat('vi-VN').format(Math.max(0, amount))} ₫`;
  const selectedPersonaMeta = PERSONA_OPTIONS.find(item => item.id === notificationPersona);
  const recentNotifications = useMemo(
    () => [...inAppNotifications].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10),
    [inAppNotifications],
  );

  const getBudgetBadge = (progress: number, isOver: boolean): { text: string; bg: string; color: string } => {
    if (isOver) { return { text: 'Vượt', bg: '#fde7e3', color: C.err }; }
    if (progress >= 0.8) { return { text: 'Gần chạm', bg: '#fff1d7', color: '#b86f00' }; }
    return { text: 'An toàn', bg: C.soft, color: C.ok };
  };

  const handleOpenBudgetModal = (categoryId: string, currentLimit: number) => {
    setSelectedBudgetCategory(categoryId);
    setBudgetInput(currentLimit > 0 ? String(Math.round(currentLimit)) : '');
    setIsBudgetModalVisible(true);
  };

  const handleSaveBudget = () => {
    const value = Number(budgetInput);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Nhập hạn mức hợp lệ');
      return;
    }
    setCategoryBudget(selectedBudgetCategory, monthKey, value);
    setIsBudgetModalVisible(false);
    toast.success('Đã lưu hạn mức');
  };

  const resolveApiKey = (): string => {
    const userKey = geminiApiKey.trim();
    if (userKey.length > 0) { return userKey; }
    return getGeminiApiKeyFromEnv();
  };

  const handleTestAiAlert = async () => {
    await loadTransactions();
    await loadStats();

    const latest = useAppStore.getState();
    const rowsWithBudget = allCategoryIds
      .map(categoryId => ({
        categoryId,
        label: CATEGORY_LABELS[categoryId] || latest.customCategories[categoryId]?.name || categoryId,
        status: latest.getBudgetStatus(categoryId, nowYear, nowMonth),
      }))
      .filter(row => row.status.exists && row.status.limit > 0);
    const candidate = rowsWithBudget
      .filter(row => row.status.spent > 0)
      .sort((a, b) => b.status.progress - a.status.progress)[0];

    if (!candidate) {
      toast.error('Chưa có danh mục nào có chi tiêu + hạn mức để test');
      return;
    }

    const categoryId = candidate.categoryId;
    const categoryLabel = candidate.label;
    const spent = candidate.status.spent;
    const limit = candidate.status.limit;
    const progress = limit > 0 ? spent / limit : 0;
    const percent = Math.round(progress * 100);
    const threshold: 50 | 80 | 100 | 120 =
      percent >= 120 ? 120 : percent >= 100 ? 100 : percent >= 80 ? 80 : 50;
    const aiEnabled = aiBudgetAlertsEnabled;

    let title = 'Cảnh báo chi tiêu (test)';
    let message = `Danh mục ${categoryLabel} đã dùng ${percent}% ngân sách tháng (${formatCurrency(spent)} / ${formatCurrency(limit)}).`;
    let source: 'ai_fallback' | 'template' = 'template';
    let toneTag = notificationPersona;

    if (aiEnabled) {
      const roast = await generateBudgetRoast({
        apiKey: resolveApiKey(),
        categoryId,
        categoryLabel,
        spent,
        limit,
        progress,
        threshold,
        monthKey,
        persona: notificationPersona,
        allowStrongLanguage,
      });
      title = roast.title || title;
      message = roast.message || message;
      source = roast.fallbackUsed ? 'template' : 'ai_fallback';
      toneTag = roast.toneTag;
    }

    pushInAppNotification({
      type: 'budget_alert',
      title,
      message,
      source,
      toneTag,
      categoryId,
      monthKey,
      threshold,
    });
    toast.warning(message.length > 155 ? `${message.slice(0, 154).trim()}…` : message, 4500);

  };

  return (
    <React.Fragment>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.sec}>Cảnh báo tiêu nhiều</Text>
        <View style={s.card}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Bật cảnh báo theo ngân sách danh mục</Text>
              <Text style={s.desc}>Mỗi mốc sẽ cảnh báo 1 lần/tháng cho từng danh mục.</Text>
            </View>
            <Switch
              value={budgetAlertsEnabled}
              onValueChange={setBudgetAlertsEnabled}
              trackColor={{ false: '#d8ddd4', true: C.pri }}
              thumbColor="#ffffff"
            />
          </View>
          <View style={s.thresholdRow}>
            <Text style={s.thresholdPill}>50%</Text>
            <Text style={s.thresholdPill}>80%</Text>
            <Text style={s.thresholdPill}>100%</Text>
            <Text style={s.thresholdPill}>120%</Text>
          </View>
        </View>
        <View style={s.card}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Bật cảnh báo AI </Text>
              <Text style={s.desc}>Nếu tắt, app luôn dùng template persona nội bộ. Nếu bật, Gemini chỉ dùng khi fallback.</Text>
            </View>
            <Switch
              value={aiBudgetAlertsEnabled}
              onValueChange={setAiBudgetAlertsEnabled}
              trackColor={{ false: '#d8ddd4', true: C.pri }}
              thumbColor="#ffffff"
            />
          </View>
          <Text style={[s.desc, { marginTop: 10 }]}>Gemini API Key (demo nội bộ)</Text>
          <TextInput
            value={geminiApiKey}
            onChangeText={setGeminiApiKey}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="AIza..."
            placeholderTextColor={C.sub}
            style={s.aiKeyInput}
          />
          <Text style={s.keyHint}>
            Không hardcode key khi build production. Bản phát hành chính thức cần chuyển qua backend proxy.
          </Text>
          <Text style={[s.desc, { marginTop: 10 }]}>Persona thông báo</Text>
          <View style={s.toneRow}>
            {PERSONA_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[s.toneChip, notificationPersona === option.id && s.toneChipActive]}
                onPress={() => setNotificationPersona(option.id)}>
                <Text style={[s.toneChipTxt, notificationPersona === option.id && s.toneChipTxtActive]}>
                  {option.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[s.desc, { marginTop: 10 }]}>Cường độ hội thoại</Text>
          <View style={s.toneRow}>
            {[
              { id: 'soft', label: 'Nhẹ' },
              { id: 'normal', label: 'Cân bằng' },
              { id: 'sharp', label: 'Sắc' },
            ].map(option => (
              <TouchableOpacity
                key={option.id}
                style={[s.toneChip, notificationIntensity === option.id && s.toneChipActive]}
                onPress={() => setNotificationIntensity(option.id as 'soft' | 'normal' | 'sharp')}>
                <Text style={[s.toneChipTxt, notificationIntensity === option.id && s.toneChipTxtActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedPersonaMeta && (
            <View style={[s.card, { marginTop: 10, marginBottom: 0 }]}>
              <Text style={s.label}>{selectedPersonaMeta.title}</Text>
              <Text style={s.desc}>{selectedPersonaMeta.description}</Text>
              <Text style={[s.desc, { fontStyle: 'italic', marginTop: 4 }]}>Nhẹ: “{selectedPersonaMeta.preview}”</Text>
              <Text style={[s.desc, { fontStyle: 'italic', marginTop: 4 }]}>
                Tái phạm: “{selectedPersonaMeta.id === 'advisor'
                  ? 'Nhịp này lặp lại nhiều rồi, mình phanh sớm để đỡ áp lực cuối tháng nhé.'
                  : selectedPersonaMeta.id === 'wallet_pet'
                    ? 'Ví bé thấy pattern này rồi nè, mình giảm ga kẻo ví tụt pin nha 🥲'
                    : selectedPersonaMeta.id === 'toxic_friend'
                      ? 'Cú này lặp lại hơi đều, và cuối tháng thì hậu quả cũng đều như vậy.'
                      : 'Nhắc nhẹ không nghe thì giờ dừng ngay, đừng tự làm khó mình nữa.'}”
              </Text>
            </View>
          )}
          <Text style={[s.desc, { marginTop: 8 }]}>Ngôn từ gắt hơn (chỉ áp dụng cho “Mẹ Việt Nam”)</Text>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Text style={s.desc}>Cho phép xưng hô gắt hơn</Text>
            <Switch
              value={allowStrongLanguage}
              onValueChange={setAllowStrongLanguage}
              trackColor={{ false: '#d8ddd4', true: C.pri }}
              thumbColor="#ffffff"
            />
          </View>
          <TouchableOpacity style={[s.secondaryBtn, { marginTop: 12, alignSelf: 'flex-start' }]} onPress={handleTestAiAlert}>
            <Text style={s.secondaryBtnTxt}>Test AI alert</Text>
          </TouchableOpacity>
          <View style={[s.row, { marginTop: 10, flexWrap: 'wrap' }]}>
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => {
                configurePeriodicRoast(
                  aiBudgetAlertsEnabled,
                  resolveApiKey(),
                  notificationPersona,
                  allowStrongLanguage,
                  notificationIntensity,
                );
                startPeriodicRoastReminder();
                toast.success('Đã bật periodic native mỗi 1 giờ');
              }}>
              <Text style={s.secondaryBtnTxt}>Bật periodic 1h</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => {
                stopPeriodicRoastReminder();
                toast.success('Đã tắt periodic native');
              }}>
              <Text style={s.secondaryBtnTxt}>Tắt periodic</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={async () => {
                const granted = await requestPostNotificationsPermission();
                if (!granted) {
                  toast.error('Chưa cấp quyền thông báo cho app');
                  return;
                }
                triggerPeriodicRoastReminderNow();
                toast.success('Đã bắn test periodic ngay');
              }}>
              <Text style={s.secondaryBtnTxt}>Test periodic now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.sec}>Ngân sách danh mục (tháng hiện tại)</Text>
        <View style={s.card}>
          <Text style={s.desc}>
            Tháng {dayjs().format('MM/YYYY')} • Đã chi {formatCurrency(budgetSummary.totalSpent)} / Hạn mức {formatCurrency(budgetSummary.totalLimit)}
          </Text>
          <Text style={[s.desc, { marginTop: 4 }]}>Danh mục vượt: {budgetSummary.overCount}</Text>
        </View>
        {budgetRows.map(row => {
          const badge = getBudgetBadge(row.status.progress, row.status.isOver);
          return (
            <View key={row.categoryId} style={s.card}>
              <View style={s.row}>
                <View style={[s.emojiWrap, row.status.isOver && { backgroundColor: '#fde7e3' }]}>
                  <Text style={s.emoji}>{row.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>{row.label}</Text>
                  <Text style={s.desc}>
                    Đã chi: {formatCurrency(row.status.spent)} {row.status.exists ? `• Hạn mức: ${formatCurrency(row.status.limit)}` : '• Chưa đặt hạn mức'}
                  </Text>
                </View>
                <View style={[s.badge, { backgroundColor: badge.bg }]}>
                  <Text style={{ color: badge.color, fontSize: 12, fontWeight: '700' }}>{badge.text}</Text>
                </View>
              </View>
              <View style={[s.row, { marginTop: 10, justifyContent: 'flex-end' }]}>
                {row.status.exists && (
                  <TouchableOpacity
                    style={[s.secondaryBtn, { marginRight: 8 }]}
                    onPress={() => removeCategoryBudget(row.categoryId, monthKey)}>
                    <Text style={[s.secondaryBtnTxt, { color: C.err }]}>Xóa hạn mức</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={s.secondaryBtn}
                  onPress={() => handleOpenBudgetModal(row.categoryId, row.status.limit)}>
                  <Text style={s.secondaryBtnTxt}>{row.status.exists ? 'Sửa hạn mức' : 'Đặt hạn mức'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <Text style={s.sec}>Debug Notification Engine</Text>
        <View style={s.card}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Text style={s.label}>Memory + Recent events</Text>
            <TouchableOpacity style={s.secondaryBtn} onPress={() => setShowDebugPanel(v => !v)}>
              <Text style={s.secondaryBtnTxt}>{showDebugPanel ? 'Ẩn' : 'Hiện'}</Text>
            </TouchableOpacity>
          </View>
          <View style={[s.row, { marginTop: 10 }]}>
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => {
                loadNotificationMemory();
                toast.success('Đã refresh memory');
              }}>
              <Text style={s.secondaryBtnTxt}>Refresh memory</Text>
            </TouchableOpacity>
          </View>

          {showDebugPanel && (
            <View style={{ marginTop: 12 }}>
              <Text style={s.debugLine}>recentTemplateIds: {notificationMemory.recentTemplateIds.length}</Text>
              <Text style={s.debugLine}>recentTexts: {notificationMemory.recentTexts.length}</Text>
              <Text style={s.debugLine}>countTodayByTrigger: {Object.keys(notificationMemory.countTodayByTrigger).length}</Text>
              <Text style={s.debugLine}>countTodayByCategory: {Object.keys(notificationMemory.countTodayByCategory).length}</Text>
              <Text style={s.debugLine}>warningCountByCategory: {Object.keys(notificationMemory.warningCountByCategory).length}</Text>
              <Text style={s.debugLine}>lastResetDate: {notificationMemory.lastResetDate || '-'}</Text>

              <Text style={[s.label, { marginTop: 12 }]}>10 thông báo gần nhất</Text>
              {recentNotifications.length === 0 ? (
                <Text style={s.desc}>Chưa có thông báo nào.</Text>
              ) : (
                recentNotifications.map(item => (
                  <View key={item.id} style={s.debugItem}>
                    <Text style={s.debugTitle}>{item.title}</Text>
                    <Text style={s.debugMeta}>
                      {dayjs(item.createdAt).format('DD/MM HH:mm:ss')} • {item.type} • {item.source || '-'}
                    </Text>
                    <Text style={s.debugMeta}>
                      trigger: {item.trigger || '-'} • severity: {item.severity || '-'} • persona: {item.toneTag || '-'}
                    </Text>
                    <Text style={s.debugMeta}>
                      context: {item.categoryContext || '-'} • tier: {item.escalationTier || '-'} • origin: {item.templateOrigin || '-'}
                    </Text>
                    <Text style={s.debugMeta}>
                      templateId: {item.templateId || '-'}
                    </Text>
                    <Text style={s.debugMeta}>
                      score: {item.scoreMeta || '-'}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isBudgetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsBudgetModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>
              Hạn mức {CATEGORY_LABELS[selectedBudgetCategory] || customCategories[selectedBudgetCategory]?.name || selectedBudgetCategory}
            </Text>
            <NumericInput
              value={budgetInput}
              onChangeText={setBudgetInput}
              placeholder="Nhập số tiền"
              placeholderTextColor={C.sub}
              style={s.modalInput}
            />
            <View style={[s.row, { justifyContent: 'flex-end', marginTop: 14 }]}>
              <TouchableOpacity style={[s.secondaryBtn, { marginRight: 8 }]} onPress={() => setIsBudgetModalVisible(false)}>
                <Text style={s.secondaryBtnTxt}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnSmall} onPress={handleSaveBudget}>
                <Text style={s.btnTxt}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </React.Fragment>
  );
};

const createStyles = (C: {
  bg: string;
  card: string;
  border: string;
  pri: string;
  ok: string;
  err: string;
  txt: string;
  sub: string;
  muted: string;
  soft: string;
  onDark: string;
}) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  sec: { color: C.txt, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10, marginLeft: 4 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.muted, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 18 },
  label: { color: C.txt, fontSize: 15, fontWeight: '600' },
  desc: { color: C.sub, fontSize: 12, marginTop: 2 },
  badge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  btnSmall: { backgroundColor: C.pri, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  btnTxt: { color: C.onDark, fontSize: 14, fontWeight: '700' },
  secondaryBtn: { backgroundColor: C.muted, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingVertical: 8, paddingHorizontal: 10 },
  secondaryBtnTxt: { color: C.txt, fontSize: 13, fontWeight: '600' },
  thresholdRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  thresholdPill: {
    borderWidth: 1,
    borderColor: C.border,
    color: C.txt,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.muted,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16 },
  modalTitle: { color: C.txt, fontSize: 16, fontWeight: '700', marginBottom: 10 },
  modalInput: { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: C.txt, fontSize: 15, backgroundColor: C.muted },
  aiKeyInput: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: C.muted,
    color: C.txt,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  keyHint: { marginTop: 8, color: C.sub, fontSize: 11, lineHeight: 16 },
  toneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  toneChip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    backgroundColor: C.muted,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  toneChipActive: {
    borderColor: C.pri,
    backgroundColor: C.soft,
  },
  toneChipTxt: { color: C.txt, fontSize: 12, fontWeight: '600' },
  toneChipTxtActive: { color: C.pri },
  debugLine: { color: C.sub, fontSize: 12, marginTop: 4 },
  debugItem: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: C.muted,
  },
  debugTitle: { color: C.txt, fontSize: 13, fontWeight: '700' },
  debugMeta: { color: C.sub, fontSize: 11, marginTop: 3 },
});

export default BudgetSettingsScreen;
