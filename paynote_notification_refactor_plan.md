# PayNote Notification Refactor Plan

## Mục tiêu

Thay toàn bộ hệ thống notification/roast cũ của PayNote bằng một hệ thống mới theo hướng giống tinh thần Rolly:

- Không phụ thuộc Gemini cho notification thường ngày.
- Thay toàn bộ message cũ vì hiện tại còn dài, nghiêm túc, ít cá tính.
- Đổi 4 mode hiện tại thành 4 persona rõ ràng.
- Message phải ngắn, có cá tính, dễ screenshot, dễ viral.
- Chống trùng lặp tốt, không bị lặp đi lặp lại vài câu giống nhau.
- Có escalation: người dùng tái phạm nhiều thì câu càng gắt/cà khịa hơn.
- Vẫn có fallback native/offline để thông báo hoạt động ổn định.
- Không copy câu của Rolly; chỉ học phong cách: cá tính, đời thường, cà khịa, vui.

---

## 1. Hiện trạng cần thay

Trong repo hiện tại đang có logic liên quan đến roast/notification như:

```txt
src/services/roastFallbackTemplates.ts
src/services/budgetAlerts.ts
android/app/src/main/java/com/paynote/app/PeriodicFallbackTemplates.kt
android/app/src/main/java/com/paynote/app/PeriodicRoastReceiver.kt
android/app/src/main/java/com/paynote/app/NotificationBridge.kt
src/screens/settings/SettingsScreen.tsx
src/screens/settings/BudgetSettingsScreen.tsx
```

Các mode cũ:

```ts
type AiToneMode = 'gentle' | 'cute' | 'sarcastic_strong' | 'angry';
```

Vấn đề:

- Tên mode mang tính kỹ thuật, không có cảm giác "nhân vật".
- Message còn quá giống cảnh báo ngân sách truyền thống.
- Nhiều câu dài, ít punchline.
- Context còn ít.
- Random template dễ trùng.
- Chưa có memory/escalation đủ rõ.
- Chưa có hệ thống trigger-message tách biệt.

---

## 2. Định hướng mới

Không gọi là `tone mode` nữa. Đổi sang `NotificationPersona`.

```ts
export type NotificationPersona =
  | 'advisor'
  | 'wallet_pet'
  | 'toxic_friend'
  | 'vietnamese_parent';
```

Ý tưởng chính:

```txt
Notification = Trigger + Persona + Category Context + Severity + Memory
```

Ví dụ:

```txt
Trigger: budget_100
Persona: toxic_friend
Category: cafe
Severity: high
Memory: đã nhắc cafe 3 lần hôm nay

Message:
"Trà sữa không đắt. Đắt là cái thói 'ly cuối'."
```

---

## 3. Mapping mode cũ sang persona mới

Phải giữ backward compatibility để user cũ không lỗi setting.

```ts
export const LEGACY_PERSONA_MAP = {
  gentle: 'advisor',
  cute: 'wallet_pet',
  sarcastic_strong: 'toxic_friend',
  angry: 'vietnamese_parent',
} as const;
```

### Ý nghĩa persona

| Mode cũ | Persona mới | Tên hiển thị | Tính cách |
|---|---|---|---|
| gentle | advisor | Cố vấn tử tế | Nhắc nhẹ, tỉnh táo, không phán xét |
| cute | wallet_pet | Ví bé biết khóc | Dễ thương, meme, đáng yêu |
| sarcastic_strong | toxic_friend | Bạn thân toxic | Cà khịa, châm biếm, viral |
| angry | vietnamese_parent | Mẹ Việt Nam | Mắng yêu, gắt, đời thường |

---

## 4. Persona detail

### 4.1. advisor - Cố vấn tử tế

Tone:

- Nhẹ nhàng.
- Không chửi.
- Không quá trẻ con.
- Giúp user thấy vẫn còn cứu được.
- Hợp user không thích bị mắng.

Ví dụ:

```txt
"Khoản này hơi căng rồi. Mình chậm lại một nhịp nhé."
"Ví chưa sao, nhưng đang cần được nghỉ."
"Tháng còn dài, đừng để hôm nay phá mood cuối tháng."
```

Không viết:

```txt
"Mình khuyên bạn nên cân nhắc kỹ lưỡng các khoản chi tiêu..."
```

Vì quá dài và quá app tài chính truyền thống.

---

### 4.2. wallet_pet - Ví bé biết khóc

Tone:

- Dễ thương.
- Có nhân vật "ví bé".
- Có meme nhẹ.
- Có emoji vừa phải.
- Không quá sến.

Ví dụ:

```txt
"Ví bé rén ngang 🥹"
"Ví bé xin nghỉ phép sau giao dịch này."
"Tiền vừa đi du lịch một chiều rồi á."
```

Rule:

- Có thể dùng "ví bé".
- Có thể dùng emoji: 🥹, 🥲, 😭, ✨
- Không spam emoji trong mọi câu.
- Mỗi notification tối đa 1 emoji.

---

### 4.3. toxic_friend - Bạn thân toxic

Tone:

- Cà khịa.
- Gắt vừa.
- Có punchline.
- Dễ screenshot.
- Đây là persona có khả năng viral nhất.

Ví dụ:

```txt
"Kế hoạch tiết kiệm bị một ly trà sữa đánh bại."
"Tiêu nhanh thế này chắc ví có bảo hiểm."
"Bạn không mua đồ, bạn đang mua áp lực cuối tháng."
```

Rule:

- Không dùng chửi tục.
- Không body shaming.
- Không xúc phạm nặng.
- Cà khịa hành vi chi tiêu, không công kích con người.

---

### 4.4. vietnamese_parent - Mẹ Việt Nam

Tone:

- Mắng yêu kiểu phụ huynh Việt Nam.
- Ngắn, gắt, đời.
- Có thể xưng "mày" nếu user bật chế độ gắt.
- Default nên tránh "tao/mày" quá nhiều nếu chưa có setting cho phép.

Ví dụ:

```txt
"Tiền mọc trên cây à?"
"Không cần thì đừng mua."
"Tháng trước vừa than hết tiền xong."
```

Rule:

- Không chửi tục.
- Không xúc phạm nhân phẩm.
- Có thể gắt nhưng phải buồn cười.
- Nên có setting `allowStrongLanguage`.

---

## 5. Trigger mới cần hỗ trợ

```ts
export type NotificationTrigger =
  | 'budget_50'
  | 'budget_80'
  | 'budget_100'
  | 'budget_120'
  | 'large_transaction'
  | 'repeat_category_today'
  | 'repeat_category_week'
  | 'late_night_spending'
  | 'salary_received'
  | 'no_spend_day'
  | 'saving_streak'
  | 'duplicate_transaction'
  | 'missed_transaction'
  | 'end_of_day_summary'
  | 'end_of_month_warning'
  | 'income_received'
  | 'bank_transaction_detected';
```

---

## 6. Severity

```ts
export type NotificationSeverity = 'low' | 'medium' | 'high' | 'critical';
```

Mapping gợi ý:

```ts
budget_50  -> low
budget_80  -> medium
budget_100 -> high
budget_120 -> critical
```

Repeat behavior:

```ts
countToday = 1 -> low
countToday = 2 -> medium
countToday = 3 -> high
countToday >= 4 -> critical
```

Large transaction:

```ts
amount > averageDailySpend * 2 -> medium
amount > averageDailySpend * 4 -> high
amount > averageDailySpend * 8 -> critical
```

Late night:

```ts
22:00 - 23:59 -> medium
00:00 - 03:00 -> high
03:00 - 05:00 -> critical
```

---

## 7. Category context

Cần detect context từ category name/label.

```ts
export type NotificationCategoryContext =
  | 'generic'
  | 'food'
  | 'cafe'
  | 'shopping'
  | 'transport'
  | 'rent'
  | 'bill'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'salary'
  | 'saving';
```

Pattern gợi ý:

```ts
const CATEGORY_PATTERNS = {
  food: [/ăn/i, /uống/i, /đồ ăn/i, /ăn vặt/i, /food/i, /meal/i, /lunch/i, /dinner/i],
  cafe: [/cà phê/i, /cafe/i, /coffee/i, /trà sữa/i, /matcha/i, /đồ uống/i],
  shopping: [/mua sắm/i, /shopping/i, /quần áo/i, /shopee/i, /lazada/i, /tiki/i, /thời trang/i],
  transport: [/xăng/i, /xe/i, /grab/i, /be/i, /taxi/i, /di chuyển/i],
  rent: [/trọ/i, /tiền nhà/i, /thuê nhà/i, /rent/i, /apartment/i],
  bill: [/điện/i, /nước/i, /internet/i, /wifi/i, /hóa đơn/i, /bill/i],
  entertainment: [/phim/i, /game/i, /netflix/i, /spotify/i, /giải trí/i],
  health: [/thuốc/i, /khám/i, /bệnh viện/i, /y tế/i, /health/i],
  education: [/học/i, /sách/i, /course/i, /khóa học/i],
};
```

---

## 8. Cấu trúc file đề xuất

Thay vì để tất cả trong `roastFallbackTemplates.ts`, tách rõ:

```txt
src/services/notifications/
  notificationTypes.ts
  notificationPersona.ts
  notificationTriggers.ts
  notificationCategory.ts
  notificationTemplates.ts
  notificationCategoryTemplates.ts
  notificationMemory.ts
  notificationEngine.ts
  pickNotificationTemplate.ts
  formatNotificationTemplate.ts
  notificationRules.ts
  index.ts
```

Có thể giữ file cũ để compatibility:

```txt
src/services/roastFallbackTemplates.ts
```

Nhưng nội dung file cũ chỉ nên wrapper sang engine mới.

---

## 9. Type design

### 9.1. notificationTypes.ts

```ts
export type NotificationPersona =
  | 'advisor'
  | 'wallet_pet'
  | 'toxic_friend'
  | 'vietnamese_parent';

export type LegacyAiToneMode =
  | 'gentle'
  | 'cute'
  | 'sarcastic_strong'
  | 'angry';

export type NotificationTrigger =
  | 'budget_50'
  | 'budget_80'
  | 'budget_100'
  | 'budget_120'
  | 'large_transaction'
  | 'repeat_category_today'
  | 'repeat_category_week'
  | 'late_night_spending'
  | 'salary_received'
  | 'income_received'
  | 'no_spend_day'
  | 'saving_streak'
  | 'duplicate_transaction'
  | 'missed_transaction'
  | 'end_of_day_summary'
  | 'end_of_month_warning'
  | 'bank_transaction_detected';

export type NotificationSeverity = 'low' | 'medium' | 'high' | 'critical';

export type NotificationCategoryContext =
  | 'generic'
  | 'food'
  | 'cafe'
  | 'shopping'
  | 'transport'
  | 'rent'
  | 'bill'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'salary'
  | 'saving';

export interface NotificationTemplateContext {
  categoryLabel?: string;
  amountText?: string;
  spentText?: string;
  limitText?: string;
  percent?: number;
  count?: number;
  daysLeft?: number;
  days?: number;
  transactionName?: string;
  bankName?: string;
  balanceText?: string;
}

export interface NotificationTemplate {
  id: string;
  trigger: NotificationTrigger;
  persona: NotificationPersona;
  severity: NotificationSeverity;
  context: NotificationCategoryContext | 'any';
  title?: string;
  body: string;
  tags?: string[];
}
```

---

### 9.2. notificationPersona.ts

```ts
import type { LegacyAiToneMode, NotificationPersona } from './notificationTypes';

export const PERSONA_IDS = {
  ADVISOR: 'advisor',
  WALLET_PET: 'wallet_pet',
  TOXIC_FRIEND: 'toxic_friend',
  VIETNAMESE_PARENT: 'vietnamese_parent',
} as const;

export const LEGACY_PERSONA_MAP: Record<LegacyAiToneMode, NotificationPersona> = {
  gentle: 'advisor',
  cute: 'wallet_pet',
  sarcastic_strong: 'toxic_friend',
  angry: 'vietnamese_parent',
};

export function normalizePersona(value?: string | null): NotificationPersona {
  if (!value) return 'advisor';

  if (value === 'gentle') return 'advisor';
  if (value === 'cute') return 'wallet_pet';
  if (value === 'sarcastic_strong') return 'toxic_friend';
  if (value === 'angry') return 'vietnamese_parent';

  if (
    value === 'advisor' ||
    value === 'wallet_pet' ||
    value === 'toxic_friend' ||
    value === 'vietnamese_parent'
  ) {
    return value;
  }

  return 'advisor';
}

export const PERSONA_OPTIONS = [
  {
    id: 'advisor',
    title: 'Cố vấn tử tế',
    description: 'Nhắc nhẹ, tỉnh táo, không làm bạn áp lực.',
    preview: 'Khoản này hơi căng rồi. Mình chậm lại một nhịp nhé.',
  },
  {
    id: 'wallet_pet',
    title: 'Ví bé biết khóc',
    description: 'Dễ thương, meme nhẹ, hợp người thích vui vẻ.',
    preview: 'Ví bé rén ngang 🥹',
  },
  {
    id: 'toxic_friend',
    title: 'Bạn thân toxic',
    description: 'Cà khịa mạnh, vui nhưng vẫn đúng trọng tâm.',
    preview: 'Kế hoạch tiết kiệm bị một ly trà sữa đánh bại.',
  },
  {
    id: 'vietnamese_parent',
    title: 'Mẹ Việt Nam',
    description: 'Mắng yêu kiểu phụ huynh, gắt nhưng đời.',
    preview: 'Tiền mọc trên cây à?',
  },
] as const;
```

---

## 10. Notification memory

### 10.1. Memory model

```ts
export interface NotificationMemory {
  recentTemplateIds: string[];
  recentTexts: string[];
  lastShownAtByTemplateId: Record<string, number>;
  lastShownAtByTriggerCategory: Record<string, number>;
  countTodayByCategory: Record<string, number>;
  countTodayByTrigger: Record<string, number>;
  warningCountByCategory: Record<string, number>;
  lastResetDate: string;
}
```

### 10.2. Chống lặp

Rule bắt buộc:

```txt
1. Không lặp template trong 7 ngày.
2. Không lặp 20 template gần nhất.
3. Không gửi cùng trigger + category trong 2 giờ.
4. Nếu pool template hết, chọn template cũ nhất thay vì random.
5. Ưu tiên template đúng category context.
6. Nếu không có template đúng category, fallback generic.
```

### 10.3. Key chống spam

```ts
function getTriggerCategoryKey(trigger: string, categoryContext: string) {
  return `${trigger}:${categoryContext}`;
}
```

### 10.4. Cooldown

```ts
const COOLDOWN_BY_TRIGGER: Record<NotificationTrigger, number> = {
  budget_50: 6 * 60 * 60 * 1000,
  budget_80: 4 * 60 * 60 * 1000,
  budget_100: 6 * 60 * 60 * 1000,
  budget_120: 8 * 60 * 60 * 1000,
  large_transaction: 1 * 60 * 60 * 1000,
  repeat_category_today: 2 * 60 * 60 * 1000,
  repeat_category_week: 12 * 60 * 60 * 1000,
  late_night_spending: 2 * 60 * 60 * 1000,
  salary_received: 24 * 60 * 60 * 1000,
  income_received: 12 * 60 * 60 * 1000,
  no_spend_day: 24 * 60 * 60 * 1000,
  saving_streak: 24 * 60 * 60 * 1000,
  duplicate_transaction: 30 * 60 * 1000,
  missed_transaction: 2 * 60 * 60 * 1000,
  end_of_day_summary: 24 * 60 * 60 * 1000,
  end_of_month_warning: 24 * 60 * 60 * 1000,
  bank_transaction_detected: 10 * 60 * 1000,
};
```

---

## 11. Template picking algorithm

```ts
export function pickNotificationTemplate(input: {
  trigger: NotificationTrigger;
  persona: NotificationPersona;
  severity: NotificationSeverity;
  categoryContext: NotificationCategoryContext;
  context: NotificationTemplateContext;
  memory: NotificationMemory;
  now: number;
}): NotificationTemplate | null {
  const triggerCooldownKey = `${input.trigger}:${input.categoryContext}`;
  const lastTriggerAt = input.memory.lastShownAtByTriggerCategory[triggerCooldownKey];

  if (lastTriggerAt) {
    const cooldown = COOLDOWN_BY_TRIGGER[input.trigger] ?? 2 * 60 * 60 * 1000;
    if (input.now - lastTriggerAt < cooldown) {
      return null;
    }
  }

  const candidates = NOTIFICATION_TEMPLATES.filter(template => {
    if (template.trigger !== input.trigger) return false;
    if (template.persona !== input.persona) return false;

    const contextMatches =
      template.context === input.categoryContext ||
      template.context === 'any' ||
      template.context === 'generic';

    if (!contextMatches) return false;

    return true;
  });

  const preferred = candidates.filter(template => template.severity === input.severity);
  const fallbackSeverity = candidates;

  const pool = preferred.length > 0 ? preferred : fallbackSeverity;

  const freshPool = pool.filter(template => {
    if (input.memory.recentTemplateIds.includes(template.id)) return false;

    const lastShown = input.memory.lastShownAtByTemplateId[template.id];
    if (!lastShown) return true;

    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return input.now - lastShown > sevenDays;
  });

  const finalPool = freshPool.length > 0 ? freshPool : pool;

  if (finalPool.length === 0) return null;

  return finalPool[Math.floor(Math.random() * finalPool.length)];
}
```

---

## 12. Format template

```ts
export function formatNotificationTemplate(
  body: string,
  context: NotificationTemplateContext,
): string {
  return body
    .replace(/\{categoryLabel\}/g, context.categoryLabel ?? 'Khoản này')
    .replace(/\{amountText\}/g, context.amountText ?? 'Khoản tiền này')
    .replace(/\{spentText\}/g, context.spentText ?? 'một khoản kha khá')
    .replace(/\{limitText\}/g, context.limitText ?? 'ngân sách')
    .replace(/\{percent\}/g, String(context.percent ?? ''))
    .replace(/\{count\}/g, String(context.count ?? 'nhiều'))
    .replace(/\{daysLeft\}/g, String(context.daysLeft ?? 'vài'))
    .replace(/\{days\}/g, String(context.days ?? 'vài'))
    .replace(/\{transactionName\}/g, context.transactionName ?? 'giao dịch này')
    .replace(/\{bankName\}/g, context.bankName ?? 'ngân hàng')
    .replace(/\{balanceText\}/g, context.balanceText ?? 'số dư');
}
```

---

## 13. Template seed mới

Mục tiêu tối thiểu ban đầu:

```txt
4 persona × 15 trigger × 5 câu = 300 template
```

Nhưng để triển khai nhanh, có thể seed theo 2 lớp:

```txt
Lớp 1: generic trigger templates
Lớp 2: category context templates
```

Tổng khoảng 300 câu.

---

# 14. Bộ message seed chi tiết

## 14.1. budget_50

### advisor

```ts
[
  "Mới nửa đường thôi, {categoryLabel} đang cần mình đi chậm lại một nhịp.",
  "{categoryLabel} đã tới {percent}%. Vẫn ổn nếu mình giữ nhịp từ giờ.",
  "Nửa ngân sách đã dùng rồi. Đây là lúc tiêu có chủ đích hơn.",
  "Mình đang ở mốc an toàn, nhưng đừng để {categoryLabel} tăng nhanh quá.",
  "Đi chậm từ mốc này thì cuối tháng sẽ dễ thở hơn nhiều."
]
```

### wallet_pet

```ts
[
  "Ví bé thấy {categoryLabel} lên {percent}% rồi nha 🥹",
  "Nửa chặng rồi đó, ví bé xin mình ngoan tay xíu.",
  "{categoryLabel} đang nóng nhẹ, ví bé cần quạt.",
  "Ví bé chưa khóc, nhưng đã bắt đầu nhìn bạn rồi á.",
  "Mình giữ nhịp xinh xinh từ đây nha."
]
```

### toxic_friend

```ts
[
  "{categoryLabel} mới nửa chặng mà đã có vibe căng rồi.",
  "Nửa ngân sách đi rồi. Kế hoạch vẫn còn sống, tạm thời.",
  "Mốc {percent}% tới hơi nhanh. Tốc độ này đáng để ví suy nghĩ.",
  "{categoryLabel} đang tăng đẹp, đẹp theo kiểu cần để mắt.",
  "Chưa toang, nhưng đà này rất có tiềm năng toang."
]
```

### vietnamese_parent

```ts
[
  "{categoryLabel} đã {percent}% rồi, liệu mà giữ tay.",
  "Mới nửa tháng/nửa ngân sách đã thế này rồi đấy.",
  "Từ giờ bớt khoản không cần lại.",
  "Đừng để đến cuối tháng rồi lại kêu.",
  "Tiêu thì nhìn ngân sách một chút."
]
```

---

## 14.2. budget_80

### advisor

```ts
[
  "{categoryLabel} hơi nóng rồi. Chậm lại là vẫn cứu được.",
  "Ví đang nhắc nhẹ: đừng để {categoryLabel} vượt kiểm soát.",
  "Mốc {percent}% tới rồi. Phanh sớm thì đỡ đau.",
  "{categoryLabel} đã dùng {spentText}/{limitText}. Từ giờ nên ưu tiên khoản cần.",
  "Tháng còn dài, mình giữ nhịp ở {categoryLabel} nhé."
]
```

### wallet_pet

```ts
[
  "Ví bé rén rồi, {categoryLabel} đã {percent}% á 🥹",
  "{categoryLabel} nóng quá, ví bé cần quạt.",
  "Cảnh báo xinh: {categoryLabel} sắp vượt mood an toàn.",
  "Ví bé xin bạn đừng bấm thêm giao dịch {categoryLabel} nữa nha.",
  "{categoryLabel} đang làm ví bé tụt pin."
]
```

### toxic_friend

```ts
[
  "{categoryLabel} đã {percent}%. Kế hoạch tiết kiệm chắc để trưng.",
  "Tốc độ này mà gọi là kiểm soát thì cũng lạc quan đấy.",
  "{categoryLabel} đang tăng đẹp lắm. Đẹp theo kiểu báo động.",
  "Mới vậy đã {spentText}/{limitText}. Ví chắc quen bị tổn thương rồi.",
  "Câu 'mua nốt' bắt đầu có mùi đắt đỏ rồi đó."
]
```

### vietnamese_parent

```ts
[
  "{categoryLabel} đã {percent}% rồi. Bớt tiêu theo hứng ngay.",
  "Nhìn lại đi, {categoryLabel} đang cháy ngân sách đấy.",
  "Từ giờ khoản nào không cần thì cắt.",
  "{categoryLabel} dùng {spentText}/{limitText} rồi. Đừng có chủ quan.",
  "Đừng để mẹ ví phải mắng thêm lần nữa."
]
```

---

## 14.3. budget_100

### advisor

```ts
[
  "{categoryLabel} chạm giới hạn rồi. Từ giờ chỉ ưu tiên khoản cần.",
  "Ngân sách mục này đã hết. Đừng tự làm khó cuối tháng.",
  "Dừng đúng lúc vẫn hơn sửa sai muộn.",
  "{categoryLabel} đã đủ rồi. Mình tạm khóa các khoản không cần nhé.",
  "Không sao, nhưng từ giờ cần phòng thủ hơn."
]
```

### wallet_pet

```ts
[
  "Ví bé đứng hình. {categoryLabel} full ngân sách rồi.",
  "{categoryLabel} chạm nóc rồi á, cho ví nghỉ nha.",
  "Hết slot cho {categoryLabel}. Ví bé xin đóng cửa.",
  "Ví bé vừa thở dài rất sâu.",
  "{categoryLabel} đã full cây năng lượng xấu rồi 🥲"
]
```

### toxic_friend

```ts
[
  "{categoryLabel} 100%. Chúc mừng, ngân sách đã bị xử đẹp.",
  "Hết ngân sách rồi. Phần còn lại chắc sống bằng niềm tin.",
  "Câu 'mua nốt' đúng là câu đắt nhất tháng.",
  "{categoryLabel} đã chạm trần. Plot twist cuối tháng đang tới.",
  "Ngân sách vừa rời khỏi cuộc trò chuyện."
]
```

### vietnamese_parent

```ts
[
  "{categoryLabel} hết ngân sách rồi. Dừng.",
  "100% rồi mà còn tiêu nữa thì cuối tháng tự chịu.",
  "Đừng viện cớ nữa. Mục này hết tiền rồi.",
  "Từ giờ không có 'nốt lần này'.",
  "Hết là hết. Không thương lượng."
]
```

---

## 14.4. budget_120

### advisor

```ts
[
  "Vượt hơi xa rồi. Nhưng dừng ngay thì vẫn kéo lại được.",
  "{categoryLabel} đang vượt kế hoạch. Hôm nay nên phòng thủ.",
  "Không sao, nhưng từ giờ mình cần nghiêm túc hơn.",
  "{categoryLabel} vượt {percent}%. Mình nên tạm giảm các khoản linh hoạt.",
  "Đây là lúc ưu tiên kiểm soát thay vì thoải mái."
]
```

### wallet_pet

```ts
[
  "Ví bé không khóc, ví bé chỉ tuyệt vọng nhẹ thôi 🥲",
  "{categoryLabel} vượt xa rồi, cứu ví với.",
  "Tình hình hơi căng xinh rồi đó.",
  "Ví bé muốn được ôm sau con số {percent}%.",
  "{categoryLabel} làm ví bé mất ngủ rồi á."
]
```

### toxic_friend

```ts
[
  "{categoryLabel} vượt {percent}%. Đây không còn là chi tiêu, đây là biểu diễn.",
  "Ngân sách đã ngã xuống, còn bạn vẫn chạy tiếp.",
  "Vượt thế này cuối tháng khỏi bất ngờ.",
  "{categoryLabel} đang đi đúng lộ trình: lộ trình áp lực.",
  "Bạn đang biến ngân sách thành nội dung giải trí."
]
```

### vietnamese_parent

```ts
[
  "Vượt {percent}% rồi. Dừng ngay.",
  "{categoryLabel} vượt quá xa rồi, mày đang tự phá kế hoạch.",
  "Khóa chi linh tinh ngay. Không thương lượng.",
  "Đừng tiêu kiểu này nữa, cuối tháng khổ là tự chịu.",
  "Tao nói thẳng: mục này phải phanh lại ngay."
]
```

---

## 14.5. large_transaction

### advisor

```ts
[
  "{amountText} là khoản khá lớn. Nghĩ kỹ là tốt.",
  "Khoản này nặng ví đấy, mình ghi lại để cuối tháng soi kỹ.",
  "Chi lớn rồi, phần còn lại hôm nay đi chậm thôi.",
  "Một khoản lớn vừa đi qua. Mình kiểm tra lại ngân sách nhé.",
  "Nếu khoản này cần thiết thì ổn, còn không thì nên rút kinh nghiệm."
]
```

### wallet_pet

```ts
[
  "{amountText} bay màu. Ví bé vừa tụt mood.",
  "Ví bé hỏi nhỏ: mình chắc chưa á?",
  "Khoản này làm ví bé hơi chóng mặt.",
  "Ví bé vừa mất một miếng linh hồn.",
  "Giao dịch này làm ví bé đứng hình 5 giây."
]
```

### toxic_friend

```ts
[
  "{amountText} bay màu. Một pha biến tiền thành kỷ niệm.",
  "Ví vừa im lặng theo cách rất đáng lo.",
  "Khoản này xong chắc ngân sách cần trị liệu.",
  "Một cú quẹt rất có trọng lượng.",
  "Tiền vừa rời đi không ngoảnh lại."
]
```

### vietnamese_parent

```ts
[
  "{amountText} không nhỏ đâu. Nghĩ kỹ chưa?",
  "Chi mạnh tay thế, cuối tháng đừng than.",
  "Khoản này không cần thiết thì tự biết phải làm gì rồi đấy.",
  "Tiền có phải lá mít đâu mà vung vậy.",
  "Mua gì thì mua, nhớ nhìn lại số dư."
]
```

---

## 14.6. repeat_category_today

### advisor

```ts
[
  "Hôm nay {categoryLabel} xuất hiện hơi nhiều rồi.",
  "Mình đã chi {categoryLabel} vài lần hôm nay. Tạm dừng chút nhé.",
  "Một lần nữa cho {categoryLabel} có thể làm ngân sách lệch nhịp.",
  "Nếu chưa thật cần, mình để khoản này sang hôm khác nhé.",
  "Hôm nay {categoryLabel} đủ rồi, phần còn lại nên giữ."
]
```

### wallet_pet

```ts
[
  "Lại {categoryLabel} nữa hả? Ví bé nhận ra pattern rồi nha.",
  "Hôm nay {categoryLabel} hơi được cưng chiều quá rồi đó.",
  "Ví bé hỏi nhỏ: mình có thật sự cần thêm lần nữa không?",
  "Ví bé thấy {categoryLabel} xuất hiện hơi nhiều rồi á.",
  "Thêm một lần nữa là ví bé dỗi đó nha."
]
```

### toxic_friend

```ts
[
  "Lại {categoryLabel}. Bạn rất chung thủy, tiếc là với việc tiêu tiền.",
  "Hôm nay {categoryLabel} xuất hiện hơi nhiều, chắc ví cũng quen bị tổn thương rồi.",
  "Một lần nữa cho {categoryLabel}. Logic đã tạm nghỉ.",
  "{categoryLabel} hôm nay lên sóng nhiều hơn cả deadline.",
  "Bạn với {categoryLabel} đúng là một mối quan hệ tốn kém."
]
```

### vietnamese_parent

```ts
[
  "Lại {categoryLabel}? Tiền mọc trên cây à?",
  "Hôm nay mày chi {categoryLabel} hơi nhiều rồi đấy.",
  "Dừng cái kiểu thích là mua lại ngay.",
  "{categoryLabel} đủ rồi. Đừng thêm nữa.",
  "Cả ngày cứ {categoryLabel}, ví nào chịu nổi."
]
```

---

## 14.7. repeat_category_week

### advisor

```ts
[
  "Tuần này {categoryLabel} đang lặp lại khá nhiều.",
  "Mình nên đặt giới hạn nhỏ cho {categoryLabel} từ hôm nay.",
  "{categoryLabel} tuần này hơi vượt nhịp. Cân lại nhé.",
  "Thói quen nhỏ đang cộng thành khoản lớn ở {categoryLabel}.",
  "Giảm tần suất {categoryLabel} vài ngày là ngân sách nhẹ hơn nhiều."
]
```

### wallet_pet

```ts
[
  "Tuần này ví bé gặp {categoryLabel} hơi nhiều rồi á.",
  "{categoryLabel} xuất hiện liên tục, ví bé hơi mệt.",
  "Ví bé xin một tuần ít {categoryLabel} hơn nha.",
  "{categoryLabel} đang làm ví bé tụt pin theo tuần.",
  "Tuần này {categoryLabel} được ưu ái quá mức rồi."
]
```

### toxic_friend

```ts
[
  "Tuần này {categoryLabel} chăm chỉ xuất hiện như nhân viên xuất sắc.",
  "Bạn không chi lẻ, bạn đang xây thói quen tốn tiền.",
  "{categoryLabel} tuần này đúng là nhân vật chính của ví.",
  "Ví không sợ một lần, ví sợ bạn lặp lại với niềm tin.",
  "Thói quen này nhỏ thôi, nhỏ kiểu rút tiền đều đều."
]
```

### vietnamese_parent

```ts
[
  "Tuần này {categoryLabel} nhiều quá rồi. Bớt lại.",
  "Cứ lặp lại thế này thì tiền nào chịu nổi.",
  "Mày phải cắt tần suất {categoryLabel} đi.",
  "Đừng biến {categoryLabel} thành thói quen đốt tiền.",
  "Tuần này đủ rồi, nghỉ đi."
]
```

---

## 14.8. late_night_spending

### advisor

```ts
[
  "Chi tiêu ban đêm dễ bốc đồng hơn. Mình cân nhắc lại nhé.",
  "Đêm rồi, quyết định mua sắm nên để sáng mai tỉnh táo hơn.",
  "Khoản này có thể chờ tới sáng. Ví sẽ cảm ơn mình.",
  "Nếu không gấp, mình ngủ trước rồi quyết sau.",
  "Ban đêm không phải lúc tốt nhất để ví ra quyết định."
]
```

### wallet_pet

```ts
[
  "Đêm rồi mà ví bé vẫn phải làm việc á 🥹",
  "Ví bé buồn ngủ rồi, đừng bắt ví thanh toán nữa.",
  "Giao dịch đêm khuya làm ví bé giật mình.",
  "Ví bé xin đi ngủ trước khi bạn chốt thêm.",
  "Đêm rồi, ví bé cần chăn chứ không cần hóa đơn."
]
```

### toxic_friend

```ts
[
  "Mua đồ lúc đêm: quyết định rất tỉnh táo, chắc vậy.",
  "Đêm khuya là lúc lý trí ngủ, còn ví thì chịu trận.",
  "Giao dịch này có mùi bốc đồng lúc 2 giờ sáng.",
  "Sáng mai bạn sẽ hiểu vì sao ví im lặng.",
  "Một cú chi tiêu rất hợp vibe mất kiểm soát."
]
```

### vietnamese_parent

```ts
[
  "Đêm hôm còn tiêu tiền. Đi ngủ đi.",
  "Giờ này mà còn mua với bán gì nữa?",
  "Để sáng mai tỉnh táo rồi tính.",
  "Đừng có thức khuya rồi tiêu linh tinh.",
  "Ngủ đi, ví cũng cần nghỉ."
]
```

---

## 14.9. salary_received / income_received

### advisor

```ts
[
  "Lương về rồi. Chia tiền trước là đẹp nhất.",
  "Đây là lúc tốt nhất để giữ kỷ luật tài chính.",
  "Tiền vừa về, mình ưu tiên quỹ cần thiết trước nhé.",
  "Một kế hoạch nhỏ hôm nay sẽ cứu cả tháng.",
  "Lương về là tín hiệu để phân bổ, không phải xả hết."
]
```

### wallet_pet

```ts
[
  "Lương về rồi, ví bé xin được bảo vệ.",
  "Ví bé vui rồi, giờ mình chia tiền thật ngoan nha.",
  "Tiền vừa về nhà, đừng để đi du lịch quá nhanh nha.",
  "Ví bé vừa hồi máu, đừng đánh boss liền.",
  "Lương về làm ví bé cười, giữ nụ cười đó nha."
]
```

### toxic_friend

```ts
[
  "Lương về rồi. Đừng biến nó thành lịch sử giao dịch trong 3 ngày.",
  "Tiền vừa vào tài khoản. Các app mua sắm chắc đang mỉm cười.",
  "Lương về không có nghĩa là ví bất tử.",
  "Khoảnh khắc nguy hiểm nhất tháng: vừa có tiền.",
  "Đừng để tiền vào như khách, ra như chủ nhà."
]
```

### vietnamese_parent

```ts
[
  "Lương về thì chia tiền trước, đừng tiêu trước tính sau.",
  "Có tiền không có nghĩa là được phá ngân sách.",
  "Giữ tiền ngay từ đầu tháng, đừng vài ngày sau lại kêu nghèo.",
  "Trả khoản cần trả trước, mua sắm để sau.",
  "Đừng để lương vừa về đã bay sạch."
]
```

---

## 14.10. no_spend_day

### advisor

```ts
[
  "Hôm nay chưa tiêu linh tinh, giữ nhịp này nhé.",
  "Một ngày yên bình cho ví. Rất đáng khen.",
  "Không chi không cần thiết là một chiến thắng nhỏ.",
  "Ví hôm nay khỏe hơn hẳn.",
  "Một ngày kiểm soát tốt. Cứ thế tiếp tục."
]
```

### wallet_pet

```ts
[
  "Không chi linh tinh nè, ví bé thả tim.",
  "Hôm nay ví bé được nghỉ phép.",
  "Ví bé ngủ ngon vì bạn không tiêu bậy.",
  "Một ngày rất ngoan với tiền luôn á.",
  "Ví bé đang cười rất hiền."
]
```

### toxic_friend

```ts
[
  "Hôm nay chưa tiêu linh tinh. Lạ nhưng đáng khen.",
  "Ví còn sống khỏe. Một diễn biến hiếm gặp.",
  "Không chi bậy hôm nay, cuối cùng lý trí cũng online.",
  "Một ngày không làm ví tổn thương. Tiến bộ đấy.",
  "Hôm nay ngân sách không bị drama. Khá hiếm."
]
```

### vietnamese_parent

```ts
[
  "Hôm nay không tiêu linh tinh, thế mới giống người biết nghĩ.",
  "Giữ được như hôm nay thì ví mới sống nổi.",
  "Tốt. Mai cũng đừng phá.",
  "Không tiêu bậy là đúng, không phải thành tích để chủ quan.",
  "Hôm nay ổn. Cứ thế mà làm."
]
```

---

## 14.11. saving_streak

### advisor

```ts
[
  "{days} ngày kiểm soát tốt rồi. Đây là tiến bộ thật.",
  "Chuỗi tiết kiệm đang đẹp. Đừng phá nhịp nhé.",
  "Bạn đang tạo một thói quen rất đáng giữ.",
  "Ví ổn hơn nhờ những ngày như thế này.",
  "Tiết kiệm đều như vậy sẽ tạo khác biệt lớn."
]
```

### wallet_pet

```ts
[
  "{days} ngày ngoan với tiền, ví bé tự hào á.",
  "Ví bé đang thả tim vì chuỗi tiết kiệm này.",
  "Chuỗi đẹp quá, đừng làm ví bé hụt hẫng nha.",
  "Ví bé thấy tương lai sáng hơn một xíu rồi.",
  "Bạn đang chăm ví bé rất tốt đó."
]
```

### toxic_friend

```ts
[
  "{days} ngày không phá ngân sách. Ai rồi cũng có lúc trưởng thành.",
  "Ví chưa bị tổn thương mấy ngày rồi. Lạ nhưng tốt.",
  "Chuỗi này đẹp đấy, đừng để một cú chốt đơn phá hỏng.",
  "Lý trí đang thắng. Hiếm, nên giữ.",
  "Bạn đang cư xử như người có kế hoạch. Bất ngờ đấy."
]
```

### vietnamese_parent

```ts
[
  "{days} ngày giữ được tiền. Tốt, tiếp tục.",
  "Đấy, biết nghĩ thì vẫn làm được.",
  "Giữ như này thì cuối tháng mới đỡ khổ.",
  "Đừng chủ quan rồi phá chuỗi.",
  "Tốt. Tiền phải giữ từ những ngày như này."
]
```

---

## 14.12. duplicate_transaction

### advisor

```ts
[
  "Có vẻ giao dịch này bị trùng. Mình kiểm tra lại trước khi lưu nhé.",
  "PayNote thấy dấu hiệu trùng giao dịch.",
  "Khoản này giống một giao dịch đã có. Xem lại chút nhé.",
  "Để tránh sai số, mình tạm đánh dấu giao dịch này là nghi trùng.",
  "Giao dịch có dấu hiệu lặp. Kiểm tra lại sẽ an toàn hơn."
]
```

### wallet_pet

```ts
[
  "Ví bé thấy giao dịch này quen quen á.",
  "Khoản này hình như xuất hiện rồi nha 🧐",
  "Ví bé nghi có một pha nhân đôi giao dịch.",
  "Giao dịch này giống déjà vu quá.",
  "Ví bé chặn nhẹ vì sợ bạn lưu trùng."
]
```

### toxic_friend

```ts
[
  "Giao dịch này nhìn quen như lời hứa tiết kiệm.",
  "Có mùi duplicate. Tiền đi một lần thôi, app đừng ghi hai lần.",
  "Khoản này xuất hiện lại hơi đáng ngờ.",
  "Một giao dịch, hai lần ghi? Ngân sách không cần drama đó.",
  "PayNote vừa bắt được một pha giống nhau khả nghi."
]
```

### vietnamese_parent

```ts
[
  "Giao dịch này hình như trùng rồi, kiểm tra lại.",
  "Đừng lưu bừa, sai ngân sách đấy.",
  "Khoản này có dấu hiệu ghi hai lần.",
  "Xem lại trước khi ví bị tính oan.",
  "Trùng thì xóa bớt, đừng để số liệu loạn."
]
```

---

## 14.13. missed_transaction

### advisor

```ts
[
  "Có thể đang thiếu một giao dịch. Mình kiểm tra lại thông báo ngân hàng nhé.",
  "PayNote thấy dòng tiền có điểm chưa khớp.",
  "Có dấu hiệu bỏ sót giao dịch. Xem lại để số liệu chuẩn hơn.",
  "Một khoản có thể chưa được ghi nhận.",
  "Kiểm tra lại lịch sử ngân hàng sẽ giúp ngân sách chính xác hơn."
]
```

### wallet_pet

```ts
[
  "Ví bé thấy thiếu thiếu một khoản gì đó.",
  "Hình như có giao dịch trốn khỏi PayNote á.",
  "Ví bé nghi có khoản chưa được ghi lại.",
  "Số liệu hơi lệch vibe rồi nha.",
  "Ví bé cần bạn soi lại ngân hàng một xíu."
]
```

### toxic_friend

```ts
[
  "Có vẻ một giao dịch đang chơi trốn tìm.",
  "Số liệu lệch rồi. Ngân sách không tự drama được đâu.",
  "Một khoản chưa được ghi, nhưng ví thì chắc đã đau rồi.",
  "PayNote nghi có giao dịch lọt lưới.",
  "Chi thì có chi, ghi thì chưa. Rất nghệ."
]
```

### vietnamese_parent

```ts
[
  "Có khoản chưa ghi kìa, kiểm tra lại.",
  "Đừng để thiếu giao dịch rồi cuối tháng sai hết.",
  "Soi lại ngân hàng đi, số liệu đang lệch.",
  "Ghi cho đủ, không thì ngân sách loạn.",
  "Có vẻ bỏ sót giao dịch rồi đấy."
]
```

---

## 14.14. end_of_day_summary

### advisor

```ts
[
  "Hôm nay ví đã đi qua {count} giao dịch. Nghỉ một chút rồi mai tính tiếp.",
  "Tổng kết nhẹ: hôm nay có {count} khoản chi. Mình nhìn lại để ngày mai tốt hơn.",
  "Ngày hôm nay xong rồi. Điều quan trọng là mình biết tiền đã đi đâu.",
  "Theo dõi được là đã hơn một nửa cuộc chơi.",
  "Mai chỉ cần tốt hơn hôm nay một chút là đủ."
]
```

### wallet_pet

```ts
[
  "Hôm nay ví bé xử lý {count} giao dịch, xin được nghỉ.",
  "Ví bé đã làm việc chăm chỉ hôm nay rồi á.",
  "Kết thúc ngày, ví bé cần sạc pin.",
  "Hôm nay tiền đi hơi nhiều chưa ta? Ví bé đang suy nghĩ.",
  "Ví bé chúc bạn ngủ ngon, đừng mơ thấy hóa đơn."
]
```

### toxic_friend

```ts
[
  "Hôm nay có {count} giao dịch. Ví đã chịu đựng rất chuyên nghiệp.",
  "Một ngày nữa ví sống sót. Khá đáng nể.",
  "Tổng kết ngày: tiền đi, bài học ở lại.",
  "Hôm nay ngân sách có drama hay không thì bạn tự biết.",
  "Ví không nói gì, nhưng lịch sử giao dịch nói khá nhiều."
]
```

### vietnamese_parent

```ts
[
  "Hôm nay tiêu thế nào thì tự nhìn lại đi.",
  "{count} giao dịch rồi đấy, mai bớt lại.",
  "Cuối ngày rồi, xem lại tiền đi đâu.",
  "Biết ghi lại là tốt, nhưng phải biết sửa nữa.",
  "Mai tiêu có nghĩ hơn hôm nay."
]
```

---

## 14.15. end_of_month_warning

### advisor

```ts
[
  "Cuối tháng gần tới rồi. Mình ưu tiên khoản cần thiết trước nhé.",
  "Còn {daysLeft} ngày, giữ nhịp một chút là qua tháng ổn.",
  "Giai đoạn cuối tháng nên phòng thủ nhẹ.",
  "Đừng để vài ngày cuối phá công sức cả tháng.",
  "Còn ít ngày thôi, mình chi thật chọn lọc nhé."
]
```

### wallet_pet

```ts
[
  "Còn {daysLeft} ngày nữa, ví bé xin được sống sót.",
  "Cuối tháng rồi, ví bé hơi nhạy cảm nha.",
  "Ví bé cần bạn dịu tay vài ngày cuối.",
  "Sắp qua tháng rồi, đừng làm ví bé khóc phút chót.",
  "Ví bé đang đếm ngày về lương."
]
```

### toxic_friend

```ts
[
  "Còn {daysLeft} ngày. Đây là lúc ví cần sinh tồn, không cần phiêu lưu.",
  "Cuối tháng rồi, đừng tạo plot twist tài chính nữa.",
  "Vài ngày cuối mà tiêu bốc đồng là phim có kết buồn.",
  "Ngân sách đã mệt, đừng bắt nó chạy marathon.",
  "Còn ít ngày thôi, đừng biến tháng này thành bài học đắt tiền."
]
```

### vietnamese_parent

```ts
[
  "Cuối tháng rồi, giữ tiền lại.",
  "Còn {daysLeft} ngày nữa, đừng tiêu bậy.",
  "Sắp hết tháng rồi mà còn vung tay là tự chịu.",
  "Khoản nào không cần thì cắt hết.",
  "Mấy ngày cuối phải biết giữ ví."
]
```

---

## 14.16. food context

### advisor

```ts
[
  "Ăn ngon được, nhưng ví cũng cần sống.",
  "Bữa này ổn, nhưng đừng để thành thói quen đắt đỏ.",
  "Hôm nay ăn ngoài rồi, bữa sau cân lại nhé.",
  "Giảm một bữa gọi món là ngân sách nhẹ hơn nhiều.",
  "Ăn uống vui, nhưng nên có trần cho mỗi ngày."
]
```

### wallet_pet

```ts
[
  "Bụng vui rồi, giờ cho ví vui với nha.",
  "Đồ ăn ngon đó, nhưng ví bé hơi rén.",
  "Ví bé xin một bữa cơm nhà.",
  "Bụng no, ví bé hơi rỗng.",
  "Món này ngon, nhưng ví bé muốn ăn cơm nhà."
]
```

### toxic_friend

```ts
[
  "Ăn ngoài nữa à? Bếp ở nhà chắc để làm cảnh.",
  "Bạn đang đầu tư mạnh vào niềm vui ngắn hạn.",
  "Gọi món nhanh hơn cả lúc hứa tiết kiệm.",
  "Ăn ngon hôm nay, cuối tháng ăn năn.",
  "Đồ ăn tới nhanh, số dư đi cũng nhanh."
]
```

### vietnamese_parent

```ts
[
  "Bếp ở nhà để trưng à?",
  "Đừng lấy lý do stress để đốt tiền ăn uống.",
  "Ăn ngoài ít thôi. Ví không chịu nổi đâu.",
  "Cơm nhà không có tội.",
  "Ăn uống kiểu này thì tiền nào cho đủ."
]
```

---

## 14.17. cafe context

### advisor

```ts
[
  "Một ly thì vui, nhiều ly thì ngân sách buồn.",
  "Cafe hôm nay đủ rồi, ví cần tỉnh theo.",
  "Giảm một ly thôi là cuối tháng khác hẳn.",
  "Thói quen nhỏ đang cộng thành khoản lớn.",
  "Tự pha vài hôm cũng là một cách giữ ví khỏe."
]
```

### wallet_pet

```ts
[
  "Cafe ngon nhưng ví bé run rồi nha.",
  "Thêm topping nữa là ví bé xỉu á.",
  "Một ly nữa thôi là câu nói nguy hiểm nhất hôm nay.",
  "Ví bé xin bạn bỏ topping hôm nay.",
  "Ly này thơm, hóa đơn thì hơi đau."
]
```

### toxic_friend

```ts
[
  "Ví bạn đang tài trợ full cho caffeine.",
  "Tỉnh thì có tỉnh, ngân sách thì ngủm.",
  "Trà sữa không đắt. Đắt là cái thói 'ly cuối'.",
  "Một ly nhỏ, một vấn đề cộng dồn lớn.",
  "Caffeine cứu bạn, nhưng ai cứu ví?"
]
```

### vietnamese_parent

```ts
[
  "Cắt bớt cafe ngoài quán ngay.",
  "Đừng có 'ly cuối', câu đấy nghe nhiều rồi.",
  "Uống ít lại. Tiền không tự mọc lại đâu.",
  "Tự pha ở nhà đi.",
  "Ngày nào cũng cafe thì ví nào chịu."
]
```

---

## 14.18. shopping context

### advisor

```ts
[
  "Món này có thể thích thật, nhưng cần chưa?",
  "Cho vào giỏ được, thanh toán thì nghĩ thêm.",
  "Chờ 24 tiếng rồi mua cũng chưa muộn.",
  "Nếu vẫn muốn sau một ngày, lúc đó hãy mua.",
  "Mua ít hơn một món hôm nay là nhẹ hơn cuối tháng."
]
```

### wallet_pet

```ts
[
  "Món này xinh, nhưng số dư cũng cần được yêu thương.",
  "Chốt đơn vui đó, ví bé hơi buồn.",
  "Ví bé xin bạn thoát app mua sắm.",
  "Giỏ hàng vui, ví bé áp lực.",
  "Ví bé thấy nút thanh toán hơi đáng sợ."
]
```

### toxic_friend

```ts
[
  "Kế hoạch tiết kiệm vừa bị freeship đánh bại.",
  "Sale 50% nhưng tiền mất vẫn là tiền thật.",
  "Bạn không mua đồ, bạn đang mua áp lực cuối tháng.",
  "Freeship không miễn phí cho tương lai của ví.",
  "Chốt đơn nhanh hơn chốt kế hoạch tài chính."
]
```

### vietnamese_parent

```ts
[
  "Không cần thì đừng mua.",
  "Sale không phải giấy phép đốt tiền.",
  "Bỏ ngay kiểu thấy rẻ là chốt.",
  "Tủ còn đồ không mà mua nữa?",
  "Đừng để chữ sale dắt mũi."
]
```

---

## 14.19. transport context

### advisor

```ts
[
  "Di chuyển hôm nay hơi nhiều, mình cân lại phần còn lại nhé.",
  "Khoản đi lại đang cộng dồn. Theo dõi thêm chút sẽ tốt hơn.",
  "Nếu có thể gộp chuyến, ví sẽ nhẹ hơn.",
  "Một vài chuyến nhỏ cũng thành khoản đáng kể.",
  "Đi lại cần thiết, nhưng vẫn nên có giới hạn."
]
```

### wallet_pet

```ts
[
  "Ví bé vừa đi thêm một chuyến nữa.",
  "Đi lại nhiều quá, ví bé hơi say xe.",
  "Ví bé xin một ngày ít cuốc xe hơn.",
  "Mỗi chuyến một ít, ví bé mất máu dần.",
  "Ví bé muốn được ở nhà hôm nay."
]
```

### toxic_friend

```ts
[
  "Grab/be đang có vẻ thân với ví bạn quá.",
  "Di chuyển kiểu này, ví cũng cần bản đồ sinh tồn.",
  "Mỗi chuyến nhỏ, tổng lại thì không nhỏ chút nào.",
  "Bạn không đi lại, bạn đang tài trợ giao thông cá nhân.",
  "Ví vừa book thêm một vé áp lực cuối tháng."
]
```

### vietnamese_parent

```ts
[
  "Đi lại nhiều quá rồi, tính lại đi.",
  "Cuốc nào không cần thì bớt.",
  "Tiền xe cũng là tiền, đừng coi nhẹ.",
  "Gộp việc lại rồi đi một lần thôi.",
  "Không phải cứ lười là gọi xe."
]
```

---

## 14.20. bill context

### advisor

```ts
[
  "Hóa đơn là khoản cần thiết, mình ghi nhận để ngân sách rõ hơn.",
  "Khoản này cố định, nên tách riêng để dễ kiểm soát.",
  "Thanh toán hóa đơn xong rồi, mình cân lại phần còn lại nhé.",
  "Chi phí cố định nên được ưu tiên trước.",
  "Ghi lại hóa đơn giúp tháng sau dự đoán tốt hơn."
]
```

### wallet_pet

```ts
[
  "Hóa đơn tới rồi, ví bé ký tên trong nước mắt.",
  "Ví bé không vui, nhưng biết khoản này cần thiết.",
  "Thanh toán xong, ví bé nhẹ lòng mà cũng nhẹ tiền.",
  "Ví bé vừa trả phí tồn tại.",
  "Hóa đơn ghé thăm, ví bé phải tiếp khách."
]
```

### toxic_friend

```ts
[
  "Hóa đơn: vị khách đều đặn và không ai mời.",
  "Khoản này không vui, nhưng ít nhất không phải mua bốc đồng.",
  "Tiền điện nước không cà khịa, nó chỉ lạnh lùng trừ tiền.",
  "Một khoản bắt buộc, khác với vài khoản 'thích thì mua'.",
  "Hóa đơn tới đúng lịch, như áp lực trưởng thành."
]
```

### vietnamese_parent

```ts
[
  "Hóa đơn thì phải trả, nhưng nhớ trừ vào ngân sách.",
  "Khoản cố định đấy, đừng tiêu lẫn lung tung.",
  "Trả xong rồi thì bớt khoản khác lại.",
  "Điện nước không đùa được đâu.",
  "Chi phí cố định phải để riêng từ đầu tháng."
]
```

---

## 15. Native fallback Kotlin

Nếu Android native đang cần fallback khi JS không chạy, phải đồng bộ ít nhất một subset.

Gợi ý:

```kotlin
enum class NotificationPersona {
    ADVISOR,
    WALLET_PET,
    TOXIC_FRIEND,
    VIETNAMESE_PARENT
}
```

Mapping legacy:

```kotlin
fun normalizePersona(value: String?): NotificationPersona {
    return when (value) {
        "gentle", "advisor" -> NotificationPersona.ADVISOR
        "cute", "wallet_pet" -> NotificationPersona.WALLET_PET
        "sarcastic_strong", "toxic_friend" -> NotificationPersona.TOXIC_FRIEND
        "angry", "vietnamese_parent" -> NotificationPersona.VIETNAMESE_PARENT
        else -> NotificationPersona.ADVISOR
    }
}
```

Native fallback không cần đủ 300 câu. Chỉ cần khoảng:

```txt
4 persona × 5 tình huống phổ biến × 3 câu = 60 câu
```

Các tình huống native fallback:

```txt
budget_80
budget_100
budget_120
late_night_spending
end_of_day_summary
```

---

## 16. UI setting

Trong Settings, thay text mode cũ.

### Cũ

```txt
Gentle
Cute
Sarcastic strong
Angry
```

### Mới

```txt
Cố vấn tử tế
Ví bé biết khóc
Bạn thân toxic
Mẹ Việt Nam
```

### UI copy

```ts
const PERSONA_OPTIONS = [
  {
    id: 'advisor',
    title: 'Cố vấn tử tế',
    description: 'Nhắc nhẹ, tỉnh táo, không làm bạn áp lực.',
    preview: 'Khoản này hơi căng rồi. Mình chậm lại một nhịp nhé.',
  },
  {
    id: 'wallet_pet',
    title: 'Ví bé biết khóc',
    description: 'Dễ thương, meme nhẹ, hợp người thích vui vẻ.',
    preview: 'Ví bé rén ngang 🥹',
  },
  {
    id: 'toxic_friend',
    title: 'Bạn thân toxic',
    description: 'Cà khịa mạnh, vui nhưng vẫn đúng trọng tâm.',
    preview: 'Kế hoạch tiết kiệm bị một ly trà sữa đánh bại.',
  },
  {
    id: 'vietnamese_parent',
    title: 'Mẹ Việt Nam',
    description: 'Mắng yêu kiểu phụ huynh, gắt nhưng đời.',
    preview: 'Tiền mọc trên cây à?',
  },
];
```

Nên thêm preview button:

```txt
Bấm thử thông báo
```

Mỗi lần bấm random một template theo persona đang chọn.

---

## 17. Strong language setting

Nên thêm setting:

```ts
allowStrongLanguage: boolean;
```

Default:

```ts
false
```

Nếu `false`, tránh template có:

```txt
mày
tao
tự chịu
```

Hoặc chỉ dùng ở mức nhẹ.

Nếu `true`, cho phép persona `vietnamese_parent` gắt hơn.

Implementation:

```ts
tags: ['strong_language']
```

Khi chọn template:

```ts
if (!settings.allowStrongLanguage) {
  candidates = candidates.filter(t => !t.tags?.includes('strong_language'));
}
```

---

## 18. Rule an toàn nội dung

Không được có:

```txt
- Chửi tục nặng
- Nhục mạ ngoại hình
- Nhục mạ thu nhập
- Nhắm vào bệnh tật/sức khỏe
- Đe dọa
- Xúc phạm gia đình
- Kỳ thị
```

Được phép:

```txt
- Cà khịa hành vi chi tiêu
- Mắng yêu
- Meme nhẹ
- Nói "ví đau", "ví khóc", "ngân sách cần trị liệu"
```

---

## 19. Rollout plan

### Phase 1 - Foundation

- Tạo folder `src/services/notifications`.
- Thêm types.
- Thêm persona mapping.
- Thêm category detection.
- Thêm format template.
- Thêm seed template.
- Thêm engine pick template.
- Viết unit test cho:
  - normalizePersona
  - detectCategoryContext
  - formatNotificationTemplate
  - pickNotificationTemplate

### Phase 2 - Replace old notification

- Refactor `budgetAlerts.ts` gọi engine mới.
- Refactor `roastFallbackTemplates.ts` thành wrapper.
- Đảm bảo không còn gọi trực tiếp template cũ.
- Thay toàn bộ message cũ bằng message mới.

### Phase 3 - Memory chống lặp

- Lưu memory local.
- Không lặp 20 template gần nhất.
- Không lặp template trong 7 ngày.
- Cooldown theo trigger-category.
- Reset daily counters theo ngày.

### Phase 4 - UI Settings

- Đổi 4 mode hiển thị.
- Migration setting cũ.
- Thêm preview notification.
- Thêm toggle strong language nếu cần.

### Phase 5 - Native fallback

- Update Kotlin fallback.
- Mapping legacy mode.
- Đồng bộ một subset template.
- Đảm bảo periodic notification vẫn chạy khi JS không active.

### Phase 6 - QA

Test các case:

```txt
- User cũ đang chọn gentle vẫn hoạt động.
- User cũ đang chọn cute vẫn hoạt động.
- User cũ đang chọn sarcastic_strong vẫn hoạt động.
- User cũ đang chọn angry vẫn hoạt động.
- Không lặp cùng câu trong 20 lần gần nhất.
- Không spam cùng category liên tục.
- Budget 80/100/120 ra đúng severity.
- Category cafe ra câu cafe.
- Category ăn uống ra câu food.
- Category shopping ra câu shopping.
- Nếu thiếu context thì fallback generic.
- Native fallback không crash.
```

---

## 20. Acceptance criteria

Hoàn thành khi:

```txt
1. Không còn dùng message cũ trong notification chính.
2. 4 mode cũ được đổi thành 4 persona mới trên UI.
3. Data cũ được migrate không lỗi.
4. Có ít nhất 250 template mới trong app.
5. Có chống lặp bằng recentTemplateIds.
6. Có cooldown theo trigger-category.
7. Có category context templates.
8. Notification không cần Gemini.
9. Gemini chỉ còn dùng cho phân tích nâng cao/chat nếu có.
10. Android native fallback vẫn có thông báo.
```

---

## 21. Gợi ý commit

```txt
feat(notifications): replace roast templates with persona-based notification engine
```

Commit body:

```txt
- Add notification persona model and legacy mode migration
- Replace old roast fallback templates with persona-based templates
- Add trigger/category/severity based template picking
- Add notification memory to avoid repeated messages
- Add category-specific templates for food, cafe, shopping, transport, bill
- Update settings UI to show four persona modes
- Update Android fallback templates and legacy mapping
```

---

## 22. Prompt cho Codex triển khai

Dùng prompt này trong Codex:

```txt
Refactor PayNote notification/roast system.

Goal:
Replace all old notification/roast messages with a new offline persona-based notification engine inspired by Rolly style, but do not copy Rolly messages.

Requirements:
1. Replace legacy AiToneMode:
   - gentle -> advisor / "Cố vấn tử tế"
   - cute -> wallet_pet / "Ví bé biết khóc"
   - sarcastic_strong -> toxic_friend / "Bạn thân toxic"
   - angry -> vietnamese_parent / "Mẹ Việt Nam"

2. Keep backward compatibility:
   - Existing saved values gentle/cute/sarcastic_strong/angry must still work.
   - Normalize old values to new persona IDs.

3. Create a new notification module:
   src/services/notifications/
     notificationTypes.ts
     notificationPersona.ts
     notificationCategory.ts
     notificationTemplates.ts
     notificationMemory.ts
     pickNotificationTemplate.ts
     formatNotificationTemplate.ts
     notificationEngine.ts
     index.ts

4. Replace old template usage:
   - Refactor src/services/roastFallbackTemplates.ts to use the new engine or become a compatibility wrapper.
   - Refactor src/services/budgetAlerts.ts to call the new notification engine.
   - Do not keep old boring messages as active notification copy.

5. Add at least 250 offline templates:
   - Generic trigger templates
   - Category templates for food, cafe, shopping, transport, bill
   - Must cover all 4 personas
   - Must be short, punchy, Vietnamese, screenshot-friendly
   - Avoid profanity, discrimination, and personal insults

6. Add anti-duplication:
   - Store recentTemplateIds
   - Avoid 20 most recent template IDs
   - Avoid same template within 7 days
   - Cooldown same trigger+category
   - If all templates are exhausted, fallback to the oldest shown template

7. Add escalation:
   - budget_50 low
   - budget_80 medium
   - budget_100 high
   - budget_120 critical
   - repeated category spending increases severity

8. Add category detection:
   - food, cafe, shopping, transport, rent, bill, entertainment, health, education
   - Fallback to generic

9. Update Settings UI:
   - Show the four new persona display names
   - Show description and preview text
   - Existing user setting must migrate safely

10. Update Android native fallback:
   - Rename/mapping old modes to new personas
   - Add a smaller subset of fallback messages
   - Ensure PeriodicRoastReceiver still works

11. Add tests if project test setup exists:
   - normalizePersona
   - detectCategoryContext
   - formatNotificationTemplate
   - pickNotificationTemplate anti-duplication
   - cooldown behavior

Acceptance:
- Notification does not call Gemini.
- Old notification messages are replaced.
- App compiles.
- Existing users do not lose their selected mode.
- Notifications feel like:
  advisor, wallet_pet, toxic_friend, vietnamese_parent.
```

---

## 23. Lưu ý quan trọng

Không cố làm notification "thông minh thật" bằng AI realtime. Cảm giác thông minh đến từ:

```txt
- nhiều template tốt
- đúng context
- escalation
- memory chống lặp
- category-specific punchline
```

Một hệ thống 300 template + memory tốt sẽ ổn định hơn gọi Gemini cho từng notification.
