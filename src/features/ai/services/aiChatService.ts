import {detectAIIntent} from './aiIntentService';
import {buildFinancialContextForIntent} from './financialContextService';
import {generateLocalAnswer} from './localAIAnswerService';
import {createAIChatMessageId, type AIChatMessage} from '../types/aiChat.types';

export async function sendAIChatMessage(input: string): Promise<AIChatMessage> {
  const content = input.trim();
  if (!content) {
    throw new Error('EMPTY_MESSAGE');
  }

  const intent = detectAIIntent(content);
  const context = await buildFinancialContextForIntent(intent, content);
  const answer = generateLocalAnswer(content, intent, context);

  return {
    id: createAIChatMessageId(),
    role: 'assistant',
    content: answer,
    createdAt: Date.now(),
    status: 'success',
    metadata: {
      intent,
      source: 'local',
    },
  };
}
