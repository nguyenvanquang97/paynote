import {requestLLMAnswer} from '../llm/llmClient';

const REQUEST = {
  provider: 'gemini' as const,
  apiKey: 'test-key',
  model: 'gemini-2.5-flash',
  timeoutMs: 15000,
  messages: [{role: 'user' as const, content: 'hello'}],
};

describe('llmClient', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('preserves Gemini rate-limit status and retry timing', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: {
        get: (key: string) => key === 'Retry-After' ? '7' : null,
      },
    }) as unknown as typeof fetch;

    await expect(requestLLMAnswer(REQUEST)).rejects.toMatchObject({
      message: 'GEMINI_HTTP_429',
      provider: 'gemini',
      status: 429,
      retryAfterMs: 7000,
    });
  });
});
