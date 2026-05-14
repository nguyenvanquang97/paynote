import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  AppState,
} from 'react-native';
import RNShare from 'react-native-share';
import {
  checkNotificationAccess,
  checkBatteryOptimizationDisabled,
  openNotificationSettings,
  openBatteryOptimizationSettings,
} from '../../native';
import { useAppStore } from '../../app/store';
import { getTransactions, importTransactions } from '../../database';
import dayjs from 'dayjs';
import ProfileModal from './ProfileModal';
import { pick, types } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import { checkForUpdates } from '../../services/updater';
import DeviceInfo from 'react-native-device-info';
import type { Transaction } from '../../shared/types';
import type { CustomCategory } from '../../app/store';
import { theme } from '../../shared/theme';
import AppIcon from '../../shared/components/AppIcon';
import { SUPPORTED_BANKS } from '../../shared/constants';
import { dialog } from '../../shared/components/Dialog';
import { toast } from '../../shared/components/Toast';

const C = {
  bg: theme.colors.appBg,
  card: theme.colors.surface,
  border: theme.colors.border,
  pri: theme.colors.primary,
  ok: theme.colors.income,
  err: theme.colors.expense,
  txt: theme.colors.textPrimary,
  sub: theme.colors.textSecondary,
  acc: theme.colors.primaryDeep,
};

const SettingsScreen: React.FC = () => {
  const {
    hasNotificationAccess,
    setNotificationAccess,
    profile,
    customCategories,
    addCustomCategory,
    loadCustomCategories,
    resetData,
    loadTransactions,
    loadStats,
  } = useAppStore();
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isBatteryOptimizationDisabled, setIsBatteryOptimizationDisabled] = useState(false);

  useEffect(() => {
    checkAccess();

    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        checkAccess();
      }
    });

    return () => sub.remove();
  }, []);

  const checkAccess = async () => {
    setNotificationAccess(await checkNotificationAccess());
    setIsBatteryOptimizationDisabled(await checkBatteryOptimizationDisabled());
  };

  const handleExportJSON = async () => {
    try {
      const txs = await getTransactions(10000);
      const backupData = { transactions: txs, customCategories };
      const jsonStr = JSON.stringify(backupData, null, 2);
      // Write to CacheDir so FileProvider can expose it via content:// URI
      const dir = RNFS.CachesDirectoryPath;
      const path = `${dir}/PayNote_Backup_${dayjs().format('YYYYMMDD_HHmmss')}.json`;
      await RNFS.writeFile(path, jsonStr, 'utf8');
      await RNShare.open({
        title: 'PayNote Backup',
        url: `file://${path}`,
        type: 'application/json',
        failOnCancel: false,
      });
    } catch (err) {
      console.error(err);
      toast.error('Không thể xuất dữ liệu');
    }
  };

  const handleExportCSV = async () => {
    try {
      const txs = await getTransactions(10000);
      const header = 'Ngày,Loại,Số tiền,Danh mục,Mô tả,Ngân hàng';
      const rows = txs.map(tx => [
        dayjs(tx.timestamp).format('DD/MM/YYYY HH:mm'),
        tx.transactionType === 'income' ? 'Thu nhập' : 'Chi tiêu',
        tx.amount,
        tx.category || '',
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        tx.bank,
      ].join(','));
      const csv = [header, ...rows].join('\n');
      // Write to CacheDir so FileProvider can expose it via content:// URI
      const dir = RNFS.CachesDirectoryPath;
      const path = `${dir}/PayNote_Export_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
      await RNFS.writeFile(path, csv, 'utf8');
      await RNShare.open({
        title: 'PayNote Export',
        url: `file://${path}`,
        type: 'text/csv',
        failOnCancel: false,
      });
    } catch (err) {
      console.error(err);
      toast.error('Không thể xuất CSV');
    }
  };


  const handleImportJSON = async () => {
    try {
      const [res] = await pick({
        type: [types.json, types.allFiles],
      });

      if (!res) { return; }

      const content = await RNFS.readFile(res.uri, 'utf8');
      const backupData = JSON.parse(content);

      if (!backupData.transactions) {
        throw new Error('Invalid format');
      }

      dialog.confirm(
        'Xác nhận khôi phục',
        'Toàn bộ dữ liệu hiện tại sẽ bị xóa và thay thế bằng dữ liệu từ file backup. Bạn có chắc chắn?',
        {
          confirmText: 'Khôi phục',
          cancelText: 'Hủy',
          variant: 'danger',
          onConfirm: async () => {
            try {
              await resetData();
              await importTransactions(backupData.transactions);
              if (backupData.customCategories) {
                Object.values(backupData.customCategories).forEach((c: any) => addCustomCategory(c));
              }
              loadTransactions();
              loadStats();
              toast.success('Dữ liệu đã được khôi phục');
            } catch (e) {
              console.error(e);
              toast.error('Khôi phục thất bại');
            }
          },
        }
      );
    } catch (err) {
      // User cancelled the picker – silently ignore
      const errCode = (err as any)?.code;
      if (errCode !== 'DOCUMENT_PICKER_CANCELED' && errCode !== 'OPERATION_CANCELED') {
        console.error(err);
        toast.error('Không thể đọc file');
      }
    }
  };

  const handleResetData = () => {
    dialog.confirm(
      'Xóa toàn bộ dữ liệu',
      'Bạn có chắc chắn muốn xóa tất cả giao dịch và danh mục tự tạo? Hành động này không thể hoàn tác.',
      {
        confirmText: 'Xóa tất cả',
        cancelText: 'Hủy',
        variant: 'danger',
        onConfirm: async () => {
          await resetData();
          loadTransactions();
          loadStats();
          toast.success('Đã xóa toàn bộ dữ liệu');
        },
      }
    );
  };

  return (
    <React.Fragment>
      <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Profile Section */}
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
            <Text style={s.profileDesc}>Người dùng PayNote</Text>
          </View>
          <TouchableOpacity style={s.profileEditBtn} onPress={() => setIsProfileModalVisible(true)}>
            <Text style={s.profileEditTxt}>Sửa</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sec}>Quyền truy cập</Text>
        <View style={s.card}>
          <View style={s.row}><View style={s.iconWrap}><AppIcon name="bell" size={20} color={C.acc} /></View><View style={{ flex: 1 }}><Text style={s.label}>Notification Access</Text><Text style={s.desc}>Cần để đọc thông báo ngân hàng</Text></View>
            <View style={[s.badge, { backgroundColor: hasNotificationAccess ? theme.colors.primarySoft : '#fde7e3' }]}><Text style={{ color: hasNotificationAccess ? C.ok : C.err, fontSize: 12, fontWeight: '600' }}>{hasNotificationAccess ? 'Đã bật' : 'Tắt'}</Text></View></View>
          {!hasNotificationAccess && <TouchableOpacity style={s.btn} onPress={() => { openNotificationSettings(); setTimeout(checkAccess, 3000); }}><Text style={s.btnTxt}>Mở cài đặt</Text></TouchableOpacity>}
        </View>
        <View style={s.card}><View style={s.row}><View style={s.iconWrap}><AppIcon name="battery" size={20} color={C.acc} /></View><View style={{ flex: 1 }}><Text style={s.label}>Battery Optimization</Text><Text style={s.desc}>Tắt tối ưu pin để app chạy nền</Text></View>
          <View style={[s.badge, { backgroundColor: isBatteryOptimizationDisabled ? theme.colors.primarySoft : '#fde7e3' }]}><Text style={{ color: isBatteryOptimizationDisabled ? C.ok : C.err, fontSize: 12, fontWeight: '600' }}>{isBatteryOptimizationDisabled ? 'Đã tắt' : 'Đang bật'}</Text></View></View>
          <TouchableOpacity style={s.btn} onPress={() => { openBatteryOptimizationSettings(); setTimeout(checkAccess, 1500); }}><Text style={s.btnTxt}>Cài đặt pin</Text></TouchableOpacity></View>
        <Text style={s.sec}>Dữ liệu</Text>
        <TouchableOpacity style={s.card} onPress={handleExportJSON}>
          <View style={s.row}>
            <View style={s.iconWrap}><AppIcon name="upload" size={20} color={C.acc} /></View>
            <View style={{ flex: 1 }}><Text style={s.label}>Sao lưu JSON</Text><Text style={s.desc}>Xuất file JSON để backup/restore</Text></View>
            <AppIcon name="chevron-right" size={16} color={C.sub} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={handleExportCSV}>
          <View style={s.row}>
            <View style={s.iconWrap}><AppIcon name="list" size={20} color={C.acc} /></View>
            <View style={{ flex: 1 }}><Text style={s.label}>Xuất CSV</Text><Text style={s.desc}>Mở bằng Excel / Google Sheets</Text></View>
            <AppIcon name="chevron-right" size={16} color={C.sub} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={handleImportJSON}>
          <View style={s.row}>
            <View style={s.iconWrap}><AppIcon name="download" size={20} color={C.acc} /></View>
            <View style={{ flex: 1 }}><Text style={s.label}>Phục hồi dữ liệu</Text><Text style={s.desc}>Nhập file JSON đã sao lưu</Text></View>
            <AppIcon name="chevron-right" size={16} color={C.sub} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[s.card, s.dangerCard]} onPress={handleResetData}>
          <View style={s.row}>
            <View style={s.iconWrap}><AppIcon name="trash" size={20} color={C.err} /></View>
            <View style={{ flex: 1 }}><Text style={s.label}>Xoá toàn bộ dữ liệu</Text><Text style={s.desc}>Reset app về trạng thái ban đầu</Text></View>
          </View>
        </TouchableOpacity>
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  profileContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.border, justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' },
  profileInfo: { flex: 1 },
  profileName: { color: C.txt, fontSize: 18, fontWeight: '700' },
  profileDesc: { color: C.sub, fontSize: 13, marginTop: 4 },
  profileEditBtn: { backgroundColor: theme.colors.surfaceMuted, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  profileEditTxt: { color: C.txt, fontSize: 13, fontWeight: '600' },
  sec: { color: C.txt, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10, marginLeft: 4 },
  note: { color: C.sub, fontSize: 12, fontWeight: '400', marginBottom: 10, textTransform: 'lowercase' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 24 },
  iconWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  label: { color: C.txt, fontSize: 15, fontWeight: '600' }, desc: { color: C.sub, fontSize: 12, marginTop: 2 },
  badge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  btn: { marginTop: 12, backgroundColor: C.pri, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnTxt: { color: theme.colors.textOnDark, fontSize: 14, fontWeight: '700' },
  dangerCard: { borderColor: '#f4c7bd', backgroundColor: '#fff4f1' },
});

export default SettingsScreen;
