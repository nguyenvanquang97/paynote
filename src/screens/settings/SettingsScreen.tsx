import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, Image} from 'react-native';
import {checkNotificationAccess, openNotificationSettings, openBatteryOptimizationSettings} from '../../native';
import {useAppStore} from '../../app/store';
import {getTransactions, importTransactions} from '../../database';
import dayjs from 'dayjs';
import ProfileModal from './ProfileModal';
import { pick, isCancel, types } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import {checkForUpdates} from '../../services/updater';
import DeviceInfo from 'react-native-device-info';
import type {Transaction} from '../../shared/types';
import type {CustomCategory} from '../../app/store';

const C = {bg: '#0f0f1a', card: '#1a1a2e', border: '#2a2a4a', pri: '#6c5ce7', ok: '#00b894', err: '#e17055', txt: '#fff', sub: '#a0a0b8', acc: '#a29bfe'};

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

  useEffect(() => { checkAccess(); }, []);
  const checkAccess = async () => { setNotificationAccess(await checkNotificationAccess()); };

  const handleExportJSON = async () => {
    try {
      const txs = await getTransactions(10000); // get all ideally
      const backupData = {
        transactions: txs,
        customCategories,
      };
      
      const jsonStr = JSON.stringify(backupData, null, 2);
      const path = `${RNFS.DocumentDirectoryPath}/PayNote_Backup_${dayjs().format('YYYYMMDD_HHmmss')}.json`;
      
      await RNFS.writeFile(path, jsonStr, 'utf8');
      
      await Share.share({
        title: 'PayNote Backup',
        url: `file://${path}`,
        message: 'PayNote Backup File',
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể xuất dữ liệu');
    }
  };

  const handleImportJSON = async () => {
    try {
      const [res] = await pick({
        type: [types.json, types.allFiles],
      });

      if (!res) return;
      
      const content = await RNFS.readFile(res.uri, 'utf8');
      const backupData = JSON.parse(content);
      
      if (!backupData.transactions) {
        throw new Error('Invalid format');
      }

      Alert.alert(
        'Xác nhận khôi phục',
        'Toàn bộ dữ liệu hiện tại sẽ bị xóa và thay thế bằng dữ liệu từ file backup. Bạn có chắc chắn?',
        [
          {text: 'Hủy', style: 'cancel'},
          {
            text: 'Khôi phục',
            style: 'destructive',
            onPress: async () => {
              try {
                await resetData();
                await importTransactions(backupData.transactions);
                if (backupData.customCategories) {
                  Object.values(backupData.customCategories).forEach((c: any) => addCustomCategory(c));
                }
                loadTransactions();
                loadStats();
                Alert.alert('Thành công', 'Dữ liệu đã được khôi phục');
              } catch (e) {
                console.error(e);
                Alert.alert('Lỗi', 'Khôi phục thất bại');
              }
            },
          },
        ]
      );
    } catch (err) {
      if (!isCancel(err)) {
        console.error(err);
        Alert.alert('Lỗi', 'Không thể đọc file');
      }
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Xóa toàn bộ dữ liệu',
      'Bạn có chắc chắn muốn xóa tất cả giao dịch và danh mục tự tạo? Hành động này không thể hoàn tác.',
      [
        {text: 'Hủy', style: 'cancel'},
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            await resetData();
            loadTransactions();
            loadStats();
            Alert.alert('Thành công', 'Đã xóa toàn bộ dữ liệu');
          },
        },
      ]
    );
  };
  return (
    <React.Fragment>
      <ScrollView style={s.container} contentContainerStyle={{padding: 16, paddingBottom: 40}}>
      {/* Profile Section */}
      <View style={s.profileContainer}>
        <View style={s.profileAvatar}>
          {profile.avatarUrl ? (
            <Image source={{uri: profile.avatarUrl}} style={{width: 60, height: 60, borderRadius: 30}} />
          ) : (
            <Text style={{fontSize:40}}>👤</Text>
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
        <View style={s.row}><Text style={s.icon}>🔔</Text><View style={{flex:1}}><Text style={s.label}>Notification Access</Text><Text style={s.desc}>Cần để đọc thông báo ngân hàng</Text></View>
          <View style={[s.badge,{backgroundColor:hasNotificationAccess?'#1d4e3e':'#4e1d1d'}]}><Text style={{color:hasNotificationAccess?C.ok:C.err,fontSize:12,fontWeight:'600'}}>{hasNotificationAccess?'Đã bật':'Tắt'}</Text></View></View>
        {!hasNotificationAccess && <TouchableOpacity style={s.btn} onPress={()=>{openNotificationSettings();setTimeout(checkAccess,3000);}}><Text style={s.btnTxt}>Mở cài đặt</Text></TouchableOpacity>}
      </View>
      <View style={s.card}><View style={s.row}><Text style={s.icon}>🔋</Text><View style={{flex:1}}><Text style={s.label}>Battery Optimization</Text><Text style={s.desc}>Tắt tối ưu pin để app chạy nền</Text></View></View>
        <TouchableOpacity style={s.btn} onPress={openBatteryOptimizationSettings}><Text style={s.btnTxt}>Cài đặt pin</Text></TouchableOpacity></View>
      <Text style={s.sec}>Dữ liệu</Text>
      <TouchableOpacity style={s.card} onPress={handleExportJSON}>
        <View style={s.row}>
          <Text style={s.icon}>📤</Text>
          <View style={{flex:1}}><Text style={s.label}>Sao lưu dữ liệu</Text><Text style={s.desc}>Xuất file JSON để backup</Text></View>
          <Text style={{color:C.sub}}>▶</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity style={s.card} onPress={handleImportJSON}>
        <View style={s.row}>
          <Text style={s.icon}>📥</Text>
          <View style={{flex:1}}><Text style={s.label}>Phục hồi dữ liệu</Text><Text style={s.desc}>Nhập file JSON đã sao lưu</Text></View>
          <Text style={{color:C.sub}}>▶</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[s.card, {borderColor: '#e1705533', backgroundColor: '#e1705511'}]} onPress={handleResetData}>
        <View style={s.row}>
          <Text style={s.icon}>🗑️</Text>
          <View style={{flex:1}}><Text style={s.label}>Xoá toàn bộ dữ liệu</Text><Text style={s.desc}>Reset app về trạng thái ban đầu</Text></View>
        </View>
      </TouchableOpacity>
      <Text style={s.sec}>Ngân hàng hỗ trợ</Text>
      <View style={s.card}>{[{n:'MB Bank',c:'#1e3a5f'},{n:'Techcombank',c:'#e31937'},{n:'Vietcombank',c:'#00723f'}].map((b,i)=><View key={b.n} style={[{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:10},i>0&&{borderTopWidth:1,borderTopColor:C.border}]}><View style={{width:10,height:10,borderRadius:5,backgroundColor:b.c}}/><Text style={{color:C.txt,fontSize:14}}>{b.n}</Text></View>)}</View>
      <Text style={s.sec}>Thông tin</Text>
      <View style={s.card}>
        <View style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:6}}>
          <Text style={{color:C.sub,fontSize:14}}>Phiên bản</Text>
          <Text style={{color:C.txt,fontSize:14}}>{DeviceInfo.getVersion()}</Text>
        </View>
        <TouchableOpacity 
          style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:6, marginTop: 4, borderTopWidth: 1, borderTopColor: C.border}}
          onPress={() => checkForUpdates(false)}
        >
          <Text style={{color:C.sub,fontSize:14}}>Cập nhật ứng dụng</Text>
          <Text style={{color:C.pri,fontSize:14, fontWeight:'600'}}>Kiểm tra ngay</Text>
        </TouchableOpacity>
      </View>
        </ScrollView>
      <ProfileModal visible={isProfileModalVisible} onClose={() => setIsProfileModalVisible(false)} />
    </React.Fragment>
  );
};

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.bg},
  profileContainer: {flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border},
  profileAvatar: {width: 60, height: 60, borderRadius: 30, backgroundColor: C.border, justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden'},
  profileInfo: {flex: 1},
  profileName: {color: C.txt, fontSize: 18, fontWeight: '700'},
  profileDesc: {color: C.sub, fontSize: 13, marginTop: 4},
  profileEditBtn: {backgroundColor: '#2a2a4a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20},
  profileEditTxt: {color: C.txt, fontSize: 13, fontWeight: '600'},
  sec:{color:C.sub,fontSize:13,fontWeight:'600',textTransform:'uppercase',letterSpacing:1,marginTop:20,marginBottom:10,marginLeft:4},
  card:{backgroundColor:C.card,borderRadius:16,padding:16,marginBottom:10,borderWidth:1,borderColor:C.border},
  row:{flexDirection:'row',alignItems:'center',gap:12},
  icon:{fontSize:24},label:{color:C.txt,fontSize:15,fontWeight:'600'},desc:{color:C.sub,fontSize:12,marginTop:2},
  badge:{borderRadius:8,paddingVertical:4,paddingHorizontal:10},
  btn:{marginTop:12,backgroundColor:C.pri,borderRadius:10,paddingVertical:10,alignItems:'center'},
  btnTxt:{color:C.txt,fontSize:14,fontWeight:'600'},
});

export default SettingsScreen;
