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

  it('returns unknown for unmatched text', () => {
    expect(detectAIIntent('Hôm nay trời đẹp ghê')).toBe('unknown');
  });
});
