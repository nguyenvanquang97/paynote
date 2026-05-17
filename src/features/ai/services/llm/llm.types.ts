export type LLMProvider = 'openai' | 'gemini' | 'mock';

export type LLMMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type LLMResponse = {
  content: string;
  provider: LLMProvider;
};

export type LLMRequest = {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  timeoutMs: number;
  messages: LLMMessage[];
};
