import {SUPPORTED_BANKS, type BankId} from '../../../shared/constants';

const normalize = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const detectBank = (
  packageName: string,
  appName?: string | null,
): BankId | 'unknown' => {
  const lowerPackage = packageName.toLowerCase();

  for (const [bankId, config] of Object.entries(SUPPORTED_BANKS)) {
    for (const pattern of config.packagePatterns) {
      if (lowerPackage.includes(pattern)) {
        return bankId as BankId;
      }
    }
  }

  if (appName) {
    const normalizedAppName = normalize(appName);

    for (const [bankId, config] of Object.entries(SUPPORTED_BANKS)) {
      if (normalizedAppName.includes(normalize(config.name))) {
        return bankId as BankId;
      }
    }
  }

  return 'unknown';
};
