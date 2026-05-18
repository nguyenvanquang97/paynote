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
const mockedGetAIApiKeyFromEnv = jest.fn();
const mockedGetAIModelFromEnv = jest.fn();
jest.mock('../../../../config/env', () => ({
  getAIEnvSettings: () => mockedGetAIEnvSettings(),
  getAIApiKeyFromEnv: (...args: unknown[]) => mockedGetAIApiKeyFromEnv(...args),
  getAIModelFromEnv: (...args: unknown[]) => mockedGetAIModelFromEnv(...args),
}));

const mockedUseAppStoreGetState = jest.fn();
jest.mock('../../../../app/store', () => ({
  useAppStore: {
    getState: () => mockedUseAppStoreGetState(),
  },
}));

describe('aiChatService', () => {
  beforeEach(() => {
    mockedRequestLLMAnswer.mockReset();
    mockedGetAIEnvSettings.mockReset();
    mockedGetAIApiKeyFromEnv.mockReset();
    mockedGetAIModelFromEnv.mockReset();
    mockedUseAppStoreGetState.mockReset();
    mockedUseAppStoreGetState.mockReturnValue({
      aiChatEnabled: true,
      aiUseOnline: true,
      aiAllowFinancialContext: true,
      aiResponseStyle: 'normal',
      aiProviderPreference: 'auto',
    });
    mockedGetAIApiKeyFromEnv.mockReturnValue('');
    mockedGetAIModelFromEnv.mockImplementation((provider: string) => provider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash');
  });

  it('returns local answer when online LLM is disabled/missing key', async () => {
    mockedGetAIEnvSettings.mockReturnValue({
      provider: 'openai',
      apiKey: '',
      model: 'gpt-4o-mini',
      useLLM: false,
      timeoutMs: 15000,
    });

    const message = await sendAIChatMessage('tháng này tôi tiêu bao nhiêu');
    expect(message.content).toBe('aQuang: local answer');
    expect(message.metadata?.source).toBe('local');
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

  it('refuses financial question when financial context permission is off', async () => {
    mockedUseAppStoreGetState.mockReturnValue({
      aiChatEnabled: true,
      aiUseOnline: true,
      aiAllowFinancialContext: false,
      aiResponseStyle: 'normal',
      aiProviderPreference: 'auto',
    });
    mockedGetAIEnvSettings.mockReturnValue({
      provider: 'gemini',
      apiKey: 'k',
      model: 'gemini-2.5-flash',
      useLLM: true,
      timeoutMs: 15000,
    });

    const message = await sendAIChatMessage('tháng này tôi tiêu bao nhiêu');
    expect(message.content).toContain('tắt quyền dùng dữ liệu tài chính');
    expect(message.metadata?.source).toBe('local');
  });

  it('uses provider preference from app settings when not auto', async () => {
    mockedUseAppStoreGetState.mockReturnValue({
      aiChatEnabled: true,
      aiUseOnline: true,
      aiAllowFinancialContext: true,
      aiResponseStyle: 'normal',
      aiProviderPreference: 'gemini',
    });
    mockedGetAIEnvSettings.mockReturnValue({
      provider: 'mock',
      apiKey: '',
      model: 'mock-local',
      useLLM: true,
      timeoutMs: 15000,
    });
    mockedGetAIApiKeyFromEnv.mockReturnValue('gem-key');
    mockedGetAIModelFromEnv.mockReturnValue('gemini-2.5-flash');
    mockedRequestLLMAnswer.mockResolvedValue({
      content: 'llm answer',
      provider: 'gemini',
    });

    const message = await sendAIChatMessage('tháng này tôi tiêu bao nhiêu');
    expect(mockedRequestLLMAnswer).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'gemini',
      apiKey: 'gem-key',
      model: 'gemini-2.5-flash',
    }));
    expect(message.metadata?.source).toBe('llm');
  });
});
