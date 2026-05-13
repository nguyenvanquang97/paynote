import {SUPPORTED_BANKS, type BankId} from '../../../shared/constants';

export const detectBank = (packageName: string): BankId | 'unknown' => {
  const lowerPackage = packageName.toLowerCase();

  for (const [bankId, config] of Object.entries(SUPPORTED_BANKS)) {
    for (const pattern of config.packagePatterns) {
      if (lowerPackage.includes(pattern)) {
        return bankId as BankId;
      }
    }
  }

  return 'unknown';
};
