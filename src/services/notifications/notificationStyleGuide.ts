import type {NotificationPersona} from './notificationTypes';

export const NOTIFICATION_STYLE_RULES: Record<NotificationPersona, {
  maxLength: number;
  requiresPhrase?: string;
  maxEmoji: number;
}> = {
  advisor: {maxLength: 120, maxEmoji: 0},
  wallet_pet: {maxLength: 120, maxEmoji: 1, requiresPhrase: 'ví bé'},
  toxic_friend: {maxLength: 120, maxEmoji: 0},
  vietnamese_parent: {maxLength: 120, maxEmoji: 0},
};

export const PROFANITY_BLOCKLIST = [
  'địt',
  'đm',
  'vcl',
  'clm',
  'đéo',
  'cặc',
  'lồn',
  'đần độn',
];

export const normalizeForSimilarity = (text: string): string => text
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const extractOpeningPhrase = (text: string): string => normalizeForSimilarity(text)
  .split(' ')
  .slice(0, 3)
  .join(' ');
