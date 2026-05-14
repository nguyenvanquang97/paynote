import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {
  checkNotificationAccess,
  checkBatteryOptimizationDisabled,
  openNotificationSettings,
  openBatteryOptimizationSettings,
} from '../../native';
import {theme} from '../../shared/theme';
import AppIcon from '../../shared/components/AppIcon';

const C = {
  bg: theme.colors.appBg,
  card: theme.colors.surface,
  border: theme.colors.border,
  pri: theme.colors.primary,
  ok: theme.colors.income,
  txt: theme.colors.textPrimary,
  sub: theme.colors.textSecondary,
  acc: theme.colors.primaryDeep,
};

interface Props { onComplete: () => void; }

const steps = [
  {icon: 'bell', title: 'Quyền thông báo', desc: 'Cho phép PayNote đọc notification ngân hàng để tự động ghi nhận giao dịch', action: 'notif'},
  {icon: 'battery', title: 'Tối ưu pin', desc: 'Tắt tối ưu pin để PayNote luôn chạy nền và không bỏ lỡ giao dịch nào', action: 'battery'},
  {icon: 'list', title: 'Sẵn sàng!', desc: 'PayNote đã sẵn sàng. Giao dịch sẽ tự động được ghi nhận khi bạn nhận thông báo ngân hàng', action: 'done'},
];

const OnboardingScreen: React.FC<Props> = ({onComplete}) => {
  const [step, setStep] = useState(0);
  const [notifOk, setNotifOk] = useState(false);
  const [batteryOk, setBatteryOk] = useState(false);
  const current = steps[step];

  const handleAction = async () => {
    if (current.action === 'notif') {
      openNotificationSettings();
      setTimeout(async () => { setNotifOk(await checkNotificationAccess()); }, 3000);
    } else if (current.action === 'battery') {
      openBatteryOptimizationSettings();
      setTimeout(async () => {
        setBatteryOk(await checkBatteryOptimizationDisabled());
      }, 1500);
    } else { onComplete(); return; }
  };

  const handleNext = () => { if (step < steps.length - 1) {setStep(step + 1);} else {onComplete();} };

  return (
    <View style={s.container}>
      <View style={s.dots}>{steps.map((_, i) => <View key={i} style={[s.dot, i === step && s.dotActive]} />)}</View>
      <View style={s.content}>
        <View style={s.iconWrap}>
          <AppIcon name={current.icon as any} size={64} color={C.acc} />
        </View>
        <Text style={s.title}>{current.title}</Text>
        <Text style={s.desc}>{current.desc}</Text>
        {current.action === 'notif' && notifOk && <Text style={s.ok}>Đã bật quyền thông báo</Text>}
        {current.action === 'battery' && batteryOk && <Text style={s.ok}>Đã tắt tối ưu pin</Text>}
      </View>
      <View style={s.actions}>
        {current.action !== 'done' && (
          <TouchableOpacity style={s.actionBtn} onPress={handleAction}>
            <Text style={s.actionTxt}>{current.action === 'notif' ? 'Mở cài đặt thông báo' : 'Mở cài đặt pin'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
          <Text style={s.nextTxt}>{step === steps.length - 1 ? 'Bắt đầu' : 'Tiếp tục'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.bg,justifyContent:'space-between',padding:24},
  dots:{flexDirection:'row',justifyContent:'center',gap:8,marginTop:60},
  dot:{width:8,height:8,borderRadius:4,backgroundColor:C.border},
  dotActive:{backgroundColor:C.pri,width:24},
  content:{alignItems:'center',flex:1,justifyContent:'center'},
  icon:{fontSize:80,marginBottom:24},
  iconWrap:{width:88,height:88,borderRadius:44,backgroundColor:C.card,justifyContent:'center',alignItems:'center',marginBottom:24,borderWidth:1,borderColor:C.border},
  title:{color:C.txt,fontSize:28,fontWeight:'700',marginBottom:12},
  desc:{color:C.sub,fontSize:16,textAlign:'center',lineHeight:24,paddingHorizontal:20},
  ok:{color:C.ok,fontSize:14,fontWeight:'600',marginTop:14},
  actions:{gap:12,marginBottom:40},
  actionBtn:{backgroundColor:C.card,borderRadius:18,paddingVertical:16,alignItems:'center',borderWidth:1,borderColor:C.border},
  actionTxt:{color:C.acc,fontSize:16,fontWeight:'600'},
  nextBtn:{backgroundColor:C.pri,borderRadius:18,paddingVertical:16,alignItems:'center'},
  nextTxt:{color:C.txt,fontSize:16,fontWeight:'600'},
});

export default OnboardingScreen;
