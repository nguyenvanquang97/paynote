import React, {useState, useEffect, useMemo, useCallback} from 'react';
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
import {useAppStore} from '../../app/store';
import ProfileModal from './ProfileModal';
import {checkForUpdates} from '../../services/updater';
import DeviceInfo from 'react-native-device-info';
import {useThemeColors, THEME_REGISTRY} from '../../shared/theme';
import AppIcon from '../../shared/components/AppIcon';
import {SUPPORTED_BANKS} from '../../shared/constants';
import {useNavigation} from '@react-navigation/native';
import {useAuthStore} from '../../features/auth/authStore';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const signOut = useAuthStore(s => s.signOut);
  const colors = useThemeColors();
  const C = useMemo(
    () => ({
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
    }),
    [colors],
  );
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
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <View style={s.profileContainer}>
          <View style={s.profileAvatar}>
            {profile.avatarUrl ? (
              <Image source={{uri: profile.avatarUrl}} style={s.profileAvatarImage} />
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

        <Text style={s.sec}>Điều Khiển Nhanh</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.navRow} onPress={() => navigation.navigate('GeneralTools')}>
            <View style={s.rowLeft}>
              <View style={s.iconWrap}>
                <AppIcon name="list" size={20} color={C.acc} />
              </View>
              <View style={s.rowTextWrap}>
                <Text style={s.label}>Mở tiện ích chung</Text>
                <Text style={s.desc}>Ngân sách, sao lưu, thông báo, cập nhật</Text>
              </View>
            </View>
            <AppIcon name="chevron-right" size={16} color={C.sub} />
          </TouchableOpacity>
        </View>

        <Text style={s.sec}>Giao Diện</Text>
        <View style={s.card}>
          <Text style={s.label}>Chế độ hiển thị</Text>
          <View style={s.modeRow}>{THEME_REGISTRY.map(t => renderModeButton(t.id, t.label))}</View>
        </View>

        <Text style={s.sec}>AI Assistant</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.navRow} onPress={() => navigation.navigate('AISettings')}>
            <View style={s.rowLeft}>
              <View style={s.iconWrap}>
                <AppIcon name="info" size={20} color={C.acc} />
              </View>
              <View style={s.rowTextWrap}>
                <Text style={s.label}>Mở cài đặt AI</Text>
                <Text style={s.desc}>Provider, quyền dữ liệu, style, lịch sử chat</Text>
              </View>
            </View>
            <AppIcon name="chevron-right" size={16} color={C.sub} />
          </TouchableOpacity>
        </View>

        <Text style={s.sec}>Quyền Hệ Thống</Text>
        <View style={s.card}>
          <View style={s.statusRow}>
            <View style={s.rowLeft}>
              <View style={s.iconWrap}>
                <AppIcon name="bell" size={20} color={C.acc} />
              </View>
              <View style={s.rowTextWrap}>
                <Text style={s.label}>Notification Access</Text>
                <Text style={s.desc}>Cho phép app đọc thông báo ngân hàng</Text>
              </View>
            </View>
            <View style={[s.badge, hasNotificationAccess ? s.badgeOk : s.badgeErr]}>
              <Text style={[s.badgeTxt, {color: hasNotificationAccess ? C.ok : C.err}]}>
                {hasNotificationAccess ? 'Đã bật' : 'Tắt'}
              </Text>
            </View>
          </View>
          {!hasNotificationAccess && (
            <TouchableOpacity
              style={s.btn}
              onPress={() => {
                openNotificationSettings();
                setTimeout(checkAccess, 3000);
              }}>
              <Text style={s.btnTxt}>Mở cài đặt</Text>
            </TouchableOpacity>
          )}

          <View style={[s.statusRow, s.rowBorderTop, s.statusRowGap]}>
            <View style={s.rowLeft}>
              <View style={s.iconWrap}>
                <AppIcon name="battery" size={20} color={C.acc} />
              </View>
              <View style={s.rowTextWrap}>
                <Text style={s.label}>Battery Optimization</Text>
                <Text style={s.desc}>Tắt tối ưu pin để app chạy nền ổn định</Text>
              </View>
            </View>
            <View style={[s.badge, isBatteryOptimizationDisabled ? s.badgeOk : s.badgeErr]}>
              <Text style={[s.badgeTxt, {color: isBatteryOptimizationDisabled ? C.ok : C.err}]}>
                {isBatteryOptimizationDisabled ? 'Đã tắt' : 'Đang bật'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={s.btn}
            onPress={() => {
              openBatteryOptimizationSettings();
              setTimeout(checkAccess, 1500);
            }}>
            <Text style={s.btnTxt}>Cài đặt pin</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sec}>Ngân Hàng Hỗ Trợ</Text>
        <View style={s.card}>
          <Text style={s.desc}>Liên hệ aQuang nếu bạn cần thêm ngân hàng mới.</Text>
          {Object.values(SUPPORTED_BANKS).map((b, i) => (
            <View key={b.name} style={[s.bankRow, i > 0 && s.rowBorderTop]}>
              {b.logo ? (
                <Image source={{uri: b.logo}} style={s.bankLogo} />
              ) : (
                <View style={s.bankLogoFallback} />
              )}
              <Text style={s.bankName}>{b.name}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sec}>Thông Tin Ứng Dụng</Text>
        <View style={s.card}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Phiên bản</Text>
            <Text style={s.infoValue}>{DeviceInfo.getVersion()}</Text>
          </View>
          <TouchableOpacity style={[s.infoRow, s.rowBorderTop]} onPress={() => checkForUpdates(false)}>
            <Text style={s.infoLabel}>Cập nhật ứng dụng</Text>
            <Text style={s.infoAction}>Kiểm tra ngay</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={signOut}>
          <Text style={s.logoutTxt}>Đăng xuất</Text>
        </TouchableOpacity>
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
  ok: string;
  err: string;
  txt: string;
  sub: string;
  acc: string;
  muted: string;
  onDark: string;
  soft: string;
}) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: C.bg},
    content: {padding: 16, paddingBottom: 40},
    profileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: C.border,
    },
    profileAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: C.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      overflow: 'hidden',
    },
    profileAvatarImage: {width: 60, height: 60, borderRadius: 30},
    profileInfo: {flex: 1},
    profileName: {color: C.txt, fontSize: 18, fontWeight: '700'},
    profileDesc: {color: C.sub, fontSize: 13, marginTop: 4},
    profileEditBtn: {
      backgroundColor: C.muted,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    profileEditTxt: {color: C.txt, fontSize: 13, fontWeight: '600'},
    sec: {
      color: C.txt,
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: 18,
      marginBottom: 10,
      marginLeft: 4,
    },
    card: {
      backgroundColor: C.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: C.border,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 2,
    },
    rowBorderTop: {
      borderTopWidth: 1,
      borderTopColor: C.border,
      marginTop: 10,
      paddingTop: 12,
    },
    rowLeft: {flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1},
    rowTextWrap: {flex: 1},
    iconWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: C.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {color: C.txt, fontSize: 15, fontWeight: '700'},
    desc: {color: C.sub, fontSize: 12, marginTop: 2},
    modeRow: {flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap'},
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
    settingRow: {
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: C.border,
      paddingTop: 12,
    },
    settingLabel: {
      color: C.txt,
      fontSize: 13,
      fontWeight: '600',
    },
    settingActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
      flexWrap: 'wrap',
    },
    settingChip: {
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.muted,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    settingChipActive: {
      borderColor: C.pri,
      backgroundColor: C.soft,
    },
    settingChipTxt: {
      color: C.sub,
      fontSize: 12,
      fontWeight: '700',
    },
    settingChipTxtActive: {
      color: C.acc,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusRowGap: {marginTop: 12, paddingTop: 12},
    badge: {borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10},
    badgeOk: {backgroundColor: C.soft},
    badgeErr: {backgroundColor: '#fde7e3'},
    badgeTxt: {fontSize: 12, fontWeight: '700'},
    btn: {
      marginTop: 12,
      backgroundColor: C.pri,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    subtleBtn: {
      backgroundColor: C.soft,
      borderWidth: 1,
      borderColor: C.border,
    },
    btnTxt: {color: C.onDark, fontSize: 14, fontWeight: '700'},
    subtleBtnTxt: {color: C.acc},
    logoutBtn: {
      marginTop: 18,
      minHeight: 48,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.err,
      backgroundColor: C.card,
    },
    logoutTxt: {color: C.err, fontSize: 14, fontWeight: '800'},
    bankRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      marginTop: 10,
    },
    bankLogo: {width: 28, height: 28, borderRadius: 6, resizeMode: 'contain'},
    bankLogoFallback: {width: 10, height: 10, borderRadius: 5, backgroundColor: C.border},
    bankName: {color: C.txt, fontSize: 15, fontWeight: '500'},
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      alignItems: 'center',
    },
    infoLabel: {color: C.sub, fontSize: 14},
    infoValue: {color: C.txt, fontSize: 14},
    infoAction: {color: C.pri, fontSize: 14, fontWeight: '600'},
  });

export default SettingsScreen;
