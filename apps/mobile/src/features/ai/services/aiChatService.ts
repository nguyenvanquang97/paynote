import {detectAIIntent} from './aiIntentService';
import {buildFinancialContextForIntent} from './financialContextService';
import {generateLocalAnswerPayload} from './localAIAnswerService';
import {createAIChatMessageId, type AIChatMessage} from '../types/aiChat.types';
import {getAIApiKeyFromEnv, getAIEnvSettings, getAIModelFromEnv, type AIProvider} from '../../../config/env';
import {buildLLMMessages} from './llm/llmPromptBuilder';
import {requestLLMAnswer} from './llm/llmClient';
import {useAppStore} from '../../../app/store';

const ensureAquangVoice = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) {return 'aQuang: ...';}
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('aquang') || lower.startsWith('aquang:') || lower.includes('aquang')) {
    return trimmed;
  }
  return `aQuang: ${trimmed}`;
};

export async function sendAIChatMessage(input: string): Promise<AIChatMessage> {
  const content = input.trim();
  if (!content) {
    throw new Error('EMPTY_MESSAGE');
  }

  const appState = useAppStore.getState();
  if (!appState.aiChatEnabled) {
    return {
      id: createAIChatMessageId(),
      role: 'assistant',
      content: 'aQuang: AI Chat hiện đang tắt trong Cài đặt. Bạn có thể bật lại ở mục AI Assistant.',
      createdAt: Date.now(),
      status: 'success',
      metadata: {
        source: 'local',
      },
    };
  }

  const intent = detectAIIntent(content);
  if (!appState.aiAllowFinancialContext && intent !== 'unknown') {
    return {
      id: createAIChatMessageId(),
      role: 'assistant',
      content: 'aQuang: Bạn đang tắt quyền dùng dữ liệu tài chính. Bật lại "Cho phép phân tích dữ liệu chi tiêu" trong Cài đặt AI để mình trả lời chính xác.',
      createdAt: Date.now(),
      status: 'success',
      metadata: {
        intent,
        source: 'local',
      },
    };
  }

  const context = await buildFinancialContextForIntent(intent, content);
  const localPayload = generateLocalAnswerPayload(content, intent, context, {
    customCategories: appState.customCategories,
  });
  const localAnswer = ensureAquangVoice(localPayload.text);
  const localCards = localPayload.cards;

  const llmSettings = getAIEnvSettings();
  const preferredProvider = appState.aiProviderPreference === 'auto'
    ? llmSettings.provider
    : appState.aiProviderPreference;
  const resolvedProvider = preferredProvider as AIProvider;
  const resolvedApiKey = appState.aiProviderPreference === 'auto'
    ? llmSettings.apiKey
    : getAIApiKeyFromEnv(resolvedProvider);
  const resolvedModel = appState.aiProviderPreference === 'auto'
    ? llmSettings.model
    : getAIModelFromEnv(resolvedProvider);
  const resolvedProxyUrl = resolvedProvider === 'gemini' ? llmSettings.proxyUrl || '' : '';
  const resolvedUseLLM = Boolean(
    appState.aiUseOnline &&
    (resolvedProvider === 'mock' || resolvedApiKey.length > 0 || resolvedProxyUrl.length > 0),
  );
  const llmMessages = buildLLMMessages(content, intent, context, appState.aiResponseStyle);
  console.info(
    '[AI_CHAT] provider=%s useLLM=%s model=%s aiUseOnline=%s style=%s preferred=%s',
    resolvedProvider,
    String(resolvedUseLLM),
    resolvedModel,
    String(appState.aiUseOnline),
    appState.aiResponseStyle,
    appState.aiProviderPreference,
  );

  const toLocalMessage = (messageContent: string, source: 'local' | 'fallback'): AIChatMessage => ({
    id: createAIChatMessageId(),
    role: 'assistant',
    content: ensureAquangVoice(messageContent),
    createdAt: Date.now(),
    status: 'success',
    metadata: {
      intent,
      source,
      cards: localCards,
    },
  });

  if (!resolvedUseLLM) {
    console.info('[AI_CHAT] online LLM disabled -> local answer');
    return toLocalMessage(localAnswer, 'local');
  }

  try {
    console.info('[AI_CHAT] calling provider=%s', resolvedProvider);
    const llmResponse = await requestLLMAnswer({
      provider: resolvedProvider,
      apiKey: resolvedApiKey,
      proxyUrl: resolvedProxyUrl,
      proxyToken: resolvedProvider === 'gemini' ? llmSettings.proxyToken || '' : '',
      model: resolvedModel,
      timeoutMs: llmSettings.timeoutMs,
      messages: llmMessages,
    });

    const llmContent = ensureAquangVoice(llmResponse.content.trim());
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
        cards: localCards,
      },
    };
  } catch (error) {
    console.warn('[AI_CHAT] provider=%s failed -> fallback. Error:', resolvedProvider, error);
    console.info('[AI_CHAT] fallback source=local');
    return toLocalMessage(localAnswer, 'fallback');
  }

}
