import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {PieChart, BarChart} from 'react-native-gifted-charts';
import {useAppStore} from '../../app/store';
import {getTransactionsByDateRange} from '../../database';
import dayjs from 'dayjs';
import {CATEGORY_ICONS, CATEGORY_EMOJI, getCategoryLabel} from '../../shared/constants';
import {useThemeColors} from '../../shared/theme';
import AppIcon from '../../shared/components/AppIcon';
import {
  AnimatedNumber,
  FadeSlideView,
  ChartAnimationDelay,
  ChartAnimationDuration,
  shouldReduceMotion,
} from '../../animations';

const {width} = Dimensions.get('window');

type ChartPhase = 'loading' | 'settling' | 'ready';

const BAR_CHART_CARD_HEIGHT = 300;
const PIE_CHART_CARD_HEIGHT = 390;
const BUDGET_CARD_HEIGHT = 108;
const DETAIL_ROW_HEIGHT = 78;
const DETAIL_SKELETON_ROWS = 5;

const CHART_COLORS = [
  '#e76452', '#f0ae3e', '#57a2e8', '#f08fb1', '#9b59b6',
  '#e67e22', '#34495e', '#e84393', '#fd79a8', '#6c5ce7',
  '#00cec9', '#fab1a0',
];

const formatCurrency = (amount: number): string =>
  `${new Intl.NumberFormat('vi-VN').format(amount)} ₫`;

const formatCurrencyShort = (amount: number): string => {
  if (amount >= 1_000_000) {return `${(amount / 1_000_000).toFixed(1)}M`;}
  if (amount >= 1_000) {return `${(amount / 1_000).toFixed(0)}K`;}
  return String(amount);
};

const hashChartDataset = (
  monthlyData: Array<{month: string; income: number; expense: number}>,
  categoryStats: Array<{category: string; total: number; count: number}>,
  totalIncome: number,
  totalExpense: number,
): string => {
  const months = monthlyData.map(m => `${m.month}:${m.income}:${m.expense}`).join('|');
  const cats = categoryStats.map(c => `${c.category}:${c.total}:${c.count}`).join('|');
  return `${months}__${cats}__${totalIncome}__${totalExpense}`;
};

const ChartSkeletonCard: React.FC<{styles: any; height?: number}> = ({styles, height}) => (
  <View style={[styles.chartCard, height ? {height} : null]}>
    <View style={styles.skeletonLineLg} />
    <View style={styles.skeletonLineMd} />
    <View style={styles.skeletonBlock} />
  </View>
);

const SummarySkeletonCard: React.FC<{styles: any; borderLeftColor: string}> = ({styles, borderLeftColor}) => (
  <View style={[styles.statCard, {borderLeftColor}]}>
    <View style={styles.skeletonLineSm} />
    <View style={styles.skeletonAmountLine} />
  </View>
);

const DetailSkeletonRows: React.FC<{styles: any}> = ({styles}) => (
  <>
    {Array.from({length: DETAIL_SKELETON_ROWS}).map((_, idx) => (
      <View key={`detail_skeleton_${idx}`} style={styles.statRow}>
        <View style={styles.statRowHeader}>
          <View style={styles.skeletonDetailLeft} />
          <View style={styles.skeletonDetailRight} />
        </View>
        <View style={styles.skeletonProgressLine} />
      </View>
    ))}
  </>
);

const ProgressBarAnimated: React.FC<{
  ratio: number;
  color: string;
  duration: number;
}> = ({ratio, color, duration}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(1, ratio)), {duration});
  }, [duration, progress, ratio]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{scaleX: progress.value}],
  }));

  return (
    <View style={stylesGlobal.progressBarBg}>
      <Animated.View
        style={[
          stylesGlobal.progressBarFill,
          {backgroundColor: color},
          barStyle,
        ]}
      />
    </View>
  );
};

const OverBudgetBadgeAnimated: React.FC<{
  visible: boolean;
  color: string;
}> = ({visible, color}) => {
  const scale = useSharedValue(visible ? 1 : 0.9);
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {duration: 220});
    scale.value = withTiming(visible ? 1 : 0.9, {duration: 220});
  }, [opacity, scale, visible]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{scale: scale.value}],
  }));

  if (!visible) {return null;}

  return (
    <Animated.View style={style}>
      <View style={stylesGlobal.overBadge}>
        <AppIcon name="warning" size={12} color={color} />
        <Text style={[stylesGlobal.overBadgeText, {color}]}>Vượt</Text>
      </View>
    </Animated.View>
  );
};

const ChartsScreen: React.FC = () => {
  const t = useThemeColors();
  const reduceMotion = shouldReduceMotion();
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
    surfaceMuted: t.surfaceMuted,
    soft: t.primarySoft,
  }), [t]);
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const {
    categoryStats,
    totalIncome,
    totalExpense,
    selectedYear,
    selectedMonth,
    isLoading,
    loadStats,
    setSelectedMonth,
    customCategories,
    categoryBudgets,
    getBudgetStatus,
  } = useAppStore();

  const [monthlyData, setMonthlyData] = useState<Array<{month: string; income: number; expense: number}>>([]);
  const [chartPhase, setChartPhase] = useState<ChartPhase>('loading');
  const [transitionKey, setTransitionKey] = useState(0);
  const [shouldAnimateCharts, setShouldAnimateCharts] = useState(!reduceMotion);
  const [showBarChart, setShowBarChart] = useState(false);
  const [displayMaxBarValue, setDisplayMaxBarValue] = useState(1);

  const lastStableDatasetHash = useRef('');

  const fetchMonthlyData = useCallback(async () => {
    const months = [];
    for (let i = 2; i >= -2; i--) {
      const d = dayjs().subtract(i, 'month');
      const startDate = d.startOf('month').valueOf();
      const endDate = d.endOf('month').valueOf();

      try {
        const txs = await getTransactionsByDateRange(startDate, endDate);
        const income = txs
          .filter(tx => tx.transactionType === 'income')
          .reduce((sum, tx) => sum + tx.amount, 0);
        const expense = txs
          .filter(tx => tx.transactionType === 'expense')
          .reduce((sum, tx) => sum + tx.amount, 0);

        months.push({month: d.format('[Th] M'), income, expense});
      } catch {
        months.push({month: d.format('[Th] M'), income: 0, expense: 0});
      }
    }
    setMonthlyData(months);
  }, []);

  const loadChartData = useCallback(async () => {
    setChartPhase('loading');
    await Promise.all([
      loadStats(),
      fetchMonthlyData(),
    ]);
  }, [fetchMonthlyData, loadStats]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData, selectedYear, selectedMonth]);

  const onRefresh = useCallback(() => {
    loadChartData();
  }, [loadChartData]);

  useEffect(() => {
    if (isLoading) {
      setChartPhase('loading');
      return;
    }

    const hash = hashChartDataset(monthlyData, categoryStats, totalIncome, totalExpense);
    if (!hash || hash === lastStableDatasetHash.current) {
      setChartPhase('ready');
      setShowBarChart(true);
      return;
    }

    setTransitionKey(prev => prev + 1);
    setShouldAnimateCharts(!reduceMotion);
    setChartPhase('settling');
    setShowBarChart(false);

    const barTimer = setTimeout(() => {
      setShowBarChart(true);
    }, ChartAnimationDelay.barRender);

    const readyTimer = setTimeout(() => {
      setChartPhase('ready');
    }, ChartAnimationDuration.pie + ChartAnimationDuration.settle);

    lastStableDatasetHash.current = hash;

    return () => {
      clearTimeout(barTimer);
      clearTimeout(readyTimer);
    };
  }, [categoryStats, isLoading, monthlyData, reduceMotion, totalExpense, totalIncome]);

  const goToPrevMonth = () => {
    setChartPhase('loading');
    if (selectedMonth === 1) {setSelectedMonth(selectedYear - 1, 12);} else {setSelectedMonth(selectedYear, selectedMonth - 1);}
  };

  const goToNextMonth = () => {
    setChartPhase('loading');
    if (selectedMonth === 12) {setSelectedMonth(selectedYear + 1, 1);} else {setSelectedMonth(selectedYear, selectedMonth + 1);}
  };

  const goToCurrentMonth = () => {
    setChartPhase('loading');
    setSelectedMonth(dayjs().year(), dayjs().month() + 1);
  };

  const isCurrentMonth = selectedYear === dayjs().year() && selectedMonth === dayjs().month() + 1;
  const isChartLoading = chartPhase === 'loading';

  const currentMonthLabel = dayjs()
    .year(selectedYear)
    .month(selectedMonth - 1)
    .format('MMMM YYYY');

  const pieData = useMemo(
    () => categoryStats
      .filter(s => s.total > 0)
      .slice(0, 10)
      .map((stat, i) => ({
        value: stat.total,
        color: CHART_COLORS[i % CHART_COLORS.length],
        categoryId: stat.category,
        emoji: CATEGORY_ICONS[stat.category]
          ? CATEGORY_EMOJI[stat.category]
          : customCategories?.[stat.category]?.icon || '📌',
        label: getCategoryLabel(stat.category),
        text: `${((stat.total / Math.max(totalExpense, 1)) * 100).toFixed(1)}%`,
      })),
    [categoryStats, customCategories, totalExpense],
  );

  const barData = useMemo(() => {
    const bars: any[] = [];
    monthlyData.forEach((m, i) => {
      bars.push({
        value: m.income,
        label: m.month,
        frontColor: COLORS.income,
        spacing: 4,
      });
      bars.push({
        value: m.expense,
        frontColor: COLORS.expense,
        spacing: i < monthlyData.length - 1 ? 16 : 4,
      });
    });
    return bars;
  }, [COLORS.expense, COLORS.income, monthlyData]);

  const maxBarValue = useMemo(
    () => Math.max(...monthlyData.map(m => Math.max(m.income, m.expense)), 1),
    [monthlyData],
  );

  useEffect(() => {
    const target = maxBarValue * 1.2;
    const from = displayMaxBarValue;
    const start = Date.now();
    const duration = ChartAnimationDuration.bar;

    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayMaxBarValue(from + (target - from) * eased);
      if (p < 1) {requestAnimationFrame(tick);}
    };

    requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxBarValue]);

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}>
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

      <FadeSlideView style={styles.statsRow} delay={60}>
        {isChartLoading ? (
          <>
            <SummarySkeletonCard styles={styles} borderLeftColor={COLORS.income} />
            <SummarySkeletonCard styles={styles} borderLeftColor={COLORS.expense} />
          </>
        ) : (
          <>
            <View style={[styles.statCard, {borderLeftColor: COLORS.income}]}> 
              <Text style={styles.statLabel}>Thu nhập</Text>
              <AnimatedNumber
                value={totalIncome}
                format="currency"
                prefix="+"
                style={[styles.statAmount, {color: COLORS.income}]}
              />
            </View>
            <View style={[styles.statCard, {borderLeftColor: COLORS.expense}]}> 
              <Text style={styles.statLabel}>Chi tiêu</Text>
              <AnimatedNumber
                value={totalExpense}
                format="currency"
                prefix="-"
                style={[styles.statAmount, {color: COLORS.expense}]}
              />
            </View>
          </>
        )}
      </FadeSlideView>

      <View style={styles.budgetSection}>
        <View style={[styles.chartCard, styles.budgetCard]}> 
          {isChartLoading ? (
            <>
              <View style={styles.skeletonLineLg} />
              <View style={styles.skeletonLineMd} />
              <View style={styles.skeletonLineSm} />
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Ngân sách tháng</Text>
              {budgetsInMonth.length > 0 ? (
                <>
                  <Text style={styles.legendLabel}>
                    {formatCurrency(budgetSummary.totalSpent)} / {formatCurrency(budgetSummary.totalLimit)}
                  </Text>
                  <Text style={styles.legendPercent}>Danh mục vượt: {budgetSummary.overCount}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.legendLabel}>Chưa đặt ngân sách tháng này</Text>
                  <Text style={styles.legendPercent}>Bạn có thể đặt ngân sách trong Cài đặt hoặc hỏi aQuang.</Text>
                </>
              )}
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thu nhập vs Chi tiêu (5 tháng)</Text>
        {isChartLoading || !showBarChart ? (
          <ChartSkeletonCard styles={styles} height={BAR_CHART_CARD_HEIGHT} />
        ) : (
          <View style={[styles.chartCard, styles.barChartCard]}>
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
                isAnimated={shouldAnimateCharts}
                animationDuration={ChartAnimationDuration.bar}
                xAxisThickness={1}
                yAxisThickness={0}
                xAxisColor={COLORS.cardBorder}
                yAxisTextStyle={{color: COLORS.textSecondary, fontSize: 10}}
                xAxisLabelTextStyle={{color: COLORS.textSecondary, fontSize: 10}}
                noOfSections={4}
                maxValue={displayMaxBarValue}
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
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chi tiêu theo danh mục</Text>
        {isChartLoading ? (
          <ChartSkeletonCard styles={styles} height={PIE_CHART_CARD_HEIGHT} />
        ) : (
          <View style={[styles.chartCard, styles.pieChartCard]}>
            {pieData.length > 0 ? (
              <>
            <View style={styles.pieContainer}>
              <PieChart
                data={pieData}
                donut
                innerRadius={70}
                radius={100}
                isAnimated={shouldAnimateCharts}
                animationDuration={ChartAnimationDuration.pie}
                centerLabelComponent={() => (
                  <View style={styles.pieCenter}>
                    <Text style={styles.pieCenterLabel}>Tổng</Text>
                    <Text style={styles.pieCenterAmount}>{formatCurrencyShort(totalExpense)}</Text>
                  </View>
                )}
                showText={false}
              />
            </View>

            <View style={styles.legend}>
              {pieData.map((item, i) => (
                <FadeSlideView
                  key={`${transitionKey}-${item.categoryId}`}
                  delay={ChartAnimationDelay.legendBase + i * ChartAnimationDelay.legendStep}
                  duration={ChartAnimationDuration.skeletonFade}
                  fromY={6}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, {backgroundColor: item.color}]} />
                    <Text style={styles.legendLabel} numberOfLines={1}>
                      {item.emoji} {item.label}
                    </Text>
                    <Text style={styles.legendPercent}>{item.text}</Text>
                  </View>
                </FadeSlideView>
              ))}
            </View>
              </>
            ) : (
              <View style={styles.emptyChartContent}>
                <Text style={styles.emptyIcon}>🍩</Text>
                <Text style={styles.emptyText}>Chưa có dữ liệu chi tiêu tháng này</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chi tiết theo danh mục</Text>
        {isChartLoading ? (
          <View style={styles.detailListCard}>
            <DetailSkeletonRows styles={styles} />
          </View>
        ) : categoryStats.length > 0 ? (
          categoryStats.map((stat, i) => {
            const percentage = totalExpense > 0
              ? ((stat.total / totalExpense) * 100).toFixed(1)
              : '0';
            const color = CHART_COLORS[i % CHART_COLORS.length];
            const emoji = CATEGORY_ICONS[stat.category]
              ? CATEGORY_EMOJI[stat.category]
              : customCategories?.[stat.category]?.icon || '📌';
            const budgetStatus = getBudgetStatus(stat.category, selectedYear, selectedMonth);
            const isOverBudget = budgetStatus.exists && budgetStatus.isOver;
            const ratio = totalExpense > 0 ? stat.total / totalExpense : 0;

            return (
              <FadeSlideView
                key={`${transitionKey}-${stat.category}`}
                delay={40 + i * 20}
                duration={ChartAnimationDuration.skeletonFade}
                fromY={8}>
                <View style={[styles.statRow, isOverBudget && styles.statRowOver]}>
                  <View style={styles.statRowHeader}>
                    <View style={styles.statRowLeft}>
                      <Text style={styles.categoryEmoji}>{emoji}</Text>
                      <Text style={styles.statName}>{getCategoryLabel(stat.category)}</Text>
                      <Text style={styles.statCount}>{stat.count} GD</Text>
                    </View>
                    <View style={styles.statRowRight}>
                      <OverBudgetBadgeAnimated visible={isOverBudget} color={COLORS.expense} />
                      <AnimatedNumber
                        value={stat.total}
                        format="currency"
                        style={[styles.statRowAmount, {color: COLORS.expense}]}
                      />
                      <Text style={styles.statRowPercent}>{percentage}%</Text>
                    </View>
                  </View>
                  <ProgressBarAnimated
                    ratio={ratio}
                    color={color}
                    duration={ChartAnimationDuration.progress}
                  />
                </View>
              </FadeSlideView>
            );
          })
        ) : (
          <View style={styles.emptyDetailCard}>
            <Text style={styles.emptyText}>Chưa có danh mục chi tiêu trong tháng này</Text>
          </View>
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
  surfaceMuted: string;
  soft: string;
}) => StyleSheet.create({
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
  monthLabel: {color: COLORS.text, fontSize: 18, fontWeight: '700', minWidth: 160, textAlign: 'center'},
  monthLabelContainer: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minWidth: 160, gap: 8},
  todayButton: {padding: 6, backgroundColor: COLORS.soft, borderRadius: 8, borderWidth: 1, borderColor: COLORS.cardBorder},
  statsRow: {flexDirection: 'row', gap: 12, marginBottom: 20},
  statCard: {
    flex: 1,
    height: 88,
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
  budgetSection: {marginBottom: 20},
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  budgetCard: {
    height: BUDGET_CARD_HEIGHT,
  },
  barChartCard: {
    height: BAR_CHART_CARD_HEIGHT,
  },
  pieChartCard: {
    minHeight: PIE_CHART_CARD_HEIGHT,
  },
  pieContainer: {alignItems: 'center', marginBottom: 16},
  pieCenter: {alignItems: 'center'},
  pieCenterLabel: {color: COLORS.textSecondary, fontSize: 12},
  pieCenterAmount: {color: COLORS.text, fontSize: 15, fontWeight: '700'},
  legend: {gap: 8},
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 8},
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
  emptyBar: {height: 220, alignItems: 'center', justifyContent: 'center'},
  emptyChartContent: {height: PIE_CHART_CARD_HEIGHT - 34, alignItems: 'center', justifyContent: 'center'},
  emptyDetailCard: {
    minHeight: DETAIL_ROW_HEIGHT,
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyIcon: {fontSize: 40, marginBottom: 8},
  emptyText: {color: COLORS.textSecondary, fontSize: 14, textAlign: 'center'},
  detailListCard: {gap: 0},
  statRow: {
    height: DETAIL_ROW_HEIGHT,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statRowOver: {borderColor: '#f4c7bd', backgroundColor: '#fff4f1'},
  statRowHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8},
  statRowLeft: {flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1},
  categoryEmoji: {fontSize: 16},
  statName: {color: COLORS.text, fontSize: 14, fontWeight: '500'},
  statCount: {color: COLORS.textSecondary, fontSize: 12},
  statRowRight: {alignItems: 'flex-end'},
  statRowAmount: {fontSize: 14, fontWeight: '600'},
  statRowPercent: {color: COLORS.textSecondary, fontSize: 12},
  skeletonLineLg: {height: 14, width: '46%', borderRadius: 8, backgroundColor: COLORS.surfaceMuted, marginBottom: 10},
  skeletonLineMd: {height: 12, width: '34%', borderRadius: 8, backgroundColor: COLORS.surfaceMuted, marginBottom: 14},
  skeletonLineSm: {height: 12, width: '58%', borderRadius: 8, backgroundColor: COLORS.surfaceMuted},
  skeletonAmountLine: {height: 18, width: '78%', borderRadius: 9, backgroundColor: COLORS.surfaceMuted, marginTop: 10},
  skeletonBlock: {flex: 1, minHeight: 180, borderRadius: 16, backgroundColor: COLORS.surfaceMuted},
  skeletonDetailLeft: {height: 16, width: '48%', borderRadius: 8, backgroundColor: COLORS.card},
  skeletonDetailRight: {height: 16, width: '26%', borderRadius: 8, backgroundColor: COLORS.card},
  skeletonProgressLine: {height: 4, borderRadius: 2, backgroundColor: COLORS.card, marginTop: 8},
});

const stylesGlobal = StyleSheet.create({
  progressBarBg: {
    height: 4,
    backgroundColor: '#e6e8ec',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    transformOrigin: 'left center',
  } as any,
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
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ChartsScreen;
