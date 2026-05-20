export const SUPPORTED_BANKS = {
  mbbank: {
    name: 'MB Bank',
    packagePatterns: ['mb', 'mbbank'],
    color: '#1e3a5f',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWxVCwzMOz-fHe8G4lTjmVEBG72gMidPX8dw&s',
  },
  techcombank: {
    name: 'Techcombank',
    packagePatterns: ['tcb', 'techcombank'],
    color: '#e31937',
    logo: 'https://inkythuatso.com/uploads/thumbnails/800/2021/09/logo-techcombank-inkythuatso-10-15-17-50.jpg',
  },
  vietcombank: {
    name: 'Vietcombank',
    packagePatterns: ['vcb', 'vietcombank'],
    color: '#00723f',
    logo: 'https://antt.mediacdn.vn/83577812655439872/2024/12/26/vietcombank-1735202958516527402000.jpg',
  },
} as const;

export type BankId = keyof typeof SUPPORTED_BANKS;

export const NOTIFICATION_EVENT = 'BANK_NOTIFICATION';
export const NOTIFICATION_ACTION_EVENT = 'NOTIFICATION_ACTION';
