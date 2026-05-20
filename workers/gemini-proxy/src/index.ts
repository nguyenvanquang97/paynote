export interface Env {
  GEMINI_API_KEY: string;
  PAYNOTE_CLIENT_TOKEN?: string;
  ALLOWED_ORIGIN?: string;
}

type LLMMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatRequest = {
  model?: string;
  messages?: LLMMessage[];
};

const DEFAULT_MODEL = 'gemini-2.5-flash';
const ALLOWED_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
]);
const MAX_MESSAGES = 12;
const MAX_CONTENT_CHARS = 12000;

const json = (body: unknown, init: ResponseInit = {}, origin = '*') => new Response(JSON.stringify(body), {
  ...init,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
    ...init.headers,
  },
});

const normalizeOrigin = (request: Request, env: Env): string => {
  const requestOrigin = request.headers.get('Origin') || '*';
  const allowedOrigin = env.ALLOWED_ORIGIN?.trim();
  if (!allowedOrigin || allowedOrigin === '*') {
    return requestOrigin;
  }
  return requestOrigin === allowedOrigin ? requestOrigin : 'null';
};

const requireClientToken = (request: Request, env: Env): Response | null => {
  const expected = env.PAYNOTE_CLIENT_TOKEN?.trim();
  if (!expected) {
    return null;
  }

  const actual = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (actual !== expected) {
    return json({error: 'UNAUTHORIZED'}, {status: 401}, normalizeOrigin(request, env));
  }

  return null;
};

const parseRequest = async (request: Request): Promise<{model: string; messages: LLMMessage[]}> => {
  const body = await request.json() as ChatRequest;
  const model = typeof body.model === 'string' && body.model.trim()
    ? body.model.trim()
    : DEFAULT_MODEL;

  if (!ALLOWED_MODELS.has(model)) {
    throw new Error('UNSUPPORTED_MODEL');
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
    throw new Error('INVALID_MESSAGES');
  }

  const messages = body.messages.map(message => ({
    role: message.role,
    content: String(message.content || '').trim(),
  }));

  if (messages.some(message => !['system', 'user', 'assistant'].includes(message.role) || !message.content)) {
    throw new Error('INVALID_MESSAGES');
  }

  const totalChars = messages.reduce((sum, message) => sum + message.content.length, 0);
  if (totalChars > MAX_CONTENT_CHARS) {
    throw new Error('PROMPT_TOO_LARGE');
  }

  return {model, messages};
};

const mapMessagesToPrompt = (messages: LLMMessage[]): string => messages
  .map(message => `[${message.role}]\n${message.content}`)
  .join('\n\n');

const extractGeminiText = (payload: any): string => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return '';
  }
  return parts
    .map(part => typeof part?.text === 'string' ? part.text.trim() : '')
    .filter(Boolean)
    .join('\n')
    .trim();
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = normalizeOrigin(request, env);

    if (request.method === 'OPTIONS') {
      return json({}, {status: 204}, origin);
    }

    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/chat') {
      return json({error: 'NOT_FOUND'}, {status: 404}, origin);
    }

    if (!env.GEMINI_API_KEY?.trim()) {
      return json({error: 'SERVER_MISSING_GEMINI_KEY'}, {status: 500}, origin);
    }

    const unauthorized = requireClientToken(request, env);
    if (unauthorized) {
      return unauthorized;
    }

    let parsed: {model: string; messages: LLMMessage[]};
    try {
      parsed = await parseRequest(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'BAD_REQUEST';
      return json({error: message}, {status: 400}, origin);
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${parsed.model}:generateContent`;
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{text: mapMessagesToPrompt(parsed.messages)}],
          },
        ],
      }),
    });

    const payload = await geminiResponse.json().catch(() => null);
    if (!geminiResponse.ok) {
      return json({error: 'GEMINI_UPSTREAM_ERROR'}, {status: geminiResponse.status}, origin);
    }

    const content = extractGeminiText(payload);
    if (!content) {
      return json({error: 'GEMINI_EMPTY_CONTENT'}, {status: 502}, origin);
    }

    return json({content, provider: 'gemini'}, {status: 200}, origin);
  },
};
