import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useThemeColors} from '../../shared/theme';
import {AI_QUICK_PROMPTS} from '../../features/ai/constants/aiQuickPrompts';
import {useAIChatStore} from '../../features/ai/store/useAIChatStore';
import {createAIChatMessageId, type AIChatMessage} from '../../features/ai/types/aiChat.types';
import {sendAIChatMessage} from '../../features/ai/services/aiChatService';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AIQuickPromptList from '../../features/ai/components/AIQuickPromptList';
import AIMessageBubble from '../../features/ai/components/AIMessageBubble';

const AIChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const t = useThemeColors();
  const C = useMemo(() => ({
    bg: t.appBg,
    card: t.surface,
    border: t.border,
    txt: t.textPrimary,
    sub: t.textSecondary,
    acc: t.primaryDeep,
    accSoft: t.primarySoft,
    muted: t.surfaceMuted,
    userBubble: t.primarySoft,
    userText: t.textPrimary,
    assistantBubble: t.surfaceMuted,
    assistantText: t.textPrimary,
    inputBg: t.surface,
    onAccent: t.textOnDark,
    danger: t.expense,
  }), [t]);
  const s = useMemo(() => createStyles(C), [C]);

  const scrollRef = useRef<ScrollView | null>(null);
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messages = useAIChatStore(state => state.messages);
  const isLoading = useAIChatStore(state => state.isLoading);
  const addMessage = useAIChatStore(state => state.addMessage);
  const updateMessage = useAIChatStore(state => state.updateMessage);
  const setLoading = useAIChatStore(state => state.setLoading);

  const [input, setInput] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  type AssistantMetadata = NonNullable<AIChatMessage['metadata']>;

  useEffect(() => {
    const id = setTimeout(() => {
      scrollRef.current?.scrollToEnd({animated: true});
    }, 40);
    return () => clearTimeout(id);
  }, [messages]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => () => {
    if (streamTimerRef.current) {
      clearTimeout(streamTimerRef.current);
    }
  }, []);

  const streamAssistantMessage = (
    assistantId: string,
    fullText: string,
    metadata: AssistantMetadata,
    status: 'success' | 'error',
  ): Promise<void> => new Promise(resolve => {
    const words = fullText.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      updateMessage(assistantId, {
        content: fullText,
        status,
        metadata,
      });
      resolve();
      return;
    }

    let index = 0;
    const step = () => {
      index = Math.min(index + 3, words.length);
      updateMessage(assistantId, {
        content: `${words.slice(0, index).join(' ')}${index < words.length ? ' ▌' : ''}`,
        status: 'sending',
        metadata,
      });

      if (index >= words.length) {
        updateMessage(assistantId, {
          content: fullText,
          status,
          metadata,
        });
        resolve();
        return;
      }

      streamTimerRef.current = setTimeout(step, 28);
    };

    step();
  });

  const sendMessage = async (draft?: string) => {
    const content = (typeof draft === 'string' ? draft : input).trim();
    if (!content || isLoading) {
      return;
    }

    const userId = createAIChatMessageId();
    const assistantId = createAIChatMessageId();

    addMessage({
      id: userId,
      role: 'user',
      content,
      createdAt: Date.now(),
      status: 'success',
      metadata: {source: 'local'},
    });

    addMessage({
      id: assistantId,
      role: 'assistant',
      content: 'Đang chuẩn bị câu trả lời...',
      createdAt: Date.now() + 1,
      status: 'sending',
      metadata: {source: 'fallback'},
    });

    setInput('');
    setLoading(true);
    try {
      const assistantMessage = await sendAIChatMessage(content);
      await streamAssistantMessage(
        assistantId,
        assistantMessage.content,
        assistantMessage.metadata || {source: 'local'},
        'success',
      );
    } catch {
      await streamAssistantMessage(
        assistantId,
        'Hiện tại chưa xử lý được câu hỏi này. Bạn thử diễn đạt lại ngắn hơn nhé.',
        {source: 'fallback'},
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    sendMessage(prompt).catch(() => {});
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
      <View style={s.headerCard}>
        <Text style={s.headerTitle}>aQuang</Text>
        <Text style={s.headerSub}>Hỏi aQuang về chi tiêu của bạn</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.messages}
        contentContainerStyle={s.messagesContent}
        keyboardShouldPersistTaps="handled">
        {messages.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>Sẵn sàng hỗ trợ bạn</Text>
            <Text style={s.emptySub}>Chọn gợi ý bên dưới hoặc nhập câu hỏi của bạn.</Text>
          </View>
        ) : (
          messages.map(message => (
            <AIMessageBubble
              key={message.id}
              message={message}
              colors={{
                border: C.border,
                sub: C.sub,
                userBubble: C.userBubble,
                userText: C.userText,
                assistantBubble: C.assistantBubble,
                assistantText: C.assistantText,
                cardBg: C.card,
                cardBorder: C.border,
                accent: C.acc,
              }}
            />
          ))
        )}
      </ScrollView>

      <View style={[s.quickPromptWrap, Platform.OS === 'android' && isKeyboardVisible && s.quickPromptWrapKeyboard]}>
        <AIQuickPromptList
          prompts={AI_QUICK_PROMPTS}
          onPressPrompt={handleQuickPrompt}
          disabled={isLoading}
          colorBorder={C.border}
          colorBg={C.muted}
          colorText={C.acc}
        />
      </View>

      <View style={[s.inputRow, {paddingBottom: Math.max(8, insets.bottom)}]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Nhập câu hỏi tài chính..."
          placeholderTextColor={C.sub}
          style={s.input}
          editable={!isLoading}
          onSubmitEditing={() => { sendMessage().catch(() => {}); }}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || isLoading) && s.sendBtnDisabled]}
          disabled={!input.trim() || isLoading}
          onPress={() => { sendMessage().catch(() => {}); }}>
          <Text style={s.sendBtnTxt}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (C: {
  bg: string;
  card: string;
  border: string;
  txt: string;
  sub: string;
  acc: string;
  accSoft: string;
  muted: string;
  userBubble: string;
  userText: string;
  assistantBubble: string;
  assistantText: string;
  inputBg: string;
  onAccent: string;
  danger: string;
}) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginTop: 8,
    marginBottom: 10,
  },
  headerTitle: {
    color: C.txt,
    fontSize: 24,
    fontWeight: '800',
  },
  headerSub: {
    color: C.sub,
    fontSize: 13,
    marginTop: 4,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 12,
    gap: 8,
  },
  emptyCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  emptyTitle: {
    color: C.txt,
    fontSize: 14,
    fontWeight: '700',
  },
  emptySub: {
    color: C.sub,
    fontSize: 12,
    marginTop: 4,
  },
  quickPromptWrap: {
    marginTop: 8,
    marginBottom: 8,
  },
  quickPromptWrapKeyboard: {
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.txt,
    fontSize: 14,
  },
  sendBtn: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.acc,
    borderWidth: 1,
    borderColor: C.acc,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnTxt: {
    color: C.onAccent,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default AIChatScreen;
