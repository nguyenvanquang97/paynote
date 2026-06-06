jest.mock('react-native-mmkv', () => {
  const bag: Record<string, string> = {};
  return {
    createMMKV: () => ({
      getString: (key: string) => bag[key],
      set: (key: string, value: string) => {
        bag[key] = value;
      },
      remove: (key: string) => {
        delete bag[key];
      },
    }),
    __mmkvBag: bag,
  };
});

import {useAIChatStore} from '../useAIChatStore';
import type {AIChatMessage} from '../../types/aiChat.types';

const STORAGE_KEY = 'ai_chat_messages_v1';

const getStorageBag = (): Record<string, string> => {
  const mocked = jest.requireMock('react-native-mmkv') as {__mmkvBag: Record<string, string>};
  return mocked.__mmkvBag;
};

const clearStorageBag = () => {
  const bag = getStorageBag();
  Object.keys(bag).forEach(key => delete bag[key]);
};

const createMessage = (id: string, role: AIChatMessage['role'], content: string): AIChatMessage => ({
  id,
  role,
  content,
  createdAt: Date.now(),
  status: 'success',
});

describe('useAIChatStore', () => {
  beforeEach(() => {
    clearStorageBag();
    useAIChatStore.setState({messages: [], isLoading: false});
  });

  it('adds and updates message then persists to MMKV', () => {
    useAIChatStore.getState().addMessage(createMessage('m1', 'user', 'xin chao'));
    useAIChatStore.getState().updateMessage('m1', {content: 'xin chao paynote'});

    const {messages} = useAIChatStore.getState();
    expect(messages).toHaveLength(1);
    expect(messages[0]?.content).toBe('xin chao paynote');

    const bag = getStorageBag();
    const persisted = JSON.parse(bag[STORAGE_KEY] || '[]') as AIChatMessage[];
    expect(persisted).toHaveLength(1);
    expect(persisted[0]?.content).toBe('xin chao paynote');
  });

  it('loads messages from storage and clears correctly', () => {
    const persisted: AIChatMessage[] = [
      createMessage('a1', 'assistant', 'test stored message'),
    ];
    const bag = getStorageBag();
    bag[STORAGE_KEY] = JSON.stringify(persisted);

    useAIChatStore.getState().loadMessages();
    expect(useAIChatStore.getState().messages).toHaveLength(1);
    expect(useAIChatStore.getState().messages[0]?.id).toBe('a1');

    useAIChatStore.getState().clearMessages();
    expect(useAIChatStore.getState().messages).toHaveLength(0);
    expect(bag[STORAGE_KEY]).toBeUndefined();
  });
});
