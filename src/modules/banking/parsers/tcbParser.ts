import type {ParsedTransaction} from '../../../shared/types';
import {parseCurrency} from '../../../utils';

/**
 * Parse Techcombank notification text
 *
 * Techcombank notification formats:
 * - "Ban vua thuc hien GD -50,000 VND tai TK 19xxx. SD kha dung: 4,950,000 VND"
 * - "TK 19xxx +500,000 VND. SD: 5,000,000 VND. CHUYEN TIEN TU ..."
 */
export const parseTCBNotification = (
  text: string,
): ParsedTransaction | null => {
  if (!text) {
    return null;
  }

  // Match amount pattern: +/- amount VND
  const amountRegex = /([+-]?\d[\d,.]*)[\s]*VND/i;
  const amountMatch = text.match(amountRegex);

  if (!amountMatch) {
    return null;
  }

  const amount = parseCurrency(amountMatch[1]);

  if (amount === 0) {
    return null;
  }

  // Try to extract balance after transaction
  let balanceAfter: number | undefined;
  const balanceRegex = /SD[\s]*(?:kha dung)?[:\s]*([+-]?\d[\d,.]*)[\s]*VND/i;
  const balanceMatch = text.match(balanceRegex);

  if (balanceMatch) {
    balanceAfter = parseCurrency(balanceMatch[1]);
  }

  // Extract description (everything after the balance or last VND)
  let description: string | undefined;
  const parts = text.split('VND');
  if (parts.length > 2) {
    description = parts.slice(2).join('').trim().replace(/^[.\s]+/, '');
  }

  return {
    amount: Math.abs(amount),
    balanceAfter,
    description,
    transactionType: amount > 0 ? 'income' : 'expense',
    timestamp: Date.now(),
    rawText: text,
  };
};
