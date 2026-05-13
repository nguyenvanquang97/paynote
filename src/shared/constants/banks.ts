export const SUPPORTED_BANKS = {
  mbbank: {
    name: 'MB Bank',
    packagePatterns: ['mb', 'mbbank'],
    color: '#1e3a5f',
  },
  techcombank: {
    name: 'Techcombank',
    packagePatterns: ['tcb', 'techcombank'],
    color: '#e31937',
  },
  vietcombank: {
    name: 'Vietcombank',
    packagePatterns: ['vcb', 'vietcombank'],
    color: '#00723f',
  },
} as const;

export type BankId = keyof typeof SUPPORTED_BANKS;

export const NOTIFICATION_EVENT = 'BANK_NOTIFICATION';
