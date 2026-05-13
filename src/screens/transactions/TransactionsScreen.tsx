import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import {useAppStore} from '../../app/store';
import {CATEGORY_ICONS, SUPPORTED_BANKS} from '../../shared/constants';
import type {Transaction} from '../../shared/types';
import {deleteTransaction, updateTransactionCategory} from '../../database';
import dayjs from 'dayjs';
import AddTransactionModal from './AddTransactionModal';

const {width} = Dimensions.get('window');

const COLORS = {
  bg: '#0f0f1a',
  card: '#1a1a2e',
  cardBorder: '#2a2a4a',
  primary: '#6c5ce7',
  income: '#00b894',
  expense: '#e17055',
  text: '#ffffff',
  textSecondary: '#a0a0b8',
  accent: '#a29bfe',
  warning: '#fdcb6e',
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
};

const TransactionsScreen: React.FC = () => {
  const {transactions, isLoading, loadTransactions} = useAppStore();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [grouping, setGrouping] = useState<'day' | 'week' | 'month'>('day');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  useEffect(() => {
    loadTransactions();
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
      } else if (grouping === 'month') {
        key = dayjs(tx.timestamp).format('Tháng MM/YYYY');
      }

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(tx);
    });

    return Array.from(map.entries()).map(([title, data]) => ({
      title,
      data,
    }));
  }, [filteredTransactions, grouping]);

  const handleDelete = (tx: Transaction) => {
    Alert.alert(
      'Xóa giao dịch',
      `Bạn có chắc muốn xóa giao dịch ${formatCurrency(tx.amount)}?`,
      [
        {text: 'Hủy', style: 'cancel'},
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(tx.id);
            loadTransactions();
          },
        },
      ],
    );
  };

  const renderTransaction = ({item: tx}: {item: Transaction}) => {
    const bankConfig =
      SUPPORTED_BANKS[tx.bank as keyof typeof SUPPORTED_BANKS];
    const icon =
      CATEGORY_ICONS[tx.category || 'other'] || CATEGORY_ICONS.other;

    return (
      <TouchableOpacity
        onLongPress={() => handleDelete(tx)}
        style={[
          styles.txCard,
          tx.isSuspectedGap && styles.txCardSuspected,
        ]}>
        <View style={styles.txHeader}>
          <View style={styles.txLeft}>
            <Text style={styles.txIcon}>{icon}</Text>
            <View style={styles.txInfo}>
              <Text style={styles.txDescription} numberOfLines={1}>
                {tx.description || 'Không có mô tả'}
              </Text>
              <View style={styles.txMeta}>
                <Text
                  style={[
                    styles.txBank,
                    bankConfig && {color: bankConfig.color},
                  ]}>
                  {bankConfig?.name || tx.bank}
                </Text>
                <Text style={styles.txDot}>•</Text>
                <Text style={styles.txDate}>
                  {dayjs(tx.timestamp).format('HH:mm DD/MM/YYYY')}
                </Text>
              </View>
            </View>
          </View>
          <Text
            style={[
              styles.txAmount,
              {
                color:
                  tx.transactionType === 'income'
                    ? COLORS.income
                    : COLORS.expense,
              },
            ]}>
            {tx.transactionType === 'income' ? '+' : '-'}
            {formatCurrency(tx.amount)}
          </Text>
        </View>

        {tx.isSuspectedGap && (
          <View style={styles.warningBadge}>
            <Text style={styles.warningText}>
              ⚠️ Có thể thiếu giao dịch trước đó
            </Text>
          </View>
        )}

        {tx.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{tx.category}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'income', 'expense'] as const).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterButton,
              filter === f && styles.filterButtonActive,
            ]}>
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}>
              {f === 'all'
                ? 'Tất cả'
                : f === 'income'
                ? 'Thu nhập'
                : 'Chi tiêu'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.groupingRow}>
        {(['day', 'week', 'month'] as const).map(g => (
          <TouchableOpacity
            key={g}
            onPress={() => setGrouping(g)}
            style={[
              styles.groupButton,
              grouping === g && styles.groupButtonActive,
            ]}>
            <Text
              style={[
                styles.groupText,
                grouping === g && styles.groupTextActive,
              ]}>
              {g === 'day' ? 'Ngày' : g === 'week' ? 'Tuần' : 'Tháng'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderTransaction}
        renderSectionHeader={({section: {title}}) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadTransactions}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Không có giao dịch</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsAddModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <AddTransactionModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  filterRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.text,
  },
  groupingRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  groupButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  groupButtonActive: {
    backgroundColor: '#3a3a5a',
    borderColor: '#4a4a6a',
  },
  groupText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  groupTextActive: {
    color: COLORS.text,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    backgroundColor: COLORS.bg,
    paddingVertical: 8,
    marginBottom: 8,
  },
  sectionHeaderText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  txCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  txCardSuspected: {
    borderColor: COLORS.warning,
    borderWidth: 2,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txIcon: {
    fontSize: 28,
  },
  txInfo: {
    flex: 1,
  },
  txDescription: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
    maxWidth: width * 0.45,
  },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  txBank: {
    fontSize: 12,
    fontWeight: '600',
  },
  txDot: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  txDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  warningBadge: {
    marginTop: 10,
    backgroundColor: '#3d3520',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  warningText: {
    color: COLORS.warning,
    fontSize: 12,
  },
  categoryBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a4a',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  categoryText: {
    color: COLORS.accent,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabIcon: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
});

export default TransactionsScreen;
