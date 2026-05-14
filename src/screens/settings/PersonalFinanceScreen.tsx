import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import RNShare from 'react-native-share';
import {useAppStore} from '../../app/store';
import {getTransactions, importTransactions} from '../../database';
import dayjs from 'dayjs';
import {pick, types} from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import type {Transaction} from '../../shared/types';
import type {
  BudgetAlertHistory,
  BudgetMap,
  CustomCategory,
  Profile,
  ThemeMode,
} from '../../app/store';
import {useThemeColors} from '../../shared/theme';
import AppIcon from '../../shared/components/AppIcon';
import NumericInput from '../../shared/components/NumericInput';
import {CATEGORY_EMOJI, CATEGORY_ICONS, CATEGORY_LABELS} from '../../shared/constants';
import {dialog} from '../../shared/components/Dialog';
import {toast} from '../../shared/components/Toast';

interface BackupSchemaV2 {
  version: 2;
  exportedAt: string;
  transactions: Transaction[];
  customCategories?: Record<string, CustomCategory>;
  profile?: Profile;
  categoryBudgets?: BudgetMap;
  favoriteCategories?: string[];
  monthlyNotes?: Record<string, string>;
  budgetAlertsEnabled?: boolean;
  budgetAlertHistory?: BudgetAlertHistory;
  themeMode?: ThemeMode;
}

const PersonalFinanceScreen: React.FC = () => {
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
    acc: t.primaryDeep,
    muted: t.surfaceMuted,
    soft: t.primarySoft,
    onDark: t.textOnDark,
  }), [t]);
  const s = useMemo(() => createStyles(C), [C]);

  const {
    customCategories,
    categoryBudgets,
    favoriteCategories,
    monthlyNotes,
    budgetAlertsEnabled,
    budgetAlertHistory,
    themeMode,
    profile,
    addCustomCategory,
    setProfile,
    setCategoryBudget,
    removeCategoryBudget,
    getBudgetStatus,
    setFavoriteCategories,
    toggleFavoriteCategory,
    setMonthlyNote,
    setBudgetAlertsEnabled,
    markBudgetAlertTriggered,
    setThemeMode,
    resetData,
    loadTransactions,
    loadStats,
  } = useAppStore();

  const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<string>('other');
  const [monthlyNoteDraft, setMonthlyNoteDraft] = useState('');

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
      if (!row.status.exists) {return acc;}
      acc.totalLimit += row.status.limit;
      acc.totalSpent += row.status.spent;
      if (row.status.isOver) {acc.overCount += 1;}
      return acc;
    },
    {totalLimit: 0, totalSpent: 0, overCount: 0},
  );

  useEffect(() => {
    setMonthlyNoteDraft(monthlyNotes[monthKey] || '');
  }, [monthKey, monthlyNotes]);

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('vi-VN').format(Math.max(0, amount)) + ' ₫';

  const getBudgetBadge = (progress: number, isOver: boolean): {text: string; bg: string; color: string} => {
    if (isOver) {return {text: 'Vượt', bg: '#fde7e3', color: C.err};}
    if (progress >= 0.8) {return {text: 'Gần chạm', bg: '#fff1d7', color: '#b86f00'};}
    return {text: 'An toàn', bg: C.soft, color: C.ok};
  };

  const handleExportJSON = async () => {
    try {
      const txs = await getTransactions(10000);
      const backupData: BackupSchemaV2 = {
        version: 2,
        exportedAt: new Date().toISOString(),
        transactions: txs,
        customCategories,
        profile,
        categoryBudgets,
        favoriteCategories,
        monthlyNotes,
        budgetAlertsEnabled,
        budgetAlertHistory,
        themeMode,
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      const dir = RNFS.CachesDirectoryPath;
      const path = `${dir}/PayNote_Backup_${dayjs().format('YYYYMMDD_HHmmss')}.json`;
      await RNFS.writeFile(path, jsonStr, 'utf8');
      await RNShare.open({
        title: 'PayNote Backup',
        url: `file://${path}`,
        type: 'application/json',
        failOnCancel: false,
      });
    } catch (err) {
      console.error(err);
      toast.error('Không thể xuất dữ liệu');
    }
  };

  const handleExportCSV = async () => {
    try {
      const txs = await getTransactions(10000);
      const header = 'Ngày,Loại,Số tiền,Danh mục,Mô tả,Ngân hàng';
      const rows = txs.map(tx => [
        dayjs(tx.timestamp).format('DD/MM/YYYY HH:mm'),
        tx.transactionType === 'income' ? 'Thu nhập' : 'Chi tiêu',
        tx.amount,
        tx.category || '',
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        tx.bank,
      ].join(','));
      const csv = [header, ...rows].join('\n');
      const dir = RNFS.CachesDirectoryPath;
      const path = `${dir}/PayNote_Export_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
      await RNFS.writeFile(path, csv, 'utf8');
      await RNShare.open({
        title: 'PayNote Export',
        url: `file://${path}`,
        type: 'text/csv',
        failOnCancel: false,
      });
    } catch (err) {
      console.error(err);
      toast.error('Không thể xuất CSV');
    }
  };

  const handleImportJSON = async () => {
    try {
      const [res] = await pick({type: [types.json, types.allFiles]});
      if (!res) {return;}

      const content = await RNFS.readFile(res.uri, 'utf8');
      const backupData = JSON.parse(content);
      if (!Array.isArray(backupData?.transactions)) {
        throw new Error('Invalid format');
      }

      dialog.confirm(
        'Xác nhận khôi phục',
        'Toàn bộ dữ liệu hiện tại sẽ bị xóa và thay thế bằng dữ liệu từ file backup. Bạn có chắc chắn?',
        {
          confirmText: 'Khôi phục',
          cancelText: 'Hủy',
          variant: 'danger',
          onConfirm: async () => {
            try {
              await resetData();
              await importTransactions(backupData.transactions);
              if (backupData.customCategories && typeof backupData.customCategories === 'object') {
                Object.values(backupData.customCategories).forEach((c: any) => {
                  if (c?.id && c?.name && c?.icon) {
                    addCustomCategory(c);
                  }
                });
              }
              if (backupData.profile && typeof backupData.profile === 'object') {
                const name = typeof backupData.profile.name === 'string' ? backupData.profile.name : 'Người dùng';
                const avatarUrl = typeof backupData.profile.avatarUrl === 'string' ? backupData.profile.avatarUrl : '';
                setProfile({name, avatarUrl});
              }
              if (backupData.categoryBudgets && typeof backupData.categoryBudgets === 'object') {
                Object.values(backupData.categoryBudgets).forEach((item: any) => {
                  if (!item?.categoryId || !item?.monthKey || typeof item.limit !== 'number') {return;}
                  setCategoryBudget(item.categoryId, item.monthKey, item.limit);
                });
              }
              if (Array.isArray(backupData.favoriteCategories)) {
                setFavoriteCategories(backupData.favoriteCategories.filter((id: unknown) => typeof id === 'string'));
              }
              if (backupData.monthlyNotes && typeof backupData.monthlyNotes === 'object') {
                Object.entries(backupData.monthlyNotes).forEach(([k, v]) => {
                  if (typeof k === 'string' && typeof v === 'string') {
                    setMonthlyNote(k, v);
                  }
                });
              }
              if (typeof backupData.budgetAlertsEnabled === 'boolean') {
                setBudgetAlertsEnabled(backupData.budgetAlertsEnabled);
              }
              if (backupData.budgetAlertHistory && typeof backupData.budgetAlertHistory === 'object') {
                Object.entries(backupData.budgetAlertHistory).forEach(([key, value]) => {
                  const segments = key.split(':');
                  if (segments.length !== 3) {return;}
                  const [alertMonthKey, alertCategoryId, thresholdText] = segments;
                  const threshold = Number(thresholdText);
                  if (
                    (threshold !== 80 && threshold !== 100 && threshold !== 120) ||
                    typeof value !== 'object' ||
                    value === null
                  ) {
                    return;
                  }
                  const spent = Number((value as any).spent);
                  const limit = Number((value as any).limit);
                  if (!Number.isFinite(spent) || !Number.isFinite(limit) || limit <= 0) {return;}
                  markBudgetAlertTriggered(
                    alertMonthKey,
                    alertCategoryId,
                    threshold as 80 | 100 | 120,
                    {spent, limit},
                  );
                });
              }
              if (
                backupData.themeMode &&
                (backupData.themeMode === 'light' || backupData.themeMode === 'dark' || backupData.themeMode === 'forest')
              ) {
                setThemeMode(backupData.themeMode);
              }
              loadTransactions();
              loadStats();
              toast.success('Dữ liệu đã được khôi phục');
            } catch (e) {
              console.error(e);
              toast.error('Khôi phục thất bại');
            }
          },
        },
      );
    } catch (err) {
      const errCode = (err as any)?.code;
      if (errCode !== 'DOCUMENT_PICKER_CANCELED' && errCode !== 'OPERATION_CANCELED') {
        console.error(err);
        toast.error('Không thể đọc file');
      }
    }
  };

  const handleResetData = () => {
    dialog.confirm(
      'Xóa toàn bộ dữ liệu',
      'Bạn có chắc chắn muốn xóa tất cả giao dịch và cấu hình cá nhân? Hành động này không thể hoàn tác.',
      {
        confirmText: 'Xóa tất cả',
        cancelText: 'Hủy',
        variant: 'danger',
        onConfirm: async () => {
          await resetData();
          loadTransactions();
          loadStats();
          toast.success('Đã xóa toàn bộ dữ liệu');
        },
      },
    );
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

  return (
    <React.Fragment>
      <ScrollView style={s.container} contentContainerStyle={{padding: 16, paddingBottom: 40}}>
        <Text style={s.sec}>Cảnh báo tiêu nhiều</Text>
        <View style={s.card}>
          <View style={[s.row, {justifyContent: 'space-between'}]}>
            <View style={{flex: 1}}>
              <Text style={s.label}>Bật cảnh báo theo ngân sách danh mục</Text>
              <Text style={s.desc}>Mỗi mốc sẽ cảnh báo 1 lần/tháng cho từng danh mục.</Text>
            </View>
            <Switch
              value={budgetAlertsEnabled}
              onValueChange={setBudgetAlertsEnabled}
              trackColor={{false: '#d8ddd4', true: C.pri}}
              thumbColor="#ffffff"
            />
          </View>
          <View style={s.thresholdRow}>
            <Text style={s.thresholdPill}>80%</Text>
            <Text style={s.thresholdPill}>100%</Text>
            <Text style={s.thresholdPill}>120%</Text>
          </View>
        </View>

        <Text style={s.sec}>Ngân sách danh mục (tháng hiện tại)</Text>
        <View style={s.card}>
          <Text style={s.desc}>
            Tháng {dayjs().format('MM/YYYY')} • Đã chi {formatCurrency(budgetSummary.totalSpent)} / Hạn mức {formatCurrency(budgetSummary.totalLimit)}
          </Text>
          <Text style={[s.desc, {marginTop: 4}]}>Danh mục vượt: {budgetSummary.overCount}</Text>
        </View>
        {budgetRows.map(row => {
          const badge = getBudgetBadge(row.status.progress, row.status.isOver);
          return (
            <View key={row.categoryId} style={s.card}>
              <View style={s.row}>
                <View style={[s.emojiWrap, row.status.isOver && {backgroundColor: '#fde7e3'}]}>
                  <Text style={s.emoji}>{row.emoji}</Text>
                </View>
                <View style={{flex: 1}}>
                  <Text style={s.label}>{row.label}</Text>
                  <Text style={s.desc}>
                    Đã chi: {formatCurrency(row.status.spent)} {row.status.exists ? `• Hạn mức: ${formatCurrency(row.status.limit)}` : '• Chưa đặt hạn mức'}
                  </Text>
                </View>
                <View style={[s.badge, {backgroundColor: badge.bg}]}>
                  <Text style={{color: badge.color, fontSize: 12, fontWeight: '700'}}>{badge.text}</Text>
                </View>
              </View>
              <View style={[s.row, {marginTop: 10, justifyContent: 'flex-end'}]}>
                {row.status.exists && (
                  <TouchableOpacity
                    style={[s.secondaryBtn, {marginRight: 8}]}
                    onPress={() => removeCategoryBudget(row.categoryId, monthKey)}>
                    <Text style={[s.secondaryBtnTxt, {color: C.err}]}>Xóa hạn mức</Text>
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

        <Text style={s.sec}>Tiện ích cá nhân</Text>
        <View style={s.card}>
          <Text style={s.label}>Danh mục ưa thích</Text>
          <Text style={s.desc}>Gợi ý nhanh khi thêm giao dịch (được backup/import).</Text>
          <View style={s.chipsWrap}>
            {allCategoryIds.map(categoryId => {
              const active = favoriteCategories.includes(categoryId);
              return (
                <TouchableOpacity
                  key={categoryId}
                  onPress={() => toggleFavoriteCategory(categoryId)}
                  style={[s.chip, active && s.chipActive]}>
                  <Text style={[s.chipText, active && s.chipTextActive]}>
                    {CATEGORY_LABELS[categoryId] || customCategories[categoryId]?.name || categoryId}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.label}>Ghi chú tháng {dayjs().format('MM/YYYY')}</Text>
          <TextInput
            style={s.noteInput}
            placeholder="Ví dụ: Giảm chi cafe xuống 20%."
            placeholderTextColor={C.sub}
            value={monthlyNoteDraft}
            onChangeText={setMonthlyNoteDraft}
            multiline
          />
          <TouchableOpacity
            style={s.btn}
            onPress={() => {
              setMonthlyNote(monthKey, monthlyNoteDraft);
              toast.success('Đã lưu ghi chú tháng');
            }}>
            <Text style={s.btnTxt}>Lưu ghi chú</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sec}>Dữ liệu</Text>
        <TouchableOpacity style={s.card} onPress={handleExportJSON}>
          <View style={s.row}>
            <View style={s.iconWrap}><AppIcon name="upload" size={20} color={C.acc} /></View>
            <View style={{flex: 1}}><Text style={s.label}>Sao lưu JSON</Text><Text style={s.desc}>Xuất file JSON để backup/restore</Text></View>
            <AppIcon name="chevron-right" size={16} color={C.sub} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={handleExportCSV}>
          <View style={s.row}>
            <View style={s.iconWrap}><AppIcon name="list" size={20} color={C.acc} /></View>
            <View style={{flex: 1}}><Text style={s.label}>Xuất CSV</Text><Text style={s.desc}>Mở bằng Excel / Google Sheets</Text></View>
            <AppIcon name="chevron-right" size={16} color={C.sub} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={handleImportJSON}>
          <View style={s.row}>
            <View style={s.iconWrap}><AppIcon name="download" size={20} color={C.acc} /></View>
            <View style={{flex: 1}}><Text style={s.label}>Phục hồi dữ liệu</Text><Text style={s.desc}>Nhập file JSON đã sao lưu</Text></View>
            <AppIcon name="chevron-right" size={16} color={C.sub} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[s.card, s.dangerCard]} onPress={handleResetData}>
          <View style={s.row}>
            <View style={s.iconWrap}><AppIcon name="trash" size={20} color={C.err} /></View>
            <View style={{flex: 1}}><Text style={s.label}>Xoá toàn bộ dữ liệu</Text><Text style={s.desc}>Reset app về trạng thái ban đầu</Text></View>
          </View>
        </TouchableOpacity>
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
            <View style={[s.row, {justifyContent: 'flex-end', marginTop: 14}]}>
              <TouchableOpacity style={[s.secondaryBtn, {marginRight: 8}]} onPress={() => setIsBudgetModalVisible(false)}>
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
  acc: string;
  muted: string;
  soft: string;
  onDark: string;
}) => StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  sec: {color: C.txt, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10, marginLeft: 4},
  card: {backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12},
  iconWrap: {width: 30, height: 30, borderRadius: 15, backgroundColor: C.muted, alignItems: 'center', justifyContent: 'center'},
  emojiWrap: {width: 34, height: 34, borderRadius: 17, backgroundColor: C.muted, alignItems: 'center', justifyContent: 'center'},
  emoji: {fontSize: 18},
  label: {color: C.txt, fontSize: 15, fontWeight: '600'},
  desc: {color: C.sub, fontSize: 12, marginTop: 2},
  badge: {borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10},
  btn: {marginTop: 12, backgroundColor: C.pri, borderRadius: 10, paddingVertical: 10, alignItems: 'center'},
  btnSmall: {backgroundColor: C.pri, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center'},
  btnTxt: {color: C.onDark, fontSize: 14, fontWeight: '700'},
  secondaryBtn: {backgroundColor: C.muted, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingVertical: 8, paddingHorizontal: 10},
  secondaryBtnTxt: {color: C.txt, fontSize: 13, fontWeight: '600'},
  chipsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10},
  chip: {borderWidth: 1, borderColor: C.border, backgroundColor: C.muted, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 999},
  chipActive: {borderColor: C.pri, backgroundColor: C.soft},
  chipText: {color: C.sub, fontSize: 12, fontWeight: '600'},
  chipTextActive: {color: C.acc},
  thresholdRow: {flexDirection: 'row', gap: 8, marginTop: 10},
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
  noteInput: {minHeight: 90, marginTop: 10, padding: 12, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.txt, textAlignVertical: 'top', backgroundColor: C.muted},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20},
  modalCard: {backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16},
  modalTitle: {color: C.txt, fontSize: 16, fontWeight: '700', marginBottom: 10},
  modalInput: {borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: C.txt, fontSize: 15, backgroundColor: C.muted},
  dangerCard: {borderColor: '#f4c7bd', backgroundColor: '#fff4f1'},
});

export default PersonalFinanceScreen;
