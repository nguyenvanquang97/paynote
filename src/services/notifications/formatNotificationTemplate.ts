import type {NotificationTemplateContext} from './notificationTypes';

export const formatNotificationTemplate = (
  body: string,
  context: NotificationTemplateContext,
): string => {
  const percentText = typeof context.percent === 'number'
    ? String(Math.max(0, Math.round(context.percent)))
    : '0';
  const countText = typeof context.count === 'number'
    ? String(Math.max(0, Math.round(context.count)))
    : '0';
  return body
    .replace(/\{categoryLabel\}/g, context.categoryLabel ?? 'Khoản này')
    .replace(/\{amountText\}/g, context.amountText ?? 'Khoản tiền này')
    .replace(/\{spentText\}/g, context.spentText ?? 'một khoản kha khá')
    .replace(/\{limitText\}/g, context.limitText ?? 'ngân sách')
    .replace(/\{percent\}/g, percentText)
    .replace(/\{count\}/g, countText)
    .replace(/\{daysLeft\}/g, String(context.daysLeft ?? 'vài'))
    .replace(/\{days\}/g, String(context.days ?? 'vài'))
    .replace(/\{transactionName\}/g, context.transactionName ?? 'giao dịch này')
    .replace(/\{bankName\}/g, context.bankName ?? 'ngân hàng')
    .replace(/\{balanceText\}/g, context.balanceText ?? 'số dư');
};
