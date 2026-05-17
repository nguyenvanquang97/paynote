import {AI_QUICK_PROMPTS} from '../constants/aiQuickPrompts';
import type {FinancialContext} from './financialContextService';
import type {AIIntent} from '../types/aiChat.types';

const formatVnd = (value: number): string => `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}đ`;

export function generateLocalAnswer(
  input: string,
  intent: AIIntent,
  context: FinancialContext,
): string {
  const {totals, categoryBreakdown, duplicateCandidates, missedTransactionWarnings, comparison} = context;

  if (intent === 'spending_summary') {
    if (totals.expense <= 0 && totals.income <= 0) {
      return `${context.period.label} chưa có dữ liệu giao dịch để tóm tắt.`;
    }
    const top = categoryBreakdown.slice(0, 3)
      .map((item, idx) => `${idx + 1}. ${item.categoryName}: ${formatVnd(item.amount)}`)
      .join('\n');

    return [
      `${context.period.label} bạn đã chi ${formatVnd(totals.expense)}.`,
      `Thu vào ${formatVnd(totals.income)}, còn lại ${formatVnd(totals.balance)}.`,
      top ? `Top danh mục:\n${top}` : 'Chưa có danh mục chi tiêu nổi bật.',
    ].join('\n\n');
  }

  if (intent === 'category_breakdown') {
    if (categoryBreakdown.length === 0) {
      return 'Hiện chưa có dữ liệu chi tiêu theo danh mục để phân tích.';
    }
    const lines = categoryBreakdown
      .slice(0, 5)
      .map((item, idx) => `${idx + 1}. ${item.categoryName}: ${formatVnd(item.amount)} (${item.percentage}%)`)
      .join('\n');
    return `Danh mục chi tiêu lớn nhất của bạn:\n${lines}`;
  }

  if (intent === 'period_compare') {
    if (!comparison) {
      return 'Chưa đủ dữ liệu để so sánh tháng này với tháng trước.';
    }
    const trendText = comparison.trend === 'up'
      ? 'cao hơn'
      : comparison.trend === 'down'
        ? 'thấp hơn'
        : 'bằng';
    const percentText = comparison.trend === 'flat' ? '' : ` (${Math.abs(comparison.deltaPercent)}%)`;
    return `Tháng này bạn chi ${formatVnd(comparison.currentExpense)}, ${trendText} tháng trước ${formatVnd(Math.abs(comparison.deltaAmount))}${percentText}.`;
  }

  if (intent === 'abnormal_spending') {
    const top = categoryBreakdown[0];
    if (!top || top.percentage < 45) {
      return 'Hiện chưa thấy dấu hiệu chi tiêu đột biến rõ ràng trong kỳ này.';
    }
    return `Có dấu hiệu chi tiêu tập trung cao ở ${top.categoryName}: ${formatVnd(top.amount)} (${top.percentage}% tổng chi).`; 
  }

  if (intent === 'duplicate_check') {
    if (!duplicateCandidates || duplicateCandidates.length === 0) {
      return 'Mình chưa thấy nhóm giao dịch nào có dấu hiệu bị trùng.';
    }
    const first = duplicateCandidates[0];
    return `Mình tìm thấy ${duplicateCandidates.length} nhóm giao dịch có khả năng bị trùng.\nNhóm đáng chú ý: ${formatVnd(first?.amount || 0)} vào ngày ${first?.transactionDate}, ${first?.reason.toLowerCase()}.`;
  }

  if (intent === 'missed_transaction_check') {
    if (!missedTransactionWarnings || missedTransactionWarnings.length === 0) {
      return 'Hiện chưa có dấu hiệu rõ ràng về giao dịch bị sót.';
    }
    const first = missedTransactionWarnings[0];
    return `Có cảnh báo khả năng thiếu giao dịch. ${first?.reason}. Bạn có thể kiểm tra lại lịch sử thông báo ngân hàng/import.`;
  }

  if (intent === 'saving_advice') {
    const top = categoryBreakdown[0];
    if (!top) {
      return 'Mình chưa có đủ dữ liệu để gợi ý tiết kiệm. Hãy ghi thêm giao dịch vài ngày nữa nhé.';
    }
    const targetCut = Math.round(top.amount * 0.15);
    return `Bạn có thể bắt đầu từ danh mục ${top.categoryName}. Nếu giảm khoảng 15% danh mục này, bạn tiết kiệm được gần ${formatVnd(targetCut)} trong kỳ.`;
  }

  const promptHints = AI_QUICK_PROMPTS.slice(0, 3).map((item, idx) => `${idx + 1}. ${item}`).join('\n');
  return [
    `Mình chưa hiểu rõ câu hỏi: "${input}".`,
    'Bạn có thể thử một trong các gợi ý sau:',
    promptHints,
  ].join('\n');
}
