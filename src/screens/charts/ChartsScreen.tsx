import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {PieChart, BarChart} from 'react-native-gifted-charts';
import {useAppStore} from '../../app/store';
import {getTransactionsByDateRange} from '../../database';
import dayjs from 'dayjs';
import {CATEGORY_ICONS, getCategoryLabel} from '../../shared/constants';
import {theme} from '../../shared/theme';
import AppIcon, {categoryIconName} from '../../shared/components/AppIcon';

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
  surfaceMuted: theme.colors.surfaceMuted,
};

const CHART_COLORS = [
  '#65d75f', '#2fb34e', '#e76452', '#f0ae3e', '#57a2e8',
  '#7ebd5a', '#87dca8', '#f08fb1', '#f2c09c', '#6fc4f9',
  '#81ecec', '#dfe6e9',
];

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';

const formatCurrencyShort = (amount: number): string => {
  if (amount >= 1_000_000) {return (amount / 1_000_000).toFixed(1) + 'M';}
  if (amount >= 1_000) {return (amount / 1_000).toFixed(0) + 'K';}
  return String(amount);
};

const ChartsScreen: React.FC = () => {
  const {
    categoryStats,
    totalIncome,
    totalExpense,
    selectedYear,
    selectedMonth,
    isLoading,
    loadStats,
    setSelectedMonth,
  } = useAppStore();

  const [monthlyData, setMonthlyData] = useState<
    Array<{month: string; income: number; expense: number}>
  >([]);

  const fetchMonthlyData = useCallback(async () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = dayjs().subtract(i, 'month');
      const startDate = d.startOf('month').valueOf();
      const endDate = d.endOf('month').valueOf();

      try {
        const txs = await getTransactionsByDateRange(startDate, endDate);
        const income = txs
          .filter(t => t.transactionType === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = txs
          .filter(t => t.transactionType === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        months.push({
          month: d.format('MM/YY'),
          income,
          expense,
        });
      } catch (e) {
        months.push({month: d.format('MM/YY'), income: 0, expense: 0});
      }
    }
    setMonthlyData(months);
  }, []);

  useEffect(() => {
    loadStats();
    fetchMonthlyData();
  }, [loadStats, fetchMonthlyData, selectedYear, selectedMonth]);

  const onRefresh = useCallback(() => {
    loadStats();
    fetchMonthlyData();
  }, [loadStats, fetchMonthlyData]);

  const goToPrevMonth = () => {
    if (selectedMonth === 1) {setSelectedMonth(selectedYear - 1, 12);}
    else {setSelectedMonth(selectedYear, selectedMonth - 1);}
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {setSelectedMonth(selectedYear + 1, 1);}
    else {setSelectedMonth(selectedYear, selectedMonth + 1);}
  };

  const currentMonthLabel = dayjs()
    .year(selectedYear)
    .month(selectedMonth - 1)
    .format('MMMM YYYY');

  // Pie chart data from category stats
  const pieData = categoryStats
    .filter(s => s.total > 0)
    .slice(0, 10)
    .map((stat, i) => ({
      value: stat.total,
      color: CHART_COLORS[i % CHART_COLORS.length],
      categoryId: stat.category,
      label: getCategoryLabel(stat.category),
      text: `${((stat.total / totalExpense) * 100).toFixed(1)}%`,
    }));

  // Bar chart data for 6 months
  const barData: any[] = [];
  monthlyData.forEach((m, i) => {
    barData.push({
      value: m.income,
      label: m.month,
      frontColor: COLORS.income,
      spacing: 4,
    });
    barData.push({
      value: m.expense,
      frontColor: COLORS.expense,
      spacing: i < monthlyData.length - 1 ? 16 : 4,
    });
  });

  const maxBarValue = Math.max(
    ...monthlyData.map(m => Math.max(m.income, m.expense)),
    1,
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.monthButton}>
          <AppIcon name="chevron-left" size={18} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{currentMonthLabel}</Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
          <AppIcon name="chevron-right" size={18} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
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

      {/* Pie Chart - Category breakdown */}
      {pieData.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiêu theo danh mục</Text>
          <View style={styles.chartCard}>
            <View style={styles.pieContainer}>
              <PieChart
                data={pieData}
                donut
                innerRadius={70}
                radius={100}
                centerLabelComponent={() => (
                  <View style={styles.pieCenter}>
                    <Text style={styles.pieCenterLabel}>Tổng</Text>
                    <Text style={styles.pieCenterAmount}>
                      {formatCurrencyShort(totalExpense)}
                    </Text>
                  </View>
                )}
                showText={false}
              />
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              {pieData.map((item, i) => (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.legendDot, {backgroundColor: item.color}]} />
                  <Text style={styles.legendLabel} numberOfLines={1}>
                    <AppIcon name={categoryIconName(item.categoryId)} size={14} color={COLORS.accent} /> {item.label}
                  </Text>
                  <Text style={styles.legendPercent}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptySection}>
          <Text style={styles.emptyIcon}>🍩</Text>
          <Text style={styles.emptyText}>Chưa có dữ liệu chi tiêu tháng này</Text>
        </View>
      )}

      {/* Bar Chart - 6 months income vs expense */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thu nhập vs Chi tiêu (6 tháng)</Text>
        <View style={styles.chartCard}>
          <View style={styles.barLegendRow}>
            <View style={styles.barLegendItem}>
              <View style={[styles.legendDot, {backgroundColor: COLORS.income}]} />
              <Text style={styles.legendLabel}>Thu nhập</Text>
            </View>
            <View style={styles.barLegendItem}>
              <View style={[styles.legendDot, {backgroundColor: COLORS.expense}]} />
              <Text style={styles.legendLabel}>Chi tiêu</Text>
            </View>
          </View>
          {monthlyData.some(m => m.income > 0 || m.expense > 0) ? (
            <BarChart
              data={barData}
              barWidth={22}
              spacing={4}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={1}
              yAxisThickness={0}
              xAxisColor={COLORS.cardBorder}
              yAxisTextStyle={{color: COLORS.textSecondary, fontSize: 10}}
              xAxisLabelTextStyle={{color: COLORS.textSecondary, fontSize: 10}}
              noOfSections={4}
              maxValue={maxBarValue * 1.2}
              width={width - 80}
              formatYLabel={(label: string) => formatCurrencyShort(Number(label))}
              barBorderRadius={6}
            />
          ) : (
            <View style={styles.emptyBar}>
              <Text style={styles.emptyText}>Chưa có giao dịch trong 6 tháng qua</Text>
            </View>
          )}
        </View>
      </View>

      {/* Top Expenses List */}
      {categoryStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết theo danh mục</Text>
          {categoryStats.map((stat, i) => {
            const percentage = totalExpense > 0
              ? ((stat.total / totalExpense) * 100).toFixed(1)
              : '0';
            const color = CHART_COLORS[i % CHART_COLORS.length];
            const icon = categoryIconName(CATEGORY_ICONS[stat.category] ? stat.category : 'other');
            const barWidth = totalExpense > 0
              ? (stat.total / totalExpense) * (width - 80)
              : 0;

            return (
              <View key={stat.category} style={styles.statRow}>
                <View style={styles.statRowHeader}>
                  <View style={styles.statRowLeft}>
                    <AppIcon name={icon} size={16} color={COLORS.accent} />
                    <Text style={styles.statName}>{getCategoryLabel(stat.category)}</Text>
                    <Text style={styles.statCount}>{stat.count} GD</Text>
                  </View>
                  <View style={styles.statRowRight}>
                    <Text style={[styles.statRowAmount, {color: COLORS.expense}]}>
                      {formatCurrency(stat.total)}
                    </Text>
                    <Text style={styles.statRowPercent}>{percentage}%</Text>
                  </View>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBar, {width: barWidth, backgroundColor: color}]} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.bg},
  content: {padding: 16, paddingBottom: 40},
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  monthButton: {padding: 12, backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.cardBorder},
  monthButtonText: {color: COLORS.accent, fontSize: 16},
  monthLabel: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    minWidth: 160,
    textAlign: 'center',
  },
  statsRow: {flexDirection: 'row', gap: 12, marginBottom: 20},
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statLabel: {color: COLORS.textSecondary, fontSize: 12, marginBottom: 4},
  statAmount: {fontSize: 15, fontWeight: '600'},
  section: {marginBottom: 20},
  sectionTitle: {color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: 12},
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  pieContainer: {alignItems: 'center', marginBottom: 16},
  pieCenter: {alignItems: 'center'},
  pieCenterLabel: {color: COLORS.textSecondary, fontSize: 12},
  pieCenterAmount: {color: COLORS.text, fontSize: 16, fontWeight: '700'},
  legend: {gap: 8},
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {width: 10, height: 10, borderRadius: 5},
  legendLabel: {color: COLORS.text, fontSize: 13, flex: 1},
  legendPercent: {color: COLORS.textSecondary, fontSize: 13, fontWeight: '600'},
  barLegendRow: {flexDirection: 'row', gap: 16, marginBottom: 12},
  barLegendItem: {flexDirection: 'row', alignItems: 'center', gap: 6},
  emptySection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyBar: {alignItems: 'center', paddingVertical: 24},
  emptyIcon: {fontSize: 40, marginBottom: 8},
  emptyText: {color: COLORS.textSecondary, fontSize: 14, textAlign: 'center'},
  statRow: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statRowHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8},
  statRowLeft: {flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1},
  statIcon: {fontSize: 20},
  statName: {color: COLORS.text, fontSize: 14, fontWeight: '500'},
  statCount: {color: COLORS.textSecondary, fontSize: 12},
  statRowRight: {alignItems: 'flex-end'},
  statRowAmount: {fontSize: 14, fontWeight: '600'},
  statRowPercent: {color: COLORS.textSecondary, fontSize: 12},
  progressBarBg: {
    height: 4,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {height: 4, borderRadius: 2},
});

export default ChartsScreen;
