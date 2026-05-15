import {RUNTIME_ENV} from './runtimeEnv.generated';

const readEnv = (key: 'GEMINI_API_KEY' | 'GOOGLE_API_KEY'): string => {
  const generatedValue = (RUNTIME_ENV[key] || '').trim();
  if (generatedValue.length > 0) {return generatedValue;}
  const runtimeValue = ((globalThis as any)?.process?.env?.[key] as string | undefined) || '';
  return runtimeValue.trim();
};

export const getGeminiApiKeyFromEnv = (): string => {
  const gemini = readEnv('GEMINI_API_KEY');
  if (gemini) {return gemini;}
  return readEnv('GOOGLE_API_KEY');
};
