import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import dayjs from 'dayjs';
import {useAppStore} from '../../app/store';
import {CATEGORY_EMOJI, getCategoryLabel} from '../../shared/constants';
import {useThemeColors} from '../../shared/theme';
import AppIcon from '../../shared/components/AppIcon';

const NotificationsScreen: React.FC = () => {
  const t = useThemeColors();
  const C = useMemo(() => ({
    bg: t.appBg,
    card: t.surface,
    border: t.border,
    txt: t.textPrimary,
    sub: t.textSecondary,
    warn: t.expense,
    acc: t.primaryDeep,
    muted: t.surfaceMuted,
    soft: t.primarySoft,
    unreadBg: t.surfaceMuted,
    unreadBorder: t.expense,
  }), [t]);
  const s = useMemo(() => createStyles(C), [C]);
  const {
    inAppNotifications,
    markInAppNotificationRead,
    markInAppNotificationUnread,
    deleteInAppNotification,
  } = useAppStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isSelectionMode = selectedIds.length > 0;

  const unreadCount = useMemo(
    () => inAppNotifications.filter(item => !item.isRead).length,
    [inAppNotifications],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    setSelectedIds(inAppNotifications.map(item => item.id));
  };

  const handleMarkUnread = () => {
    selectedIds.forEach(id => markInAppNotificationUnread(id));
    setSelectedIds([]);
  };

  const handleDelete = () => {
    selectedIds.forEach(id => deleteInAppNotification(id));
    setSelectedIds([]);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.headerCard}>
        <Text style={s.headerTitle}>Trung tâm thông báo</Text>
        <Text style={s.headerSub}>Bạn có {unreadCount} thông báo chưa đọc</Text>
        {isSelectionMode && (
          <View style={s.headerActions}>
            <TouchableOpacity style={s.secondaryBtn} onPress={handleSelectAll}>
              <Text style={s.secondaryTxt}>Chọn tất cả</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.secondaryBtn} onPress={handleMarkUnread}>
              <Text style={s.secondaryTxt}>Đánh dấu chưa đọc</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.secondaryBtn} onPress={handleDelete}>
              <Text style={[s.secondaryTxt, {color: C.warn}]}>Xoá</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {inAppNotifications.length === 0 ? (
        <View style={s.emptyCard}>
          <AppIcon name="inbox" size={38} color={C.sub} />
          <Text style={s.emptyTitle}>Chưa có thông báo</Text>
          <Text style={s.emptySub}>Cảnh báo chi tiêu sẽ hiển thị tại đây.</Text>
        </View>
      ) : (
        inAppNotifications.map(item => {
          const emoji = item.categoryId ? (CATEGORY_EMOJI[item.categoryId] || '📌') : '📌';
          const isSelected = selectedIds.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[s.card, !item.isRead && s.cardUnread, isSelected && s.cardSelected]}
              onPress={() => {
                if (isSelectionMode) {
                  toggleSelect(item.id);
                  return;
                }
                markInAppNotificationRead(item.id);
              }}
              onLongPress={() => {
                if (!isSelectionMode) {
                  setSelectedIds([item.id]);
                  return;
                }
                toggleSelect(item.id);
              }}
              activeOpacity={0.9}>
              <View style={s.row}>
                {isSelectionMode && (
                  <View style={[s.checkbox, isSelected && s.checkboxSelected]}>
                    <Text style={s.checkboxMark}>{isSelected ? '✓' : ''}</Text>
                  </View>
                )}
                <View style={s.emojiWrap}>
                  <Text style={s.emoji}>{emoji}</Text>
                </View>
                <View style={{flex: 1}}>
                  <View style={s.titleRow}>
                    <View style={s.titleWrap}>
                      <Text style={s.title}>{item.title}</Text>
                      {item.source === 'ai_fallback' && (
                        <View style={s.aiBadge}>
                          <Text style={s.aiBadgeTxt}>AI</Text>
                        </View>
                      )}
                      {item.toneTag && (
                        <View style={s.personaBadge}>
                          <Text style={s.personaBadgeTxt}>
                            {item.toneTag === 'advisor'
                              ? 'Cố vấn'
                              : item.toneTag === 'wallet_pet'
                                ? 'Ví bé'
                                : item.toneTag === 'toxic_friend'
                                  ? 'Toxic'
                                  : 'Mẹ Việt'}
                          </Text>
                        </View>
                      )}
                      {item.severity && (
                        <View style={[
                          s.levelBadge,
                          item.severity === 'critical'
                            ? s.levelCritical
                            : item.severity === 'high'
                              ? s.levelHigh
                              : item.severity === 'medium'
                                ? s.levelMedium
                                : s.levelLow,
                        ]}>
                          <Text style={s.levelBadgeTxt}>{item.severity}</Text>
                        </View>
                      )}
                      {item.escalationTier && (
                        <View style={s.tierBadge}>
                          <Text style={s.tierBadgeTxt}>T{item.escalationTier}</Text>
                        </View>
                      )}
                    </View>
                    {!item.isRead && <View style={s.dot} />}
                  </View>
                  <Text style={s.message}>{item.message}</Text>
                  <Text style={s.meta}>
                    {item.categoryId ? `${getCategoryLabel(item.categoryId)} • ` : ''}
                    {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
};

const createStyles = (C: {
  bg: string;
  card: string;
  border: string;
  txt: string;
  sub: string;
  warn: string;
  acc: string;
  muted: string;
  soft: string;
  unreadBg: string;
  unreadBorder: string;
}) => StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  content: {padding: 16, paddingBottom: 30},
  headerCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  headerTitle: {color: C.txt, fontSize: 18, fontWeight: '800'},
  headerSub: {color: C.sub, fontSize: 13, marginTop: 4},
  headerActions: {flexDirection: 'row', gap: 8, marginTop: 12},
  secondaryBtn: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.muted,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  secondaryTxt: {color: C.acc, fontSize: 12, fontWeight: '700'},
  emptyCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyTitle: {color: C.txt, fontSize: 16, fontWeight: '700', marginTop: 8},
  emptySub: {color: C.sub, fontSize: 13, marginTop: 4},
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
  },
  cardUnread: {
    borderColor: C.unreadBorder,
    backgroundColor: C.unreadBg,
  },
  cardSelected: {
    borderColor: C.acc,
    backgroundColor: C.soft,
  },
  row: {flexDirection: 'row', gap: 10},
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  checkboxSelected: {
    borderColor: C.acc,
    backgroundColor: C.soft,
  },
  checkboxMark: {color: C.acc, fontSize: 13, fontWeight: '800'},
  emojiWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {fontSize: 18},
  titleRow: {flexDirection: 'row', alignItems: 'flex-start'},
  titleWrap: {flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6},
  title: {color: C.txt, fontSize: 15, fontWeight: '700', flexShrink: 1},
  aiBadge: {
    borderWidth: 1,
    borderColor: C.acc,
    backgroundColor: C.soft,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiBadgeTxt: {color: C.acc, fontSize: 10, fontWeight: '800'},
  personaBadge: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.muted,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  personaBadgeTxt: {color: C.sub, fontSize: 10, fontWeight: '700'},
  levelBadge: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  levelLow: {backgroundColor: '#e4f7ea'},
  levelMedium: {backgroundColor: '#fff1d7'},
  levelHigh: {backgroundColor: '#ffd8d8'},
  levelCritical: {backgroundColor: '#ffb8b8'},
  levelBadgeTxt: {color: '#812f2f', fontSize: 10, fontWeight: '800'},
  tierBadge: {
    borderWidth: 1,
    borderColor: C.acc,
    backgroundColor: C.soft,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tierBadgeTxt: {color: C.acc, fontSize: 10, fontWeight: '800'},
  dot: {width: 8, height: 8, borderRadius: 4, backgroundColor: C.warn, marginLeft: 8, marginTop: 5},
  message: {color: C.txt, fontSize: 13, marginTop: 4, lineHeight: 18},
  meta: {color: C.sub, fontSize: 12, marginTop: 6},
});

export default NotificationsScreen;
