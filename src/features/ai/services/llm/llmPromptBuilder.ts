import type {AIIntent} from '../../types/aiChat.types';
import type {FinancialContext} from '../financialContextService';
import type {LLMMessage} from './llm.types';

const SYSTEM_PROMPT = [
  'Bạn là trợ lý tài chính cá nhân của app Paynote, tên là aQuang.',
  'Khi trả lời luôn tự xưng là "aQuang" (ví dụ: "aQuang thấy rằng...").',
  '',
  'Nguyên tắc:',
  '- Trả lời bằng tiếng Việt.',
  '- Ngắn gọn, rõ ràng.',
  '- Không bịa dữ liệu.',
  '- Chỉ dùng dữ liệu trong financial context.',
  '- Nếu thiếu dữ liệu, nói rõ là chưa đủ dữ liệu.',
  '- Không đưa lời khuyên đầu tư.',
  '- Không phán xét người dùng.',
  '- Có thể hơi vui tính nhẹ theo style Paynote.',
].join('\n');

const redact = (value?: string): string | undefined => {
  if (!value) {return value;}
  return value.replace(/\b\d{6,}\b/g, '[redacted]');
};

export const sanitizeFinancialContext = (context: FinancialContext): FinancialContext => {
  const topTransactions = context.topTransactions
    .slice(0, 10)
    .map(item => ({
      ...item,
      description: redact(item.description),
    }));

  return {
    ...context,
    categoryBreakdown: context.categoryBreakdown.slice(0, 8),
    topTransactions,
    duplicateCandidates: context.duplicateCandidates?.slice(0, 5),
    missedTransactionWarnings: context.missedTransactionWarnings?.slice(0, 5),
  };
};

export const buildLLMMessages = (
  input: string,
  intent: AIIntent,
  context: FinancialContext,
): LLMMessage[] => {
  const sanitizedContext = sanitizeFinancialContext(context);
  const userPrompt = [
    `User question:\n${input}`,
    '',
    `Intent:\n${intent}`,
    '',
    `Financial context:\n${JSON.stringify(sanitizedContext, null, 2)}`,
  ].join('\n');

  return [
    {role: 'system', content: SYSTEM_PROMPT},
    {role: 'user', content: userPrompt},
  ];
};
