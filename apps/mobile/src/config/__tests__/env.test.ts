const loadEnvModule = (
  runtimeEnv: Record<string, string>,
  localRuntimeEnv: Record<string, string> = {},
) => {
  jest.resetModules();
  jest.doMock('../runtimeEnv.generated', () => ({
    RUNTIME_ENV: runtimeEnv,
  }));
  jest.doMock('../runtimeEnv.local', () => ({
    RUNTIME_ENV: localRuntimeEnv,
  }), {virtual: true});
  return require('../env') as typeof import('../env');
};

describe('env AI provider resolution', () => {
  it('auto-selects gemini when GEMINI_API_KEY exists and provider not set', () => {
    const env = loadEnvModule({
      GEMINI_API_KEY: 'gem-key',
      GOOGLE_API_KEY: '',
      OPENAI_API_KEY: '',
      PAYNOTE_AI_PROVIDER: '',
      PAYNOTE_AI_API_KEY: '',
      PAYNOTE_AI_MODEL: '',
      PAYNOTE_AI_TIMEOUT_MS: '',
    });

    expect(env.getAIProviderFromEnv()).toBe('gemini');
    expect(env.getAIEnvSettings().provider).toBe('gemini');
  });

  it('respects explicit mock provider', () => {
    const env = loadEnvModule({
      GEMINI_API_KEY: 'gem-key',
      GOOGLE_API_KEY: '',
      OPENAI_API_KEY: '',
      PAYNOTE_AI_PROVIDER: 'mock',
      PAYNOTE_AI_API_KEY: '',
      PAYNOTE_AI_MODEL: '',
      PAYNOTE_AI_TIMEOUT_MS: '',
    });

    expect(env.getAIProviderFromEnv()).toBe('mock');
  });

  it('falls back to mock when no keys exist', () => {
    const env = loadEnvModule({
      GEMINI_API_KEY: '',
      GOOGLE_API_KEY: '',
      OPENAI_API_KEY: '',
      PAYNOTE_AI_PROVIDER: '',
      PAYNOTE_AI_API_KEY: '',
      PAYNOTE_AI_MODEL: '',
      PAYNOTE_AI_TIMEOUT_MS: '',
    });

    expect(env.getAIProviderFromEnv()).toBe('mock');
  });

  it('uses gemini proxy as an online LLM path without bundling a key', () => {
    const env = loadEnvModule({
      GEMINI_API_KEY: '',
      GOOGLE_API_KEY: '',
      OPENAI_API_KEY: '',
      PAYNOTE_AI_PROVIDER: '',
      PAYNOTE_AI_API_KEY: '',
      PAYNOTE_AI_PROXY_URL: 'https://example.workers.dev/chat',
      PAYNOTE_AI_PROXY_TOKEN: 'client-token',
      PAYNOTE_AI_MODEL: '',
      PAYNOTE_AI_TIMEOUT_MS: '',
    });

    expect(env.getAIEnvSettings()).toEqual(expect.objectContaining({
      provider: 'gemini',
      apiKey: '',
      proxyUrl: 'https://example.workers.dev/chat',
      proxyToken: 'client-token',
      useLLM: true,
    }));
  });
});
