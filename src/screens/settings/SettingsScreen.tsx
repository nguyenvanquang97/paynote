import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  AppState,
} from 'react-native';
import {
  checkNotificationAccess,
  checkBatteryOptimizationDisabled,
  openNotificationSettings,
  openBatteryOptimizationSettings,
} from '../../native';
import { useAppStore } from '../../app/store';
import ProfileModal from './ProfileModal';
import { checkForUpdates } from '../../services/updater';
import DeviceInfo from 'react-native-device-info';
import { useThemeColors, THEME_REGISTRY } from '../../shared/theme';
import AppIcon from '../../shared/components/AppIcon';
import { SUPPORTED_BANKS } from '../../shared/constants';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const C = useMemo(() => ({
    bg: colors.appBg,
    card: colors.surface,
    border: colors.border,
    pri: colors.primary,
    ok: colors.income,
    err: colors.expense,
    txt: colors.textPrimary,
    sub: colors.textSecondary,
    acc: colors.primaryDeep,
    muted: colors.surfaceMuted,
    onDark: colors.textOnDark,
    soft: colors.primarySoft,
  }), [colors]);
  const s = useMemo(() => createStyles(C), [C]);

  const {
    hasNotificationAccess,
    setNotificationAccess,
    profile,
    themeMode,
    setThemeMode,
  } = useAppStore();
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isBatteryOptimizationDisabled, setIsBatteryOptimizationDisabled] = useState(false);

  const checkAccess = useCallback(async () => {
    setNotificationAccess(await checkNotificationAccess());
    setIsBatteryOptimizationDisabled(await checkBatteryOptimizationDisabled());
  }, [setNotificationAccess]);

  useEffect(() => {
    checkAccess();

    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        checkAccess();
      }
    });

    return () => sub.remove();
  }, [checkAccess]);

  const renderModeButton = (mode: string, label: string) => (
    <TouchableOpacity
      key={mode}
      style={[s.modePill, themeMode === mode && s.modePillActive]}
      onPress={() => setThemeMode(mode)}>
      <Text style={[s.modePillText, themeMode === mode && s.modePillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <React.Fragment>
      <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={s.profileContainer}>
          <View style={s.profileAvatar}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={{ width: 60, height: 60, borderRadius: 30 }} />
            ) : (
              <AppIcon name="user" size={34} color={C.acc} />
            )}
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{profile.name}</Text>
            <Text style={s.profileDesc}>{profile.nickname?.trim() || 'Người dùng PayNote'}</Text>
          </View>
          <TouchableOpacity style={s.profileEditBtn} onPress={() => setIsProfileModalVisible(true)}>
            <Text style={s.profileEditTxt}>Sửa</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sec}>Giao diện</Text>
        <View style={s.card}>
          <Text style={s.label}>Chế độ</Text>
          <View style={s.modeRow}>
            {THEME_REGISTRY.map(t => renderModeButton(t.id, t.label, t.emoji))}
          </View>
        </View>

        <Text style={s.sec}>Tài chính cá nhân</Text>
        <TouchableOpacity style={s.card} onPress={() => navigation.navigate('BudgetSettings')}>
          <View style={s.row}>
            <View style={s.iconWrap}><AppIcon name="list" size={20} color={C.acc} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Cài đặt ngân sách</Text>
              <Text style={s.desc}>Hạn mức theo danh mục và cảnh báo ngưỡng chi tiêu</Text>
            </View>
            <AppIcon name="chevron-right" size={16} color={C.sub} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.card} onPress={() => navigation.navigate('PersonalFinance')}>
          <View style={s.row}>
            <View style={s.iconWrap}><AppIcon name="list" size={20} color={C.acc} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Sao lưu & tiện ích cá nhân</Text>
              <Text style={s.desc}>Danh mục ưa thích, ghi chú tháng, import/export và reset dữ liệu</Text>
            </View>
            <AppIcon name="chevron-right" size={16} color={C.sub} />
          </View>
        </TouchableOpacity>

        <Text style={s.sec}>Quyền truy cập</Text>
        <View style={s.card}>
          <View style={s.row}><View style={s.iconWrap}><AppIcon name="bell" size={20} color={C.acc} /></View><View style={{ flex: 1 }}><Text style={s.label}>Notification Access</Text><Text style={s.desc}>Cần để đọc thông báo ngân hàng</Text></View>
            <View style={[s.badge, { backgroundColor: hasNotificationAccess ? C.soft : '#fde7e3' }]}><Text style={{ color: hasNotificationAccess ? C.ok : C.err, fontSize: 12, fontWeight: '600' }}>{hasNotificationAccess ? 'Đã bật' : 'Tắt'}</Text></View></View>
          {!hasNotificationAccess && <TouchableOpacity style={s.btn} onPress={() => { openNotificationSettings(); setTimeout(checkAccess, 3000); }}><Text style={s.btnTxt}>Mở cài đặt</Text></TouchableOpacity>}
        </View>
        <View style={s.card}><View style={s.row}><View style={s.iconWrap}><AppIcon name="battery" size={20} color={C.acc} /></View><View style={{ flex: 1 }}><Text style={s.label}>Battery Optimization</Text><Text style={s.desc}>Tắt tối ưu pin để app chạy nền</Text></View>
          <View style={[s.badge, { backgroundColor: isBatteryOptimizationDisabled ? C.soft : '#fde7e3' }]}><Text style={{ color: isBatteryOptimizationDisabled ? C.ok : C.err, fontSize: 12, fontWeight: '600' }}>{isBatteryOptimizationDisabled ? 'Đã tắt' : 'Đang bật'}</Text></View></View>
          <TouchableOpacity style={s.btn} onPress={() => { openBatteryOptimizationSettings(); setTimeout(checkAccess, 1500); }}><Text style={s.btnTxt}>Cài đặt pin</Text></TouchableOpacity></View>

        <Text style={s.sec}>Ngân hàng hỗ trợ  <Text style={s.note}>*Liên hệ aQuang để thêm ngân hàng</Text></Text>

        <View style={s.card}>
          {Object.values(SUPPORTED_BANKS).map((b, i) => (
            <View
              key={b.name}
              style={[
                { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
                i > 0 && { borderTopWidth: 1, borderTopColor: C.border },
              ]}>
              {b.logo ? (
                <Image
                  source={{ uri: b.logo }}
                  style={{ width: 28, height: 28, borderRadius: 6, resizeMode: 'contain' }}
                />
              ) : (
                <View style={{ width: 10, height: 10, borderRadius: 5 }} />
              )}
              <Text style={{ color: C.txt, fontSize: 15, fontWeight: '500' }}>{b.name}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sec}>Thông tin</Text>
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
            <Text style={{ color: C.sub, fontSize: 14 }}>Phiên bản</Text>
            <Text style={{ color: C.txt, fontSize: 14 }}>{DeviceInfo.getVersion()}</Text>
          </View>
          <TouchableOpacity
            style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, marginTop: 4, borderTopWidth: 1, borderTopColor: C.border }}
            onPress={() => checkForUpdates(false)}
          >
            <Text style={{ color: C.sub, fontSize: 14 }}>Cập nhật ứng dụng</Text>
            <Text style={{ color: C.pri, fontSize: 14, fontWeight: '600' }}>Kiểm tra ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <ProfileModal visible={isProfileModalVisible} onClose={() => setIsProfileModalVisible(false)} />
    </React.Fragment>
  );
};

const createStyles = (C: {
  bg: string;
  card: string;
  border: string;
  pri: string;
  txt: string;
  sub: string;
  acc: string;
  muted: string;
  onDark: string;
  soft: string;
}) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  profileContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.border, justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' },
  profileInfo: { flex: 1 },
  profileName: { color: C.txt, fontSize: 18, fontWeight: '700' },
  profileDesc: { color: C.sub, fontSize: 13, marginTop: 4 },
  profileEditBtn: { backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  profileEditTxt: { color: C.txt, fontSize: 13, fontWeight: '600' },
  sec: { color: C.txt, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10, marginLeft: 4 },
  note: { color: C.sub, fontSize: 12, fontWeight: '400', marginBottom: 10, textTransform: 'lowercase' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.muted, alignItems: 'center', justifyContent: 'center' },
  label: { color: C.txt, fontSize: 15, fontWeight: '600' },
  desc: { color: C.sub, fontSize: 12, marginTop: 2 },
  badge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  btn: { marginTop: 12, backgroundColor: C.pri, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnTxt: { color: C.onDark, fontSize: 14, fontWeight: '700' },
  modeRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingVertical: 2 },
  modePill: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.muted,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modePillActive: {
    borderColor: C.pri,
    backgroundColor: C.soft,
  },
  modePillText: {
    color: C.sub,
    fontSize: 12,
    fontWeight: '700',
  },
  modePillTextActive: {
    color: C.acc,
  },
});

export default SettingsScreen;
