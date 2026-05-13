import type {ParsedTransaction} from '../../../shared/types';
import {parseCurrency} from '../../../utils';

/**
 * Parse MB Bank notification text
 *
 * MB Bank notification formats:
 * - "TK 0381xxx: +500,000 VND lúc 13:00 12/05. SD: 5,000,000 VND. ND: TRANSFER FROM ..."
 * - "TK 0381xxx: -50,000 VND lúc 14:30 12/05. SD: 4,950,000 VND. ND: THANH TOAN ..."
 */
export const parseMBNotification = (
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
  const balanceRegex = /SD[:\s]*([+-]?\d[\d,.]*)[\s]*VND/i;
  const balanceMatch = text.match(balanceRegex);

  if (balanceMatch) {
    balanceAfter = parseCurrency(balanceMatch[1]);
  }

  // Try to extract description
  let description: string | undefined;
  const descRegex = /ND[:\s]*(.*?)(?:\.|$)/i;
  const descMatch = text.match(descRegex);

  if (descMatch) {
    description = descMatch[1].trim();
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
