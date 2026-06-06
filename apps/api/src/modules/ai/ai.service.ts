import {BadRequestException, Injectable, ServiceUnavailableException} from '@nestjs/common';
import type {AiChatRequest, AiChatResponse} from '@paynote/shared';
import {getConfig} from '../../shared/config';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const ALLOWED_MODELS = new Set(['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash']);
const MAX_MESSAGES = 12;
const MAX_CONTENT_CHARS = 12000;

const mapMessagesToPrompt = (messages: AiChatRequest['messages']): string =>
  messages.map(message => `[${message.role}]\n${message.content}`).join('\n\n');

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

@Injectable()
export class AiService {
  async chat(request: AiChatRequest): Promise<AiChatResponse> {
    const model = request.model?.trim() || DEFAULT_MODEL;
    if (!ALLOWED_MODELS.has(model)) {
      throw new BadRequestException('UNSUPPORTED_MODEL');
    }
    if (!Array.isArray(request.messages) || request.messages.length === 0 || request.messages.length > MAX_MESSAGES) {
      throw new BadRequestException('INVALID_MESSAGES');
    }
    const totalChars = request.messages.reduce((sum, message) => sum + String(message.content || '').length, 0);
    if (totalChars > MAX_CONTENT_CHARS) {
      throw new BadRequestException('PROMPT_TOO_LARGE');
    }

    const apiKey = getConfig().geminiApiKey;
    if (!apiKey) {
      throw new ServiceUnavailableException('SERVER_MISSING_GEMINI_KEY');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{role: 'user', parts: [{text: mapMessagesToPrompt(request.messages)}]}],
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ServiceUnavailableException('GEMINI_UPSTREAM_ERROR');
    }

    const content = extractGeminiText(payload);
    if (!content) {
      throw new ServiceUnavailableException('GEMINI_EMPTY_CONTENT');
    }

    return {content, provider: 'gemini'};
  }
}
