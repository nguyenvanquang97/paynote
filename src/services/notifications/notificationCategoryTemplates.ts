import type {NotificationPersona, NotificationSeverity, NotificationTemplate, NotificationTrigger} from './notificationTypes';

interface CategorySeed {
  context: NotificationTemplate['context'];
  trigger: NotificationTrigger;
  severity: NotificationSeverity;
  lines: string[];
}

const PERSONAS: NotificationPersona[] = ['advisor', 'wallet_pet', 'toxic_friend', 'vietnamese_parent'];

const CATEGORY_SEEDS: CategorySeed[] = [
  {context: 'food', trigger: 'budget_80', severity: 'medium', lines: [
    'Ăn uống đã lên {percent}%, mình giảm các bữa cảm xúc trong tuần này.',
    'Mốc {spentText}/{limitText} cho ăn uống đang nóng, ưu tiên bữa cần trước.',
    'Ăn ngoài dày quá sẽ kéo cả tháng lệch nhịp tài chính.',
  ]},
  {context: 'food', trigger: 'repeat_category_today', severity: 'high', lines: [
    'Hôm nay {categoryLabel} lặp {count} lần rồi, dừng thêm đơn nhỏ lại.',
    'Ăn vặt theo hứng đang thành pattern trong ngày.',
    'Một lần nữa là thành thói quen khó sửa.',
  ]},
  {context: 'cafe', trigger: 'repeat_category_today', severity: 'medium', lines: [
    'Ly hôm nay đã đủ nhiều, thêm nữa thì ví tụt mood.',
    '{categoryLabel} lặp dày trong ngày, tạm nghỉ một nhịp đi.',
    'Grab/be đang có vẻ thân với ví bạn quá.',
    'Caffeine có thể vui, sao kê thì không vui lắm đâu.',
  ]},
  {context: 'cafe', trigger: 'budget_100', severity: 'high', lines: [
    'Kế hoạch tiết kiệm bị một ly trà sữa đánh bại.',
    'Lại {categoryLabel}? Tiền mọc trên cây à?',
    'Ngân sách đồ uống đã chạm trần, giữ lại cho phần cần hơn.',
    '{spentText}/{limitText} cho cafe là tín hiệu phải phanh.',
    'Vượt mốc này rồi thì mỗi ly thêm là áp lực cộng dồn.',
  ]},
  {context: 'rent', trigger: 'budget_100', severity: 'high', lines: [
    'Khoản nhà ở đã full ngân sách, các mục khác phải siết ngay.',
    'Tiền trọ chạm trần nghĩa là dư địa tháng này rất mỏng.',
    '{spentText}/{limitText} ở mục nhà là mức cần phòng thủ.',
  ]},
  {context: 'shopping', trigger: 'large_transaction', severity: 'high', lines: [
    'Khoản mua sắm này đủ lớn để đổi kế hoạch tuần.',
    '{amountText} cho shopping vừa đi, tạm khóa mua nốt.',
    'Một cú mua lớn nữa là tháng này rất dễ hụt nhịp.',
  ]},
  {context: 'transport', trigger: 'repeat_category_week', severity: 'medium', lines: [
    'Di chuyển hôm nay hơi nhiều, mình cân lại phần còn lại nhé.',
    'Di chuyển tuần này đang dày, nên gom lịch để giảm chuyến rời rạc.',
    '{categoryLabel} xuất hiện quá thường xuyên trong tuần.',
    'Giảm vài chuyến ngắn sẽ nhẹ ví rõ rệt cuối tuần.',
  ]},
  {context: 'bill', trigger: 'end_of_month_warning', severity: 'high', lines: [
    'Cuối tháng, nhóm hóa đơn cần ưu tiên trước mọi khoản tùy hứng.',
    'Bill luôn tới đúng hẹn, nên đừng để tiền đi sai chỗ trước đó.',
    'Giữ quỹ hóa đơn riêng sẽ tránh cú sốc cuối kỳ.',
  ]},
];

const renderBody = (persona: NotificationPersona, raw: string, index: number): string => {
  const fit = (value: string): string => (value.length <= 120 ? value : `${value.slice(0, 118).trim()}…`);
  if (persona === 'wallet_pet') {
    const emoji = index % 3 === 1 ? ' 🥹' : index % 3 === 2 ? ' ✨' : '';
    const lower = raw.toLowerCase();
    const withVoice = lower.includes('ví bé') ? raw : `Ví bé nhắc nhẹ: ${raw}`;
    return fit(`${withVoice}${emoji}`);
  }
  if (persona === 'toxic_friend') {
    const tail = index % 2 === 0 ? ' Dừng đúng lúc thì đỡ drama hơn.' : '';
    return fit(`${raw}${tail}`);
  }
  if (persona === 'vietnamese_parent') {
    const tail = index % 2 === 0 ? ' Từ giờ bớt theo hứng.' : '';
    return fit(`${raw}${tail}`);
  }
  return fit(raw);
};

const tierByLineIndex = (i: number): 1 | 2 | 3 | 4 => {
  if (i === 0) {return 2;}
  if (i === 1) {return 3;}
  return 4;
};

export const NOTIFICATION_CATEGORY_TEMPLATES: NotificationTemplate[] = CATEGORY_SEEDS.flatMap(seed =>
  PERSONAS.flatMap(persona =>
    seed.lines.map((line, index) => ({
      id: `${seed.context}_${seed.trigger}_${persona}_${index + 1}`,
      trigger: seed.trigger,
      persona,
      severity: seed.severity,
      tier: tierByLineIndex(index),
      context: seed.context,
      body: renderBody(persona, line, index),
      tags: [`context_${seed.context}`, `tier_${tierByLineIndex(index)}`],
      origin: 'generated',
    })),
  ),
);
