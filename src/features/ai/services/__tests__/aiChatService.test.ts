import {sendAIChatMessage} from '../aiChatService';

jest.mock('../aiIntentService', () => ({
  detectAIIntent: () => 'spending_summary',
}));

jest.mock('../financialContextService', () => ({
  buildFinancialContextForIntent: async () => ({
    now: Date.now(),
    period: {startDate: '2026-05-01', endDate: '2026-05-17', label: 'Tháng này'},
    totals: {income: 1000000, expense: 400000, balance: 600000},
    categoryBreakdown: [],
    topTransactions: [],
  }),
}));

jest.mock('../localAIAnswerService', () => ({
  generateLocalAnswer: () => 'local answer',
  generateLocalAnswerPayload: () => ({text: 'local answer', cards: []}),
}));

jest.mock('../llm/llmPromptBuilder', () => ({
  buildLLMMessages: () => [{role: 'system', content: 's'}, {role: 'user', content: 'u'}],
}));

const mockedRequestLLMAnswer = jest.fn();
jest.mock('../llm/llmClient', () => ({
  requestLLMAnswer: (...args: unknown[]) => mockedRequestLLMAnswer(...args),
}));

const mockedGetAIEnvSettings = jest.fn();
jest.mock('../../../../config/env', () => ({
  getAIEnvSettings: () => mockedGetAIEnvSettings(),
}));

describe('aiChatService', () => {
  beforeEach(() => {
    mockedRequestLLMAnswer.mockReset();
    mockedGetAIEnvSettings.mockReset();
  });

  it('returns fallback local answer when LLM is disabled/missing key', async () => {
    mockedGetAIEnvSettings.mockReturnValue({
      provider: 'openai',
      apiKey: '',
      model: 'gpt-4o-mini',
      useLLM: false,
      timeoutMs: 15000,
    });

    const message = await sendAIChatMessage('tháng này tôi tiêu bao nhiêu');
    expect(message.content).toBe('aQuang: local answer');
    expect(message.metadata?.source).toBe('fallback');
  });

  it('returns fallback local answer when LLM throws', async () => {
    mockedGetAIEnvSettings.mockReturnValue({
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4o-mini',
      useLLM: true,
      timeoutMs: 15000,
    });
    mockedRequestLLMAnswer.mockRejectedValue(new Error('network fail'));

    const message = await sendAIChatMessage('tháng này tôi tiêu bao nhiêu');
    expect(message.content).toBe('aQuang: local answer');
    expect(message.metadata?.source).toBe('fallback');
  });

  it('returns llm answer when provider responds', async () => {
    mockedGetAIEnvSettings.mockReturnValue({
      provider: 'mock',
      apiKey: '',
      model: 'mock-local',
      useLLM: true,
      timeoutMs: 15000,
    });
    mockedRequestLLMAnswer.mockResolvedValue({
      content: 'llm answer',
      provider: 'mock',
    });

    const message = await sendAIChatMessage('tháng này tôi tiêu bao nhiêu');
    expect(message.content).toBe('aQuang: llm answer');
    expect(message.metadata?.source).toBe('llm');
  });
});
