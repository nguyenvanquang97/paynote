import {detectAIIntent} from '../aiIntentService';

describe('detectAIIntent', () => {
  it('detects spending summary', () => {
    expect(detectAIIntent('Tháng này tôi tiêu bao nhiêu?')).toBe('spending_summary');
  });

  it('detects duplicate check', () => {
    expect(detectAIIntent('Có giao dịch nào bị trùng không?')).toBe('duplicate_check');
  });

  it('detects period compare', () => {
    expect(detectAIIntent('So sánh tháng này với tháng trước')).toBe('period_compare');
  });

  it('detects saving advice', () => {
    expect(detectAIIntent('Tôi nên tiết kiệm kiểu gì?')).toBe('saving_advice');
  });

  it('detects budget setup', () => {
    expect(detectAIIntent('Đặt ngân sách ăn uống 2 triệu')).toBe('budget_setup');
    expect(detectAIIntent('set budget cafe 500k')).toBe('budget_setup');
  });

  it('returns unknown for unmatched text', () => {
    expect(detectAIIntent('Hôm nay trời đẹp ghê')).toBe('unknown');
  });
});
