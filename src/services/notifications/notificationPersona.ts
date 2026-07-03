import type {LegacyAiToneMode, NotificationPersona} from './notificationTypes';

export const LEGACY_PERSONA_MAP: Record<LegacyAiToneMode, NotificationPersona> = {
  gentle: 'advisor',
  cute: 'wallet_pet',
  sarcastic_strong: 'toxic_friend',
  angry: 'vietnamese_parent',
  strict: 'vietnamese_parent',
};

export const PERSONA_TO_LEGACY_TONE: Record<NotificationPersona, Exclude<LegacyAiToneMode, 'strict'>> = {
  advisor: 'gentle',
  wallet_pet: 'cute',
  toxic_friend: 'sarcastic_strong',
  vietnamese_parent: 'angry',
};

export const normalizePersona = (value?: string | null): NotificationPersona => {
  if (!value) {return 'advisor';}
  if (value in LEGACY_PERSONA_MAP) {
    return LEGACY_PERSONA_MAP[value as LegacyAiToneMode];
  }
  if (
    value === 'advisor' ||
    value === 'wallet_pet' ||
    value === 'toxic_friend' ||
    value === 'vietnamese_parent'
  ) {
    return value;
  }
  return 'advisor';
};

export const PERSONA_OPTIONS: Array<{
  id: NotificationPersona;
  title: string;
  description: string;
  preview: string;
}> = [
  {
    id: 'advisor',
    title: 'Cố vấn tử tế',
    description: 'Nhắc nhẹ, tỉnh táo, không gây áp lực.',
    preview: 'Khoản này hơi căng rồi, mình chậm lại một nhịp nhé.',
  },
  {
    id: 'wallet_pet',
    title: 'Ví bé biết khóc',
    description: 'Dễ thương, meme nhẹ, hợp chụp màn hình.',
    preview: 'Ví bé rén ngang 🥹',
  },
  {
    id: 'toxic_friend',
    title: 'Bạn thân toxic',
    description: 'Cà khịa mạnh nhưng vẫn văn minh.',
    preview: 'Kế hoạch tiết kiệm lại thua một cú mua nốt.',
  },
  {
    id: 'vietnamese_parent',
    title: 'Mẹ Việt Nam',
    description: 'Gắt kiểu phụ huynh, đời thường, hài hước.',
    preview: 'Tiền mọc trên cây à?',
  },
];
