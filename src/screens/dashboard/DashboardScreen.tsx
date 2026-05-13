import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {useAppStore} from '../../app/store';
import {CATEGORY_ICONS} from '../../shared/constants';
import dayjs from 'dayjs';

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
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
};

const DashboardScreen: React.FC = () => {
  const {
    transactions,
    totalIncome,
    totalExpense,
    categoryStats,
    selectedYear,
    selectedMonth,
    isLoading,
    loadTransactions,
    loadStats,
    setSelectedMonth,
  } = useAppStore();

  useEffect(() => {
    loadTransactions();
    loadStats();
  }, [loadTransactions, loadStats]);

  const onRefresh = useCallback(() => {
    loadTransactions();
    loadStats();
  }, [loadTransactions, loadStats]);

  const balance = totalIncome - totalExpense;

  const currentMonthLabel = dayjs()
    .year(selectedYear)
    .month(selectedMonth - 1)
    .format('MMMM YYYY');

  const goToPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(selectedYear - 1, 12);
    } else {
      setSelectedMonth(selectedYear, selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(selectedYear + 1, 1);
    } else {
      setSelectedMonth(selectedYear, selectedMonth + 1);
    }
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }>
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{currentMonthLabel}</Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Số dư</Text>
        <Text
          style={[
            styles.balanceAmount,
            {color: balance >= 0 ? COLORS.income : COLORS.expense},
          ]}>
          {formatCurrency(balance)}
        </Text>
      </View>

      {/* Income / Expense Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, {borderLeftColor: COLORS.income}]}>
          <Text style={styles.statLabel}>Thu nhập</Text>
          <Text style={[styles.statAmount, {color: COLORS.income}]}>
            +{formatCurrency(totalIncome)}
          </Text>
        </View>
        <View style={[styles.statCard, {borderLeftColor: COLORS.expense}]}>
          <Text style={styles.statLabel}>Chi tiêu</Text>
          <Text style={[styles.statAmount, {color: COLORS.expense}]}>
            -{formatCurrency(totalExpense)}
          </Text>
        </View>
      </View>

      {/* Category Breakdown */}
      {categoryStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiêu theo danh mục</Text>
          {categoryStats.map((stat, index) => {
            const percentage =
              totalExpense > 0
                ? ((stat.total / totalExpense) * 100).toFixed(1)
                : '0';
            const icon =
              CATEGORY_ICONS[stat.category] || CATEGORY_ICONS.other;

            return (
              <View key={stat.category || index} style={styles.categoryItem}>
                <View style={styles.categoryLeft}>
                  <Text style={styles.categoryIcon}>{icon}</Text>
                  <View>
                    <Text style={styles.categoryName}>{stat.category}</Text>
                    <Text style={styles.categoryCount}>
                      {stat.count} giao dịch
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryRight}>
                  <Text style={styles.categoryAmount}>
                    {formatCurrency(stat.total)}
                  </Text>
                  <Text style={styles.categoryPercentage}>{percentage}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
            <Text style={styles.emptySubtext}>
              Giao dịch sẽ tự động hiển thị khi bạn nhận được notification ngân
              hàng
            </Text>
          </View>
        ) : (
          recentTransactions.map(tx => (
            <View key={tx.id} style={styles.transactionItem}>
              <View style={styles.txLeft}>
                <Text style={styles.txIcon}>
                  {CATEGORY_ICONS[tx.category || 'other'] ||
                    CATEGORY_ICONS.other}
                </Text>
                <View>
                  <Text style={styles.txDescription} numberOfLines={1}>
                    {tx.description || tx.bank}
                  </Text>
                  <Text style={styles.txDate}>
                    {dayjs(tx.timestamp).format('HH:mm DD/MM')}
                  </Text>
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
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  monthButton: {
    padding: 12,
    backgroundColor: COLORS.card,
    borderRadius: 12,
  },
  monthButtonText: {
    color: COLORS.accent,
    fontSize: 16,
  },
  monthLabel: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    minWidth: 160,
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  balanceLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  categoryCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    color: COLORS.expense,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryPercentage: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txIcon: {
    fontSize: 24,
  },
  txDescription: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    maxWidth: width * 0.4,
  },
  txDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default DashboardScreen;
