import React, {useEffect, useState, useCallback, useRef, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Pressable,
} from 'react-native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useAppStore} from '../../app/store';
import {CATEGORY_ICONS, CATEGORY_EMOJI, SUPPORTED_BANKS, getCategoryLabel} from '../../shared/constants';
import type {Transaction} from '../../shared/types';
import {deleteTransaction} from '../../database';
import dayjs from 'dayjs';
import AddTransactionModal from './AddTransactionModal';
import SwipeableRow from '../../shared/components/SwipeableRow';
import {useThemeColors} from '../../shared/theme';
import AppIcon, {categoryIconName} from '../../shared/components/AppIcon';
import {dialog} from '../../shared/components/Dialog';
import {useRoute} from '@react-navigation/native';

const {width} = Dimensions.get('window');

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';

const TransactionsScreen: React.FC = () => {
  const t = useThemeColors();
  const COLORS = useMemo(() => ({
    bg: t.appBg,
    card: t.surface,
    cardBorder: t.border,
    primary: t.primary,
    income: t.income,
    expense: t.expense,
    text: t.textPrimary,
    textSecondary: t.textSecondary,
    accent: t.primaryDeep,
    warning: t.warning,
    primarySoft: t.primarySoft,
    muted: t.surfaceMuted,
    shadow: t.shadow,
    onDark: t.textOnDark,
  }), [t]);
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const route = useRoute<any>();
  const {transactions, isLoading, loadTransactions, customCategories} = useAppStore();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [grouping, setGrouping] = useState<'day' | 'week' | 'month'>('day');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [pendingJump, setPendingJump] = useState<{year: number; month: number} | null>(null);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const sectionListRef = useRef<SectionList<any>>(null);
  const lastJumpTsRef = useRef<number>(0);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleOpenAdd = useCallback(() => {
    setEditingTransaction(null);
    bottomSheetRef.current?.present();
  }, []);

  const handleOpenEdit = useCallback((tx: Transaction) => {
    setEditingTransaction(tx);
    bottomSheetRef.current?.present();
  }, []);

  const handleDelete = useCallback((tx: Transaction) => {
    dialog.confirm(
      'Xóa giao dịch',
      `Bạn có chắc muốn xóa giao dịch ${formatCurrency(tx.amount)}?`,
      {
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        variant: 'danger',
        onConfirm: async () => {
          await deleteTransaction(tx.id);
          loadTransactions();
        },
      },
    );
  }, [loadTransactions]);

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') {return true;}
    return tx.transactionType === filter;
  });

  const sections = React.useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filteredTransactions.forEach(tx => {
      let key = '';
      if (grouping === 'day') {
        key = dayjs(tx.timestamp).format('DD/MM/YYYY');
      } else if (grouping === 'week') {
        const start = dayjs(tx.timestamp).startOf('week');
        const end = dayjs(tx.timestamp).endOf('week');
        key = `Tuần: ${start.format('DD/MM')} - ${end.format('DD/MM/YYYY')}`;
      } else {
        key = dayjs(tx.timestamp).format('[Tháng] MM/YYYY');
      }
      if (!map.has(key)) {map.set(key, []);}
      map.get(key)!.push(tx);
    });
    return Array.from(map.entries()).map(([title, data]) => ({title, data}));
  }, [filteredTransactions, grouping]);

  useEffect(() => {
    const jump = route?.params?.fromDashboard;
    if (!jump || !jump.ts || jump.ts === lastJumpTsRef.current) {return;}

    lastJumpTsRef.current = jump.ts;
    if (jump.filter === 'income' || jump.filter === 'expense') {
      setFilter(jump.filter);
    } else {
      setFilter('all');
    }
    setGrouping('month');
    setPendingJump({year: jump.year, month: jump.month});
  }, [route?.params]);

  useEffect(() => {
    if (!pendingJump || grouping !== 'month' || sections.length === 0) {return;}
    const targetTitle = `Tháng ${String(pendingJump.month).padStart(2, '0')}/${pendingJump.year}`;
    const sectionIndex = sections.findIndex(s => s.title === targetTitle);
    if (sectionIndex >= 0) {
      requestAnimationFrame(() => {
        sectionListRef.current?.scrollToLocation({
          sectionIndex,
          itemIndex: 0,
          animated: true,
          viewOffset: 12,
        });
      });
    }
    setPendingJump(null);
  }, [pendingJump, grouping, sections]);

  const renderTransaction = ({item: tx}: {item: Transaction}) => {
    const bankConfig = SUPPORTED_BANKS[tx.bank as keyof typeof SUPPORTED_BANKS];
    const emoji = CATEGORY_ICONS[tx.category || 'other']
      ? CATEGORY_EMOJI[tx.category || 'other']
      : customCategories?.[tx.category || 'other']?.icon || '📌';

    return (
      <SwipeableRow onDelete={() => handleDelete(tx)}>
        <Pressable
          onPress={() => handleOpenEdit(tx)}
          android_ripple={{color: 'rgba(0,0,0,0.05)'}}
          style={[
            styles.txCard,
            tx.isSuspectedGap && styles.txCardSuspected,
          ]}>
          <View
          style={[
            styles.txHeader,
          ]}>
            <View style={styles.txLeft}>
              <View style={styles.txIconWrap}>
                <Text style={styles.txEmoji}>{emoji}</Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDescription} numberOfLines={1}>
                  {tx.description || 'Không có mô tả'}
                </Text>
                <View style={styles.txMeta}>
                  <Text style={[styles.txBank, bankConfig && {color: bankConfig.color}]}>
                    {bankConfig?.name || tx.bank}
                  </Text>
                  <Text style={styles.txDot}>•</Text>
                  <Text style={styles.txDate}>
                    {dayjs(tx.timestamp).format('HH:mm DD/MM/YYYY')}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={[styles.txAmount, {color: tx.transactionType === 'income' ? COLORS.income : COLORS.expense}]}>
              {tx.transactionType === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
            </Text>
          </View>

          {tx.isSuspectedGap && (
            <View style={styles.warningBadge}>
              <View style={styles.warningRow}>
                <AppIcon name="warning" size={14} color="#8a5a0e" />
                <Text style={styles.warningText}>Có thể thiếu giao dịch trước đó</Text>
              </View>
            </View>
          )}

          {tx.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{getCategoryLabel(tx.category)}</Text>
            </View>
          )}
        </Pressable>
      </SwipeableRow>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'income', 'expense'] as const).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Tất cả' : f === 'income' ? 'Thu nhập' : 'Chi tiêu'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.groupingRow}>
        {(['day', 'week', 'month'] as const).map(g => (
          <TouchableOpacity
            key={g}
            onPress={() => setGrouping(g)}
            style={[styles.groupButton, grouping === g && styles.groupButtonActive]}>
            <Text style={[styles.groupText, grouping === g && styles.groupTextActive]}>
              {g === 'day' ? 'Ngày' : g === 'week' ? 'Tuần' : 'Tháng'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        ref={sectionListRef}
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderTransaction}
        renderSectionHeader={({section: {title}}) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadTransactions} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AppIcon name="list" size={42} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>Không có giao dịch</Text>
          </View>
        }
        onScrollToIndexFailed={() => {}}
      />

      <TouchableOpacity style={styles.fab} onPress={handleOpenAdd}>
        <AppIcon name="plus" size={30} color={COLORS.onDark} />
      </TouchableOpacity>

      <AddTransactionModal
        bottomSheetRef={bottomSheetRef}
        editTransaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
      />
    </GestureHandlerRootView>
  );
};

const createStyles = (COLORS: {
  bg: string;
  card: string;
  cardBorder: string;
  primary: string;
  income: string;
  expense: string;
  text: string;
  textSecondary: string;
  accent: string;
  warning: string;
  primarySoft: string;
  muted: string;
  shadow: string;
  onDark: string;
}) => StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.bg},
  filterRow: {flexDirection: 'row', padding: 16, gap: 8},
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterButtonActive: {backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary},
  filterText: {color: COLORS.textSecondary, fontSize: 14, fontWeight: '500'},
  filterTextActive: {color: COLORS.text, fontWeight: '700'},
  groupingRow: {flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8},
  groupButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  groupButtonActive: {backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary},
  groupText: {color: COLORS.textSecondary, fontSize: 12, fontWeight: '500'},
  groupTextActive: {color: COLORS.text, fontWeight: '700'},
  listContent: {padding: 16, paddingTop: 0},
  sectionHeader: {backgroundColor: COLORS.bg, paddingVertical: 8, marginBottom: 4},
  sectionHeaderText: {color: COLORS.accent, fontSize: 14, fontWeight: '700'},
  txCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  txCardSuspected: {borderColor: COLORS.warning, borderWidth: 2},
  txHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  txLeft: {flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1},
  txIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.muted,
  },
  txEmoji: {fontSize: 24},
  txInfo: {flex: 1},
  txDescription: {color: COLORS.text, fontSize: 15, fontWeight: '500', maxWidth: width * 0.45},
  txMeta: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4},
  txBank: {fontSize: 12, fontWeight: '600'},
  txDot: {color: COLORS.textSecondary, fontSize: 12},
  txDate: {color: COLORS.textSecondary, fontSize: 12},
  txAmount: {fontSize: 16, fontWeight: '700'},
  warningBadge: {
    marginTop: 10,
    backgroundColor: '#fff3d6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  warningRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  warningText: {color: '#8a5a0e', fontSize: 12},
  categoryBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  categoryText: {color: COLORS.accent, fontSize: 12},
  emptyState: {alignItems: 'center', paddingVertical: 60},
  emptyIcon: {marginBottom: 12},
  emptyText: {color: COLORS.textSecondary, fontSize: 16},
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  fabIcon: {color: COLORS.onDark, fontSize: 32, fontWeight: '500', marginTop: -2},
});

export default TransactionsScreen;
