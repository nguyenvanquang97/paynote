import {RUNTIME_ENV as BASE_ENV} from './runtimeEnv.generated';

const LOCAL_ENV = (() => {
  try {
    const local = require('./runtimeEnv.local');
    return (local?.RUNTIME_ENV || {}) as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
})();

export type AIProvider = 'openai' | 'gemini' | 'mock';

export type AIEnvSettings = {
  provider: AIProvider;
  apiKey: string;
  model: string;
  useLLM: boolean;
  localOnly: boolean;
  timeoutMs: number;
};

const DEFAULT_LLM_TIMEOUT_MS = 15000;

const readEnv = (key: string): string => {
  const localValue = (LOCAL_ENV[key] || '').trim();
  if (localValue.length > 0) {return localValue;}

  const baseValue = (((BASE_ENV as unknown as Record<string, string>)[key] || '') as string).trim();
  if (baseValue.length > 0) {return baseValue;}

  const runtimeValue = ((globalThis as any)?.process?.env?.[key] as string | undefined) || '';
  return runtimeValue.trim();
};

const asBooleanFlag = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

export const getGeminiApiKeyFromEnv = (): string => {
  const gemini = readEnv('GEMINI_API_KEY');
  if (gemini) {return gemini;}
  return readEnv('GOOGLE_API_KEY');
};

export const getAIProviderFromEnv = (): AIProvider => {
  const raw = readEnv('PAYNOTE_AI_PROVIDER').toLowerCase();
  if (raw === 'openai' || raw === 'gemini' || raw === 'mock') {
    return raw;
  }

  if (getGeminiApiKeyFromEnv().length > 0) {
    return 'gemini';
  }
  if (readEnv('OPENAI_API_KEY').length > 0) {
    return 'openai';
  }
  if (readEnv('PAYNOTE_AI_API_KEY').length > 0) {
    return 'gemini';
  }

  return 'mock';
};

export const getAIApiKeyFromEnv = (provider: AIProvider): string => {
  const explicit = readEnv('PAYNOTE_AI_API_KEY');
  if (explicit) {return explicit;}

  if (provider === 'gemini') {
    return getGeminiApiKeyFromEnv();
  }

  if (provider === 'openai') {
    return readEnv('OPENAI_API_KEY');
  }

  return '';
};

export const getAIModelFromEnv = (provider: AIProvider): string => {
  const explicit = readEnv('PAYNOTE_AI_MODEL');
  if (explicit) {return explicit;}

  if (provider === 'openai') {return 'gpt-4o-mini';}
  if (provider === 'gemini') {return 'gemini-2.5-flash';}
  return 'mock-local';
};

export const getAIEnvSettings = (): AIEnvSettings => {
  const localOnly = asBooleanFlag(readEnv('PAYNOTE_AI_LOCAL_ONLY'));
  const provider = getAIProviderFromEnv();
  const apiKey = getAIApiKeyFromEnv(provider);
  const model = getAIModelFromEnv(provider);
  const timeoutRaw = Number(readEnv('PAYNOTE_AI_TIMEOUT_MS'));
  const timeoutMs = Number.isFinite(timeoutRaw) && timeoutRaw > 0
    ? Math.round(timeoutRaw)
    : DEFAULT_LLM_TIMEOUT_MS;

  const useLLM = !localOnly && (provider === 'mock' || apiKey.length > 0);

  return {
    provider,
    apiKey,
    model,
    useLLM,
    localOnly,
    timeoutMs,
  };
};
