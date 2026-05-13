/**
 * Parse currency string to number
 * Examples:
 *   "500,000" => 500000
 *   "1.000.000" => 1000000
 *   "+500,000" => 500000
 *   "-50,000" => -50000
 */
export const parseCurrency = (raw: string): number => {
  // Remove sign prefix, we'll handle it separately
  let sign = 1;
  let cleaned = raw.trim();

  if (cleaned.startsWith('-')) {
    sign = -1;
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Remove all dots and commas (Vietnamese currency format)
  cleaned = cleaned.replace(/[.,\s]/g, '');

  const amount = parseInt(cleaned, 10);

  if (isNaN(amount)) {
    return 0;
  }

  return sign * amount;
};
