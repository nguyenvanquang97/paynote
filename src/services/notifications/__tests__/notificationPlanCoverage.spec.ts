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
  const root = path.resolve(__dirname, '../../../..');
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
    expect(missing).toEqual([]);
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
