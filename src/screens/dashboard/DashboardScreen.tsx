import React, {useEffect, useCallback, useMemo} from 'react';
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
import {useThemeColors} from '../../shared/theme';
import AppIcon from '../../shared/components/AppIcon';
import {useNavigation} from '@react-navigation/native';
import {useRoute} from '@react-navigation/native';
import {AnimatedNumber, FadeSlideView, AnimatedPressable, AnimatedEmptyState} from '../../animations';

const {width} = Dimensions.get('window');

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
};

const DashboardScreen: React.FC = () => {
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
    hero: t.surfaceMuted,
    soft: t.primarySoft,
    textOnDark: t.textOnDark,
  }), [t]);
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
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
    categoryBudgets,
    getBudgetStatus,
    inAppNotifications,
  } = useAppStore();

  useEffect(() => {
    loadTransactions();
    loadStats();
  }, [loadTransactions, loadStats]);

  useEffect(() => {
    const incoming = route?.params?.fromNotification;
    if (!incoming?.ts || typeof incoming.year !== 'number' || typeof incoming.month !== 'number') {
      return;
    }
    setSelectedMonth(incoming.year, incoming.month);
  }, [route?.params, setSelectedMonth]);

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
  const unreadNotifications = inAppNotifications.filter(item => !item.isRead).length;
  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const budgetsInMonth = Object.values(categoryBudgets).filter(item => item.monthKey === monthKey);
  const budgetSummary = budgetsInMonth.reduce(
    (acc, item) => {
      const status = getBudgetStatus(item.categoryId, selectedYear, selectedMonth);
      acc.totalLimit += status.limit;
      acc.totalSpent += status.spent;
      if (status.isOver) {acc.overCount += 1;}
      return acc;
    },
    {totalLimit: 0, totalSpent: 0, overCount: 0},
  );

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

  const openTransactionDetailInTab = (transactionId: string) => {
    navigation.navigate('Transactions', {
      fromDashboard: {
        filter: 'all',
        year: selectedYear,
        month: selectedMonth,
        transactionId,
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
        <TouchableOpacity
          style={styles.notifyButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Notifications')}>
          <AppIcon name="bell" size={24} color={COLORS.text} />
          {unreadNotifications > 0 && (
            <View style={styles.notifyDot}>
              <Text style={styles.notifyDotText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
            </View>
          )}
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

      <FadeSlideView style={styles.balanceCard} delay={60}>
        <Text style={styles.balanceLabel}>Số dư</Text>
        <AnimatedNumber
          value={balance}
          format="currency"
          style={[
            styles.balanceAmount,
            {color: balance >= 0 ? COLORS.income : COLORS.expense},
          ]}
        />
      </FadeSlideView>

      <FadeSlideView style={styles.statsRow} delay={120}>
        <AnimatedPressable
          onPress={() => openTransactionsFor('income')}
          style={[styles.statCard, {borderLeftColor: COLORS.income}]}>
          <Text style={styles.statLabel}>Thu nhập</Text>
          <AnimatedNumber
            value={totalIncome}
            format="currency"
            prefix="+"
            style={[styles.statAmount, {color: COLORS.income}]}
          />
        </AnimatedPressable>
        <AnimatedPressable
          onPress={() => openTransactionsFor('expense')}
          style={[styles.statCard, {borderLeftColor: COLORS.expense}]}>
          <Text style={styles.statLabel}>Chi tiêu</Text>
          <AnimatedNumber
            value={totalExpense}
            format="currency"
            prefix="-"
            style={[styles.statAmount, {color: COLORS.expense}]}
          />
        </AnimatedPressable>
      </FadeSlideView>

      {budgetsInMonth.length > 0 && (
        <View style={[styles.balanceCard, {marginBottom: 24, paddingVertical: 16}]}>
          <Text style={styles.balanceLabel}>Ngân sách tháng</Text>
          <Text style={[styles.statAmount, {color: COLORS.text}]}>
            {formatCurrency(budgetSummary.totalSpent)} / {formatCurrency(budgetSummary.totalLimit)}
          </Text>
          <Text style={[styles.categoryCount, {marginTop: 6}]}>
            Danh mục vượt hạn mức: {budgetSummary.overCount}
          </Text>
        </View>
      )}

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
            const budgetStatus = getBudgetStatus(stat.category, selectedYear, selectedMonth);
            const isOverBudget = budgetStatus.exists && budgetStatus.isOver;

            return (
              <View key={stat.category || index} style={[styles.categoryItem, isOverBudget && styles.categoryItemOver]}>
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
                  {isOverBudget && (
                    <View style={styles.overBadge}>
                      <AppIcon name="warning" size={12} color={COLORS.expense} />
                      <Text style={styles.overBadgeText}>Vượt</Text>
                    </View>
                  )}
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
          <AnimatedEmptyState
            icon="📥"
            title="Chưa có giao dịch nào"
            subtitle="Giao dịch sẽ tự động hiển thị khi bạn nhận được notification ngân hàng"
            titleStyle={{color: COLORS.text}}
            subtitleStyle={{color: COLORS.textSecondary}}
          />
        ) : (
          recentTransactions.map(tx => (
            <TouchableOpacity
              key={tx.id}
              activeOpacity={0.88}
              onPress={() => openTransactionDetailInTab(tx.id)}
              style={styles.transactionItem}>
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
                    {tx.description?.trim() || getCategoryLabel(tx.category || 'other')}
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
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
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
  hero: string;
  soft: string;
  textOnDark: string;
}) => StyleSheet.create({
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
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyDotText: {
    color: COLORS.textOnDark,
    fontSize: 9,
    fontWeight: '700',
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
    backgroundColor: COLORS.soft,
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
  categoryItemOver: {
    borderColor: '#f4c7bd',
    backgroundColor: '#fff4f1',
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
    backgroundColor: COLORS.soft,
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
  overBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fde7e3',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  overBadgeText: {
    color: COLORS.expense,
    fontSize: 11,
    fontWeight: '700',
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
    backgroundColor: COLORS.soft,
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
