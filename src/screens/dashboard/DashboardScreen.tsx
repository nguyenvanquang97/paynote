import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import {useAppStore} from '../../app/store';
import {CATEGORY_ICONS, CATEGORY_EMOJI, getCategoryLabel} from '../../shared/constants';
import dayjs from 'dayjs';
import {theme} from '../../shared/theme';
import AppIcon from '../../shared/components/AppIcon';
import {useNavigation} from '@react-navigation/native';

const {width} = Dimensions.get('window');

const COLORS = {
  bg: theme.colors.appBg,
  card: theme.colors.surface,
  cardBorder: theme.colors.border,
  primary: theme.colors.primary,
  income: theme.colors.income,
  expense: theme.colors.expense,
  text: theme.colors.textPrimary,
  textSecondary: theme.colors.textSecondary,
  accent: theme.colors.primaryDeep,
  hero: '#ffffff',
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
};

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
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
    profile,
    customCategories,
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

  const goToCurrentMonth = () => {
    setSelectedMonth(dayjs().year(), dayjs().month() + 1);
  };

  const isCurrentMonth = selectedYear === dayjs().year() && selectedMonth === dayjs().month() + 1;

  const recentTransactions = transactions.slice(0, 5);

  const openTransactionsFor = (nextFilter: 'income' | 'expense') => {
    navigation.navigate('Transactions', {
      fromDashboard: {
        filter: nextFilter,
        year: selectedYear,
        month: selectedMonth,
        ts: Date.now(),
      },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }>
      <View style={styles.topBar}>
        <View style={styles.userBlock}>
          <View style={styles.avatarWrap}>
            {profile.avatarUrl ? (
              <Image source={{uri: profile.avatarUrl}} style={styles.avatarImage} />
            ) : (
              <AppIcon name="user" size={24} color={COLORS.accent} />
            )}
          </View>
          <Text style={styles.greeting} numberOfLines={1}>Hi, {profile.name}</Text>
        </View>
        <TouchableOpacity style={styles.notifyButton} activeOpacity={0.85}>
          <AppIcon name="bell" size={24} color={COLORS.text} />
          <View style={styles.notifyDot} />
        </TouchableOpacity>
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.monthButton}>
          <AppIcon name="chevron-left" size={18} color={COLORS.accent} />
        </TouchableOpacity>
        <View style={styles.monthLabelContainer}>
          <Text style={styles.monthLabel}>{currentMonthLabel}</Text>
          {!isCurrentMonth && (
            <TouchableOpacity onPress={goToCurrentMonth} style={styles.todayButton}>
              <AppIcon name="undo" size={15} color={COLORS.accent} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
          <AppIcon name="chevron-right" size={18} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

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

      <View style={styles.statsRow}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => openTransactionsFor('income')}
          style={[styles.statCard, {borderLeftColor: COLORS.income}]}>
          <Text style={styles.statLabel}>Thu nhập</Text>
          <Text style={[styles.statAmount, {color: COLORS.income}]}>
            +{formatCurrency(totalIncome)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => openTransactionsFor('expense')}
          style={[styles.statCard, {borderLeftColor: COLORS.expense}]}>
          <Text style={styles.statLabel}>Chi tiêu</Text>
          <Text style={[styles.statAmount, {color: COLORS.expense}]}>
            -{formatCurrency(totalExpense)}
          </Text>
        </TouchableOpacity>
      </View>

      {categoryStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiêu theo danh mục</Text>
          {categoryStats.map((stat, index) => {
            const percentage =
              totalExpense > 0
                ? ((stat.total / totalExpense) * 100).toFixed(1)
                : '0';
            const emoji = CATEGORY_ICONS[stat.category]
              ? CATEGORY_EMOJI[stat.category]
              : customCategories?.[stat.category]?.icon || '📌';

            return (
              <View key={stat.category || index} style={styles.categoryItem}>
                <View style={styles.categoryLeft}>
                  <View style={styles.categoryIconWrap}>
                    <Text style={styles.categoryEmoji}>{emoji}</Text>
                  </View>
                  <View>
                    <Text style={styles.categoryName}>{getCategoryLabel(stat.category)}</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <AppIcon name="inbox" size={44} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
            <Text style={styles.emptySubtext}>
              Giao dịch sẽ tự động hiển thị khi bạn nhận được notification ngân hàng
            </Text>
          </View>
        ) : (
          recentTransactions.map(tx => (
            <View key={tx.id} style={styles.transactionItem}>
              <View style={styles.txLeft}>
                <View style={styles.txIconWrap}>
                  <Text style={styles.txEmoji}>
                    {CATEGORY_ICONS[tx.category || 'other']
                      ? CATEGORY_EMOJI[tx.category || 'other']
                      : customCategories?.[tx.category || 'other']?.icon || '📌'}
                  </Text>
                </View>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  userBlock: {flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12},
  avatarWrap: {
    width:50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  avatarImage: {width: 50, height: 50, borderRadius: 25},
  avatarFallback: {fontSize: 22},
  greeting: {color: COLORS.text, fontSize: 16, fontWeight: '700'},
  notifyButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifyIcon: {fontSize: 18},
  notifyDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  monthButtonText: {color: COLORS.accent, fontSize: 16},
  monthLabel: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '700',
    minWidth: 160,
    textAlign: 'center',
  },
  monthLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
    gap: 8,
  },
  todayButton: {
    padding: 6,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  balanceCard: {
    backgroundColor: COLORS.hero,
    borderRadius: 28,
    padding: 24,
    alignItems: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  balanceLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  balanceAmount: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '600',
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 18,
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
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmoji: {fontSize: 22},
  categoryName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
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
    fontSize: 15,
    fontWeight: '700',
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
    borderRadius: 18,
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
  txIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txEmoji: {fontSize: 22},
  txDescription: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    maxWidth: width * 0.4,
  },
  txDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.card,
    borderRadius: 22,
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
