import {pickBudgetAlertThreshold} from '../src/services/budgetAlertUtils';

describe('budget alerts threshold', () => {
  it('returns first threshold reached', () => {
    const threshold = pickBudgetAlertThreshold(79.9, () => false);
    expect(threshold).toBe(50);
  });

  it('returns highest threshold reached', () => {
    const threshold = pickBudgetAlertThreshold(121, () => false);
    expect(threshold).toBe(120);
  });

  it('skips triggered threshold and picks next available', () => {
    const threshold = pickBudgetAlertThreshold(121, (t) => t === 120);
    expect(threshold).toBe(100);
  });

  it('returns null when all reached thresholds already triggered', () => {
    const threshold = pickBudgetAlertThreshold(121, (t) => t === 120 || t === 100 || t === 80 || t === 50);
    expect(threshold).toBeNull();
  });
});
