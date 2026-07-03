import type {ParsedTransaction} from '../../../shared/types';
import {parseCurrency} from '../../../utils';

/**
 * Parse Vietcombank notification text
 *
 * Vietcombank notification formats:
 * - "SD TK 0071xxx GD: -50,000VND 12/05/2024 14:30. SD:4,950,000VND. Ref IBFT ..."
 * - "SD TK 0071xxx GD: +500,000VND 12/05/2024 13:00. SD:5,000,000VND. ND: ..."
 */
export const parseVCBNotification = (
  text: string,
): ParsedTransaction | null => {
  if (!text) {
    return null;
  }

  // Match amount pattern: GD: +/- amount VND or regular amount VND
  const amountRegex = /(?:GD[:\s]*)?([+-]?\d[\d,.]*)[\s]*VND/i;
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

  // Extract description
  let description: string | undefined;
  const descRegex = /(?:ND|Ref)[:\s]*(.*?)(?:\.|$)/i;
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
