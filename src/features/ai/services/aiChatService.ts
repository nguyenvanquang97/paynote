import {detectAIIntent} from './aiIntentService';
import {buildFinancialContextForIntent} from './financialContextService';
import {generateLocalAnswer} from './localAIAnswerService';
import {createAIChatMessageId, type AIChatMessage} from '../types/aiChat.types';
import {getAIEnvSettings} from '../../../config/env';
import {buildLLMMessages} from './llm/llmPromptBuilder';
import {requestLLMAnswer} from './llm/llmClient';

export async function sendAIChatMessage(input: string): Promise<AIChatMessage> {
  const content = input.trim();
  if (!content) {
    throw new Error('EMPTY_MESSAGE');
  }

  const intent = detectAIIntent(content);
  const context = await buildFinancialContextForIntent(intent, content);
  const localAnswer = generateLocalAnswer(content, intent, context);
  const llmMessages = buildLLMMessages(content, intent, context);
  const llmSettings = getAIEnvSettings();
  console.info('[AI_CHAT] provider=%s useLLM=%s model=%s', llmSettings.provider, String(llmSettings.useLLM), llmSettings.model);

  const toFallbackMessage = (fallbackContent: string): AIChatMessage => ({
    id: createAIChatMessageId(),
    role: 'assistant',
    content: fallbackContent,
    createdAt: Date.now(),
    status: 'success',
    metadata: {
      intent,
      source: 'fallback',
    },
  });

  const tryMockFallback = async (): Promise<AIChatMessage | null> => {
    try {
      const mockResponse = await requestLLMAnswer({
        provider: 'mock',
        apiKey: '',
        model: 'mock-local',
        timeoutMs: llmSettings.timeoutMs,
        messages: llmMessages,
      });
      const text = mockResponse.content.trim();
      if (!text) {
        return null;
      }
      return toFallbackMessage(text);
    } catch {
      return null;
    }
  };

  if (!llmSettings.useLLM) {
    console.info('[AI_CHAT] LLM disabled or missing key -> fallback flow');
    const mockMessage = await tryMockFallback();
    if (mockMessage) {
      console.info('[AI_CHAT] fallback source=mock');
    } else {
      console.info('[AI_CHAT] fallback source=local');
    }
    return mockMessage || toFallbackMessage(localAnswer);
  }

  try {
    console.info('[AI_CHAT] calling provider=%s', llmSettings.provider);
    const llmResponse = await requestLLMAnswer({
      provider: llmSettings.provider,
      apiKey: llmSettings.apiKey,
      model: llmSettings.model,
      timeoutMs: llmSettings.timeoutMs,
      messages: llmMessages,
    });

    const llmContent = llmResponse.content.trim();
    if (!llmContent) {
      throw new Error('EMPTY_LLM_RESPONSE');
    }

    return {
      id: createAIChatMessageId(),
      role: 'assistant',
      content: llmContent,
      createdAt: Date.now(),
      status: 'success',
      metadata: {
        intent,
        source: 'llm',
      },
    };
  } catch {
    console.warn('[AI_CHAT] provider=%s failed -> fallback', llmSettings.provider);
    if (llmSettings.provider !== 'mock') {
      const mockMessage = await tryMockFallback();
      if (mockMessage) {
        console.info('[AI_CHAT] fallback source=mock');
        return mockMessage;
      }
    }
    console.info('[AI_CHAT] fallback source=local');
    return toFallbackMessage(localAnswer);
  }

}
