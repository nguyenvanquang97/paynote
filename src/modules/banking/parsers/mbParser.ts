import type {ParsedTransaction} from '../../../shared/types';
import {parseCurrency} from '../../../utils';

/**
 * Parse MB Bank notification text
 *
 * MB Bank notification formats:
 * - "TK 0381xxx: +500,000 VND lúc 13:00 12/05. SD: 5,000,000 VND. ND: TRANSFER FROM ..."
 * - "TK 0381xxx: -50,000 VND lúc 14:30 12/05. SD: 4,950,000 VND. ND: THANH TOAN ..."
 * - "TK 03xxx133|GD: -25,000VND 14/05/26 12:18 |SD: 75,125VND|DEN: ...|ND: ..."
 */
export const parseMBNotification = (
  text: string,
): ParsedTransaction | null => {
  if (!text) {
    return null;
  }

  // Prefer the transaction amount after GD; fall back to the first signed VND amount.
  const amountRegexes = [
    /\bGD[:\s]*([+-]?\d[\d,.]*)[\s]*VND/i,
    /([+-]\d[\d,.]*)[\s]*VND/i,
    /([+-]?\d[\d,.]*)[\s]*VND/i,
  ];

  const amountMatch = amountRegexes
    .map(regex => text.match(regex))
    .find(Boolean);

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
  const descRegex = /\bND[:\s]*(.*?)(?:\||\.|$)/i;
  const descMatch = text.match(descRegex);

  if (descMatch) {
    description = descMatch[1].trim();
  }

  const timestamp = parseMBTimestamp(text) ?? Date.now();

  return {
    amount: Math.abs(amount),
    balanceAfter,
    description,
    transactionType: amount > 0 ? 'income' : 'expense',
    timestamp,
    rawText: text,
  };
};

const parseMBTimestamp = (text: string): number | undefined => {
  const fullDateMatch = text.match(
    /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})\b/,
  );

  if (fullDateMatch) {
    const [, day, month, yearRaw, hour, minute] = fullDateMatch;
    const yearNumber = Number(yearRaw);
    const year = yearRaw.length === 2 ? 2000 + yearNumber : yearNumber;
    const date = new Date(
      year,
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      0,
      0,
    );

    return Number.isNaN(date.getTime()) ? undefined : date.getTime();
  }

  const shortDateMatch = text.match(
    /\b(?:lúc\s*)?(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\b/i,
  );

  if (!shortDateMatch) {
    return undefined;
  }

  const [, hour, minute, day, month] = shortDateMatch;
  const now = new Date();
  const date = new Date(
    now.getFullYear(),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0,
  );

  return Number.isNaN(date.getTime()) ? undefined : date.getTime();
};
