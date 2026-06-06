import {NOTIFICATION_TEMPLATES} from '../notificationTemplates';

declare const require: any;
declare const __dirname: string;

const fs = require('fs');
const path = require('path');

const normalize = (text: string): string => text
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s{}%']/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const extractPlanMessages = (): string[] => {
  let root = path.resolve(__dirname);
  while (!fs.existsSync(path.join(root, 'paynote_notification_refactor_plan.md'))) {
    const next = path.dirname(root);
    if (next === root) {
      throw new Error('Cannot find paynote_notification_refactor_plan.md');
    }
    root = next;
  }
  const plan = fs.readFileSync(path.join(root, 'paynote_notification_refactor_plan.md'), 'utf8');
  const start = plan.indexOf('# 14. Bộ message seed chi tiết');
  const end = plan.indexOf('## 15. Native fallback Kotlin');
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);

  const seen = new Set<string>();
  const messages: string[] = [];
  const body = plan.slice(start, end);
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^\s*"((?:[^"\\]|\\.)*)",?\s*$/);
    if (!match) {continue;}
    const message = match[1].replace(/\\"/g, '"');
    const key = normalize(message);
    if (seen.has(key)) {continue;}
    seen.add(key);
    messages.push(message);
  }
  return messages;
};

describe('notification plan coverage', () => {
  it('seeds every valid message from the plan seed section into runtime templates', () => {
    const runtime = new Set(NOTIFICATION_TEMPLATES.map(item => normalize(item.body)));
    const missing = extractPlanMessages().filter(message => !runtime.has(normalize(message)));
    const intentionallyRewrittenVietnameseParent = new Set([
      '{categoryLabel} đã {percent}% rồi, liệu mà giữ tay.',
      'Mới nửa tháng/nửa ngân sách đã thế này rồi đấy.',
      'Từ giờ bớt khoản không cần lại.',
      'Đừng để đến cuối tháng rồi lại kêu.',
      'Tiêu thì nhìn ngân sách một chút.',
      'Đừng để mẹ ví phải mắng thêm lần nữa.',
      'Đừng viện cớ nữa. Mục này hết tiền rồi.',
      'Đừng tiêu kiểu này nữa, cuối tháng khổ là tự chịu.',
      'Lương về thì chia tiền trước, đừng tiêu trước tính sau.',
      'Đừng để lương vừa về đã bay sạch.',
      'Đừng chủ quan rồi phá chuỗi.',
      'Trùng thì xóa bớt, đừng để số liệu loạn.',
      'Đừng để thiếu giao dịch rồi cuối tháng sai hết.',
      'Còn {daysLeft} ngày nữa, đừng tiêu bậy.',
      'Đừng để chữ sale dắt mũi.',
      'Khoản cố định đấy, đừng tiêu lẫn lung tung.',
    ].map(normalize));
    const unexpectedMissing = missing.filter(message => !intentionallyRewrittenVietnameseParent.has(normalize(message)));
    expect(unexpectedMissing).toEqual([]);
  });

  it('contains signature plan messages with stable plan origin', () => {
    const signatures = [
      'Lương về rồi. Đừng biến nó thành lịch sử giao dịch trong 3 ngày.',
      'Di chuyển hôm nay hơi nhiều, mình cân lại phần còn lại nhé.',
      'Grab/be đang có vẻ thân với ví bạn quá.',
      "Trà sữa không đắt. Đắt là cái thói 'ly cuối'.",
      'Tiền mọc trên cây à?',
    ];

    for (const signature of signatures) {
      const matched = NOTIFICATION_TEMPLATES.find(item => normalize(item.body).includes(normalize(signature)));
      expect(matched).toBeTruthy();
      expect(matched?.origin).toBe('plan');
    }
  });

  it('has plan templates in key runtime buckets', () => {
    expect(NOTIFICATION_TEMPLATES).toEqual(expect.arrayContaining([
      expect.objectContaining({
        trigger: 'salary_received',
        persona: 'toxic_friend',
        origin: 'plan',
        body: 'Lương về rồi. Đừng biến nó thành lịch sử giao dịch trong 3 ngày.',
      }),
      expect.objectContaining({
        trigger: 'repeat_category_today',
        persona: 'toxic_friend',
        context: 'transport',
        origin: 'plan',
        body: 'Grab/be đang có vẻ thân với ví bạn quá.',
      }),
      expect.objectContaining({
        trigger: 'repeat_category_today',
        persona: 'vietnamese_parent',
        origin: 'plan',
        body: 'Lại {categoryLabel}? Tiền mọc trên cây à?',
      }),
    ]));
  });
});
