import type {LLMMessage, LLMRequest, LLMResponse} from './llm.types';

const extractText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const merged = value
      .map((item: any) => {
        if (typeof item === 'string') {return item;}
        if (item && typeof item.text === 'string') {return item.text;}
        return '';
      })
      .join('\n')
      .trim();
    return merged;
  }

  return '';
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
};

const callOpenAI = async (request: LLMRequest): Promise<LLMResponse> => {
  const response = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${request.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: 0.2,
      }),
    },
    request.timeoutMs,
  );

  if (!response.ok) {
    throw new Error(`OPENAI_HTTP_${response.status}`);
  }

  const data = await response.json();
  const content = extractText(data?.choices?.[0]?.message?.content);
  if (!content) {
    throw new Error('OPENAI_EMPTY_CONTENT');
  }

  return {
    content,
    provider: 'openai',
  };
};

const mapGeminiMessages = (messages: LLMMessage[]): string =>
  messages
    .map(message => `[${message.role}]\n${message.content}`)
    .join('\n\n');

const callGemini = async (request: LLMRequest): Promise<LLMResponse> => {
  const prompt = mapGeminiMessages(request.messages);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent`;
  console.info('[AI_LLM] Gemini request model=%s timeoutMs=%d', request.model, request.timeoutMs);

  const response = await fetchWithTimeout(
    endpoint,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': request.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{text: prompt}],
          },
        ],
      }),
    },
    request.timeoutMs,
  );

  console.log('[AI_LLM] Gemini response status=', response);
  if (!response.ok) {
    throw new Error(`GEMINI_HTTP_${response.status}`);
  }

  const data = await response.json();
    console.log('[AI_LLM] Gemini response data', data);
  const parts = data?.candidates?.[0]?.content?.parts;
  const content = Array.isArray(parts)
    ? parts.map((part: any) => extractText(part?.text)).filter(Boolean).join('\n').trim()
    : '';

  if (!content) {
    throw new Error('GEMINI_EMPTY_CONTENT');
  }
  console.info('[AI_LLM] Gemini content received chars=%d', content.length);

  return {
    content,
    provider: 'gemini',
  };
};

const callMock = async (request: LLMRequest): Promise<LLMResponse> => {
  const question = request.messages.find(message => message.role === 'user')?.content || '';
  return {
    content: `Mock AI (${request.model}): ${question.split('\n')[0]}`,
    provider: 'mock',
  };
};

export const requestLLMAnswer = async (request: LLMRequest): Promise<LLMResponse> => {
  if (request.provider === 'mock') {
    return callMock(request);
  }

  if (!request.apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  if (request.provider === 'openai') {
    return callOpenAI(request);
  }

  if (request.provider === 'gemini') {
    return callGemini(request);
  }

  throw new Error('UNSUPPORTED_PROVIDER');
};
