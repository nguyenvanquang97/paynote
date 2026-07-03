import dayjs from 'dayjs';
import {createMMKV} from 'react-native-mmkv';
import type {NotificationMemory, NotificationTrigger} from './notificationTypes';

const storage = createMMKV();
const KEY = 'notification_memory_v1';
const MAX_RECENT = 20;
const MAX_RECENT_STRUCTURES = 30;

const emptyMemory = (): NotificationMemory => ({
  recentTemplateIds: [],
  recentTexts: [],
  lastOpeningPhrases: [],
  lastShownAtByTemplateId: {},
  lastShownAtByTriggerCategory: {},
  countTodayByCategory: {},
  countTodayByTrigger: {},
  warningCountByCategory: {},
  violationVelocityByCategory: {},
  recoveryStreakByCategory: {},
  recentStructureHashes: [],
  lastResetDate: dayjs().format('YYYY-MM-DD'),
});

export const loadNotificationMemory = (): NotificationMemory => {
  const raw = storage.getString(KEY);
  if (!raw) {return emptyMemory();}
  try {
    const parsed = JSON.parse(raw) as NotificationMemory;
    return {
      ...emptyMemory(),
      ...parsed,
      recentTemplateIds: Array.isArray(parsed.recentTemplateIds)
        ? parsed.recentTemplateIds.filter(x => typeof x === 'string').slice(0, MAX_RECENT)
        : [],
      recentTexts: Array.isArray(parsed.recentTexts)
        ? parsed.recentTexts.filter(x => typeof x === 'string').slice(0, MAX_RECENT)
        : [],
      lastOpeningPhrases: Array.isArray((parsed as any).lastOpeningPhrases)
        ? (parsed as any).lastOpeningPhrases.filter((x: unknown) => typeof x === 'string').slice(0, MAX_RECENT)
        : [],
      recentStructureHashes: Array.isArray((parsed as any).recentStructureHashes)
        ? (parsed as any).recentStructureHashes.filter((x: unknown) => typeof x === 'string').slice(0, MAX_RECENT_STRUCTURES)
        : [],
    };
  } catch {
    return emptyMemory();
  }
};

export const saveNotificationMemory = (memory: NotificationMemory): void => {
  storage.set(KEY, JSON.stringify(memory));
};

export const ensureNotificationMemoryToday = (memory: NotificationMemory): NotificationMemory => {
  const today = dayjs().format('YYYY-MM-DD');
  if (memory.lastResetDate === today) {return memory;}
  const recovered = Object.fromEntries(
    Object.keys(memory.warningCountByCategory).map(key => [
      key,
      Math.max(0, (memory.recoveryStreakByCategory[key] || 0) + 1),
    ]),
  ) as Record<string, number>;
  return {
    ...memory,
    countTodayByCategory: {},
    countTodayByTrigger: {},
    warningCountByCategory: {},
    violationVelocityByCategory: {},
    recoveryStreakByCategory: recovered,
    recentStructureHashes: [],
    lastResetDate: today,
  };
};

export const triggerCategoryKey = (trigger: NotificationTrigger, categoryContext: string): string =>
  `${trigger}:${categoryContext}`;

export const commitShownTemplate = (
  memoryInput: NotificationMemory,
  params: {
    templateId: string;
    text: string;
    openingPhrase?: string;
    trigger: NotificationTrigger;
    categoryContext: string;
    now: number;
  },
): NotificationMemory => {
  const memory = ensureNotificationMemoryToday(memoryInput);
  const key = triggerCategoryKey(params.trigger, params.categoryContext);
  return {
    ...memory,
    recentTemplateIds: [params.templateId, ...memory.recentTemplateIds.filter(x => x !== params.templateId)].slice(0, MAX_RECENT),
    recentTexts: [params.text.trim(), ...memory.recentTexts.filter(x => x !== params.text.trim())].slice(0, MAX_RECENT),
    lastOpeningPhrases: params.openingPhrase
      ? [params.openingPhrase, ...memory.lastOpeningPhrases.filter(x => x !== params.openingPhrase)].slice(0, MAX_RECENT)
      : memory.lastOpeningPhrases,
    lastShownAtByTemplateId: {
      ...memory.lastShownAtByTemplateId,
      [params.templateId]: params.now,
    },
    lastShownAtByTriggerCategory: {
      ...memory.lastShownAtByTriggerCategory,
      [key]: params.now,
    },
    countTodayByCategory: {
      ...memory.countTodayByCategory,
      [params.categoryContext]: (memory.countTodayByCategory[params.categoryContext] || 0) + 1,
    },
    countTodayByTrigger: {
      ...memory.countTodayByTrigger,
      [params.trigger]: (memory.countTodayByTrigger[params.trigger] || 0) + 1,
    },
    warningCountByCategory: {
      ...memory.warningCountByCategory,
      [params.categoryContext]: (memory.warningCountByCategory[params.categoryContext] || 0) + 1,
    },
    violationVelocityByCategory: {
      ...memory.violationVelocityByCategory,
      [params.categoryContext]: Math.max(
        1,
        (memory.violationVelocityByCategory[params.categoryContext] || 0) + 1,
      ),
    },
    recoveryStreakByCategory: {
      ...memory.recoveryStreakByCategory,
      [params.categoryContext]: 0,
    },
    recentStructureHashes: params.openingPhrase
      ? [params.openingPhrase, ...memory.recentStructureHashes.filter(x => x !== params.openingPhrase)].slice(0, MAX_RECENT_STRUCTURES)
      : memory.recentStructureHashes,
  };
};
