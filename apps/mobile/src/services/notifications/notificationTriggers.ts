import type {NotificationSeverity, NotificationTrigger} from './notificationTypes';

export interface TriggerDefinition {
  id: NotificationTrigger;
  defaultSeverity: NotificationSeverity;
  title: string;
}

export const TRIGGER_DEFINITIONS: Record<NotificationTrigger, TriggerDefinition> = {
  budget_50: {id: 'budget_50', defaultSeverity: 'low', title: 'Nhắc nhẹ chi tiêu'},
  budget_80: {id: 'budget_80', defaultSeverity: 'medium', title: 'Cảnh báo chi tiêu'},
  budget_100: {id: 'budget_100', defaultSeverity: 'high', title: 'Chạm giới hạn ngân sách'},
  budget_120: {id: 'budget_120', defaultSeverity: 'critical', title: 'Vượt ngân sách'},
  large_transaction: {id: 'large_transaction', defaultSeverity: 'high', title: 'Giao dịch lớn'},
  repeat_category_today: {id: 'repeat_category_today', defaultSeverity: 'medium', title: 'Chi tiêu lặp lại'},
  repeat_category_week: {id: 'repeat_category_week', defaultSeverity: 'medium', title: 'Chi tiêu lặp trong tuần'},
  late_night_spending: {id: 'late_night_spending', defaultSeverity: 'high', title: 'Chi tiêu khuya'},
  bank_transaction_detected: {id: 'bank_transaction_detected', defaultSeverity: 'low', title: 'Nhắc nhở chi tiêu định kỳ'},
  salary_received: {id: 'salary_received', defaultSeverity: 'low', title: 'Lương về'},
  income_received: {id: 'income_received', defaultSeverity: 'low', title: 'Thu nhập mới'},
  no_spend_day: {id: 'no_spend_day', defaultSeverity: 'low', title: 'Ngày không tiêu'},
  saving_streak: {id: 'saving_streak', defaultSeverity: 'medium', title: 'Chuỗi tiết chế'},
  duplicate_transaction: {id: 'duplicate_transaction', defaultSeverity: 'low', title: 'Giao dịch trùng'},
  missed_transaction: {id: 'missed_transaction', defaultSeverity: 'high', title: 'Có thể bỏ lỡ giao dịch'},
  end_of_day_summary: {id: 'end_of_day_summary', defaultSeverity: 'medium', title: 'Tổng kết cuối ngày'},
  end_of_month_warning: {id: 'end_of_month_warning', defaultSeverity: 'high', title: 'Nhắc cuối tháng'},
};
