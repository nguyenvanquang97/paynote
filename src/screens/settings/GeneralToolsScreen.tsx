import React, {useMemo} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useThemeColors} from '../../shared/theme';
import AppIcon from '../../shared/components/AppIcon';
import {checkForUpdates} from '../../services/updater';

const GeneralToolsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const t = useThemeColors();
  const C = useMemo(() => ({
    bg: t.appBg,
    card: t.surface,
    border: t.border,
    txt: t.textPrimary,
    sub: t.textSecondary,
    acc: t.primaryDeep,
    muted: t.surfaceMuted,
  }), [t]);
  const s = useMemo(() => createStyles(C), [C]);

  return (
    <View style={s.container}>
      <View style={s.card}>
        <TouchableOpacity style={s.navRow} onPress={() => navigation.navigate('PersonalFinance')}>
          <View style={s.rowLeft}>
            <View style={s.iconWrap}>
              <AppIcon name="list" size={20} color={C.acc} />
            </View>
            <View style={s.rowTextWrap}>
              <Text style={s.label}>Tiện ích cá nhân</Text>
              <Text style={s.desc}>Sao lưu, import/export, reset dữ liệu</Text>
            </View>
          </View>
          <AppIcon name="chevron-right" size={16} color={C.sub} />
        </TouchableOpacity>

        <TouchableOpacity style={[s.navRow, s.rowBorderTop]} onPress={() => navigation.navigate('BudgetSettings')}>
          <View style={s.rowLeft}>
            <View style={s.iconWrap}>
              <AppIcon name="list" size={20} color={C.acc} />
            </View>
            <View style={s.rowTextWrap}>
              <Text style={s.label}>Ngân sách</Text>
              <Text style={s.desc}>Giới hạn danh mục và cảnh báo ngưỡng</Text>
            </View>
          </View>
          <AppIcon name="chevron-right" size={16} color={C.sub} />
        </TouchableOpacity>

        <TouchableOpacity style={[s.navRow, s.rowBorderTop]} onPress={() => navigation.navigate('Notifications')}>
          <View style={s.rowLeft}>
            <View style={s.iconWrap}>
              <AppIcon name="bell" size={20} color={C.acc} />
            </View>
            <View style={s.rowTextWrap}>
              <Text style={s.label}>Trung tâm thông báo</Text>
              <Text style={s.desc}>Xem và quản lý cảnh báo đã nhận</Text>
            </View>
          </View>
          <AppIcon name="chevron-right" size={16} color={C.sub} />
        </TouchableOpacity>

        <TouchableOpacity style={[s.navRow, s.rowBorderTop]} onPress={() => checkForUpdates(false)}>
          <View style={s.rowLeft}>
            <View style={s.iconWrap}>
              <AppIcon name="info" size={20} color={C.acc} />
            </View>
            <View style={s.rowTextWrap}>
              <Text style={s.label}>Kiểm tra cập nhật</Text>
              <Text style={s.desc}>Kiểm tra phiên bản mới của ứng dụng</Text>
            </View>
          </View>
          <AppIcon name="chevron-right" size={16} color={C.sub} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (C: {
  bg: string;
  card: string;
  border: string;
  txt: string;
  sub: string;
  acc: string;
  muted: string;
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
      padding: 16,
    },
    card: {
      backgroundColor: C.card,
      borderRadius: 16,
      padding: 16,
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
  });

export default GeneralToolsScreen;
