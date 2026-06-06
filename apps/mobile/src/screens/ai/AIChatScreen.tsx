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
  useWindowDimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';
import {useThemeColors} from '../../shared/theme';
import {AI_QUICK_PROMPT_CHIPS} from '../../features/ai/constants/aiQuickPrompts';
import {useAIChatStore} from '../../features/ai/store/useAIChatStore';
import {createAIChatMessageId, type AIAction, type AIChatMessage} from '../../features/ai/types/aiChat.types';
import {sendAIChatMessage} from '../../features/ai/services/aiChatService';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AIQuickPromptList from '../../features/ai/components/AIQuickPromptList';
import AIMessageBubble from '../../features/ai/components/AIMessageBubble';
import {toast} from '../../shared/components/Toast';
import {dialog} from '../../shared/components/Dialog';
import {toMonthKey, useAppStore} from '../../app/store';
import {CATEGORY_LABELS} from '../../shared/constants/categories';

const PROVIDER_OPTIONS = [
  {id: 'auto', label: 'Auto'},
  {id: 'mock', label: 'Mock'},
  {id: 'gemini', label: 'Gemini'},
  {id: 'openai', label: 'OpenAI'},
] as const;

const ANDROID_COMPOSER_BOTTOM_GAP = 12;
const formatVnd = (value: number): string => `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}đ`;
const toActionKey = (action: AIAction): string => {
  if (action.type === 'set_budget') {
    return `${action.type}:${action.categoryId}:${action.amount}`;
  }
  if (action.type === 'mark_duplicate' || action.type === 'ignore_duplicate') {
    return `${action.type}:${action.transactionIds.slice().sort().join('|')}`;
  }
  if (action.type === 'open_transaction') {
    return `${action.type}:${action.transactionId}`;
  }
  return action.type;
};

const AIChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const {height: windowHeight} = useWindowDimensions();
  const t = useThemeColors();
  const C = useMemo(() => ({
    bg: t.appBg,
    card: t.surface,
    border: t.border,
    primary: t.primary,
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
    shadow: t.shadow,
    danger: t.expense,
  }), [t]);
  const s = useMemo(() => createStyles(C), [C]);

  const scrollRef = useRef<ScrollView | null>(null);
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quickPromptSheetRef = useRef<BottomSheetModal | null>(null);
  const quickPromptSnapPoints = useMemo(() => ['52%'], []);

  const messages = useAIChatStore(state => state.messages);
  const isLoading = useAIChatStore(state => state.isLoading);
  const addMessage = useAIChatStore(state => state.addMessage);
  const updateMessage = useAIChatStore(state => state.updateMessage);
  const setLoading = useAIChatStore(state => state.setLoading);
  const markDuplicateReview = useAppStore(state => state.markDuplicateReview);
  const setCategoryBudget = useAppStore(state => state.setCategoryBudget);
  const getBudgetStatus = useAppStore(state => state.getBudgetStatus);
  const customCategories = useAppStore(state => state.customCategories);
  const aiProviderPreference = useAppStore(state => state.aiProviderPreference);
  const setAIProviderPreference = useAppStore(state => state.setAIProviderPreference);
  const setAIUseOnline = useAppStore(state => state.setAIUseOnline);

  const [input, setInput] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardFrameY, setKeyboardFrameY] = useState<number | null>(null);
  const [quickMenuExpanded, setQuickMenuExpanded] = useState(false);
  type AssistantMetadata = NonNullable<AIChatMessage['metadata']>;
  const androidKeyboardOverlap = Platform.OS === 'android' && keyboardFrameY !== null
    ? Math.max(0, windowHeight - keyboardFrameY)
    : 0;
  const androidKeyboardAvoidanceStyle = Platform.OS === 'android' && androidKeyboardOverlap > 0
    ? {paddingBottom: androidKeyboardOverlap + ANDROID_COMPOSER_BOTTOM_GAP}
    : null;
  const inputRowBottomStyle = useMemo(() => ({
    paddingBottom: Platform.OS === 'android' && isKeyboardVisible ? 8 : Math.max(8, insets.bottom),
  }), [insets.bottom, isKeyboardVisible]);

  const openTransactionFromAI = (transactionId: string) => {
    if (!transactionId) {
      return;
    }
    navigation.navigate('MainTabs', {
      screen: 'Transactions',
      params: {
        fromDashboard: {
          transactionId,
          ts: Date.now(),
        },
      },
    });
  };

  const markAIActionDone = (messageId: string | undefined, action: AIAction, label: string) => {
    if (!messageId) {
      return;
    }

    const message = useAIChatStore.getState().messages.find(item => item.id === messageId);
    const cards = message?.metadata?.cards;
    if (!message?.metadata || !cards) {
      return;
    }

    updateMessage(messageId, {
      metadata: {
        ...message.metadata,
        cards: cards.map(card => {
          if (card.type !== 'warning' || !card.actions) {
            return card;
          }
          return {
            ...card,
            actions: card.actions.map(item => {
              if (toActionKey(item.action) === toActionKey(action)) {
                return {
                  ...item,
                  label,
                  disabled: true,
                };
              }
              return item;
            }),
          };
        }),
      },
    });
  };

  const handleAIAction = (action: AIAction, messageId?: string) => {
    if (action.type === 'open_transaction') {
      openTransactionFromAI(action.transactionId);
      return;
    }

    if (action.type === 'open_import') {
      navigation.navigate('PersonalFinance');
      return;
    }

    if (action.type === 'view_gap_warnings') {
      navigation.navigate('MainTabs', {
        screen: 'Transactions',
        params: {
          fromDashboard: {
            filter: 'all',
            ts: Date.now(),
          },
        },
      });
      return;
    }

    if (action.type === 'mark_duplicate') {
      dialog.confirm(
        'Đánh dấu giao dịch trùng',
        `Xác nhận lưu nhóm ${action.transactionIds.length} giao dịch là "đã xử lý trùng"?`,
        {
          confirmText: 'Xác nhận',
          cancelText: 'Hủy',
          onConfirm: () => {
            markDuplicateReview(action.transactionIds, 'marked');
            markAIActionDone(messageId, action, 'Đã đánh dấu');
            if (action.transactionIds[0]) {
              openTransactionFromAI(action.transactionIds[0]);
            }
            toast.success('Đã lưu trạng thái nhóm trùng. AI sẽ không nhắc lại nhóm này.');
          },
        },
      );
      return;
    }

    if (action.type === 'ignore_duplicate') {
      dialog.confirm(
        'Bỏ qua nghi ngờ trùng',
        `Bỏ qua nhóm gồm ${action.transactionIds.length} giao dịch này? AI sẽ không nhắc lại nhóm này.`,
        {
          confirmText: 'Bỏ qua',
          cancelText: 'Hủy',
          onConfirm: () => {
            markDuplicateReview(action.transactionIds, 'ignored');
            markAIActionDone(messageId, action, 'Đã bỏ qua');
            toast.success('Đã bỏ qua. AI sẽ không nhắc lại nhóm giao dịch này.');
          },
        },
      );
      return;
    }

    if (action.type === 'set_budget') {
      const amount = Math.round(action.amount);
      if (!action.categoryId || !Number.isFinite(amount) || amount <= 0) {
        toast.error('Ngân sách AI đề xuất không hợp lệ.');
        return;
      }

      const categoryLabel = CATEGORY_LABELS[action.categoryId] || customCategories[action.categoryId]?.name;
      if (!categoryLabel) {
        toast.error('aQuang chưa nhận ra danh mục ngân sách này.');
        return;
      }

      const now = dayjs();
      const year = now.year();
      const month = now.month() + 1;
      const monthKey = toMonthKey(year, month);
      const currentStatus = getBudgetStatus(action.categoryId, year, month);
      const overwriteText = currentStatus.exists
        ? `\n\nNgân sách hiện tại là ${formatVnd(currentStatus.limit)} và sẽ đổi thành ${formatVnd(amount)}.`
        : '';

      dialog.confirm(
        'Đặt ngân sách tháng này',
        `Đặt ngân sách ${categoryLabel} tháng này là ${formatVnd(amount)}?${overwriteText}`,
        {
          confirmText: 'Đặt ngân sách',
          cancelText: 'Hủy',
          onConfirm: () => {
            setCategoryBudget(action.categoryId, monthKey, amount);
            markAIActionDone(messageId, action, 'Đã đặt');
            toast.success(`Đã đặt ngân sách ${categoryLabel} tháng này là ${formatVnd(amount)}.`);
          },
        },
      );
    }
  };

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

    const showSub = Keyboard.addListener('keyboardDidShow', event => {
      setIsKeyboardVisible(true);
      const screenY = event.endCoordinates?.screenY;
      const keyboardHeight = event.endCoordinates?.height;
      setKeyboardFrameY(
        typeof screenY === 'number'
          ? screenY
          : typeof keyboardHeight === 'number'
            ? windowHeight - keyboardHeight
            : null,
      );
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      setKeyboardFrameY(null);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [windowHeight]);

  useEffect(() => {
    if (!isKeyboardVisible) {
      return;
    }

    const id = setTimeout(() => {
      scrollRef.current?.scrollToEnd({animated: true});
    }, 80);
    return () => clearTimeout(id);
  }, [androidKeyboardOverlap, isKeyboardVisible]);

  useEffect(() => () => {
    if (streamTimerRef.current) {
      clearTimeout(streamTimerRef.current);
    }
  }, []);

  const handleQuickLauncherPress = () => {
    if (quickMenuExpanded) {
      quickPromptSheetRef.current?.dismiss();
      return;
    }
    quickPromptSheetRef.current?.present();
  };

  const renderSheetBackdrop = (props: any) => (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.22} />
  );

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
      style={[s.container, androidKeyboardAvoidanceStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
      <View style={s.headerCard}>
        <Text style={s.headerTitle}>aQuang</Text>
        <Text style={s.headerSub}>Hỏi aQuang về chi tiêu của bạn</Text>
        <View style={s.providerRow}>
          {PROVIDER_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[s.providerChip, aiProviderPreference === option.id && s.providerChipActive]}
              onPress={() => {
                setAIProviderPreference(option.id);
                if (option.id !== 'mock') {
                  setAIUseOnline(true);
                }
              }}>
              <Text style={[s.providerChipTxt, aiProviderPreference === option.id && s.providerChipTxtActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
              onPressTransaction={openTransactionFromAI}
              onPressAction={handleAIAction}
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
          prompts={AI_QUICK_PROMPT_CHIPS}
          onPressPrompt={handleQuickPrompt}
          expanded={quickMenuExpanded}
          onPressLauncher={handleQuickLauncherPress}
          disabled={isLoading}
          colorBorder={C.border}
          colorBg={C.muted}
          colorText={C.acc}
          fabColor={C.primary}
          fabIconColor={C.onAccent}
          fabShadowColor={C.shadow}
          maxVisibleChips={isKeyboardVisible ? 2 : undefined}
          showExpand={!isKeyboardVisible}
        />
      </View>

      <BottomSheetModal
        ref={quickPromptSheetRef}
        index={0}
        snapPoints={quickPromptSnapPoints}
        backdropComponent={renderSheetBackdrop}
        onChange={index => {
          setQuickMenuExpanded(index >= 0);
        }}
        onDismiss={() => {
          setQuickMenuExpanded(false);
        }}
        enablePanDownToClose
        handleIndicatorStyle={s.quickPromptHandleIndicator}
        backgroundStyle={s.quickPromptSheetBg}>
        <BottomSheetScrollView contentContainerStyle={s.quickPromptSheetContent}>
          <Text style={s.quickPromptSheetTitle}>Câu hỏi nhanh</Text>
          <View style={s.quickPromptSheetList}>
            {AI_QUICK_PROMPT_CHIPS.map(item => (
              <TouchableOpacity
                key={item.prompt}
                style={s.quickPromptSheetItem}
                onPress={() => {
                  handleQuickPrompt(item.prompt);
                  quickPromptSheetRef.current?.dismiss();
                }}>
                <Text style={s.quickPromptSheetItemText}>{item.prompt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      <View style={[s.inputRow, inputRowBottomStyle]}>
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
  primary: string;
  acc: string;
  accSoft: string;
  muted: string;
  userBubble: string;
  userText: string;
  assistantBubble: string;
  assistantText: string;
  inputBg: string;
  onAccent: string;
  shadow: string;
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
  providerRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  providerChip: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.muted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  providerChipActive: {
    borderColor: C.acc,
    backgroundColor: C.accSoft,
  },
  providerChipTxt: {
    color: C.sub,
    fontSize: 11,
    fontWeight: '700',
  },
  providerChipTxtActive: {
    color: C.acc,
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
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -98,
    zIndex: 40,
    elevation: 40,
  },
  quickPromptWrapKeyboard: {
    marginTop: -98,
  },
  quickPromptSheetBg: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  quickPromptHandleIndicator: {
    backgroundColor: C.border,
    width: 40,
    height: 4,
  },
  quickPromptSheetContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  quickPromptSheetTitle: {
    color: C.txt,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  quickPromptSheetList: {
    gap: 8,
  },
  quickPromptSheetItem: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.muted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  quickPromptSheetItemText: {
    color: C.acc,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
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
