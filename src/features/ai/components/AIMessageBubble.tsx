import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import dayjs from 'dayjs';
import type {AIAnswerCard, AIChatMessage} from '../types/aiChat.types';
import AISummaryCard from './AISummaryCard';
import AICategoryBreakdownCard from './AICategoryBreakdownCard';
import AITransactionListCard from './AITransactionListCard';
import AIWarningCard from './AIWarningCard';

type Colors = {
  border: string;
  sub: string;
  userBubble: string;
  userText: string;
  assistantBubble: string;
  assistantText: string;
  cardBg: string;
  cardBorder: string;
  accent: string;
};

type Props = {
  message: AIChatMessage;
  colors: Colors;
  onPressTransaction?: (transactionId: string) => void;
};

const renderCard = (
  card: AIAnswerCard,
  key: string,
  colors: Colors,
  onPressTransaction?: (transactionId: string) => void,
) => {
  if (card.type === 'summary') {
    return (
      <AISummaryCard
        key={key}
        title={card.title}
        value={card.value}
        subtitle={card.subtitle}
        colorText={colors.assistantText}
        colorSub={colors.sub}
        colorBorder={colors.cardBorder}
        colorBg={colors.cardBg}
        colorAccent={colors.accent}
      />
    );
  }

  if (card.type === 'category_breakdown') {
    return (
      <AICategoryBreakdownCard
        key={key}
        items={card.items}
        colorText={colors.assistantText}
        colorSub={colors.sub}
        colorBorder={colors.cardBorder}
        colorBg={colors.cardBg}
      />
    );
  }

  if (card.type === 'transactions') {
    return (
      <AITransactionListCard
        key={key}
        items={card.items}
        onPressTransaction={onPressTransaction}
        colorText={colors.assistantText}
        colorSub={colors.sub}
        colorBorder={colors.cardBorder}
        colorBg={colors.cardBg}
      />
    );
  }

  return (
    <AIWarningCard
      key={key}
      title={card.title}
      description={card.description}
      severity={card.severity}
      colorText={colors.assistantText}
    />
  );
};

export default function AIMessageBubble({message, colors, onPressTransaction}: Props) {
  const isUser = message.role === 'user';
  const cards = message.metadata?.cards || [];

  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble,
        {
          borderColor: colors.border,
          backgroundColor: isUser ? colors.userBubble : colors.assistantBubble,
        },
      ]}>
      <Text style={[styles.text, {color: isUser ? colors.userText : colors.assistantText}]}> 
        {message.content}
      </Text>

      {!isUser && cards.length > 0 ? (
        <View>
          {cards.map((card, idx) => renderCard(card, `${message.id}_${card.type}_${idx}`, colors, onPressTransaction))}
        </View>
      ) : null}

      <Text style={[styles.meta, {color: colors.sub}]}> 
        {dayjs(message.createdAt).format('HH:mm')}
        {message.status === 'sending' ? ' • đang gửi' : ''}
        {message.status === 'error' ? ' • lỗi' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '88%',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderTopRightRadius: 6,
    borderTopLeftRadius: 14,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderTopRightRadius: 14,
    borderTopLeftRadius: 6,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    fontSize: 11,
    marginTop: 6,
  },
});
