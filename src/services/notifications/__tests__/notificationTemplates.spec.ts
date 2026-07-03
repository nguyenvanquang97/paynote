import {NOTIFICATION_TEMPLATES} from '../notificationTemplates';
import {NOTIFICATION_STYLE_RULES, PROFANITY_BLOCKLIST, normalizeForSimilarity} from '../notificationStyleGuide';

const similarity = (a: string, b: string): number => {
  const aa = new Set(normalizeForSimilarity(a).split(' ').filter(Boolean));
  const bb = new Set(normalizeForSimilarity(b).split(' ').filter(Boolean));
  const intersection = [...aa].filter(x => bb.has(x)).length;
  const union = new Set([...aa, ...bb]).size;
  if (!union) {return 0;}
  return intersection / union;
};

describe('notification templates quality guard', () => {
  it('has production-sized pool and unique ids', () => {
    expect(NOTIFICATION_TEMPLATES.length).toBeGreaterThanOrEqual(300);
    const ids = NOTIFICATION_TEMPLATES.map(item => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('respects style contract and profanity blocklist', () => {
    for (const tpl of NOTIFICATION_TEMPLATES) {
      const style = NOTIFICATION_STYLE_RULES[tpl.persona];
      expect(style).toBeDefined();
      expect(tpl.body.length).toBeLessThanOrEqual(tpl.origin === 'plan' ? 140 : style.maxLength);

      const lower = tpl.body.toLowerCase();
      for (const bad of PROFANITY_BLOCKLIST) {
        expect(lower.includes(bad)).toBe(false);
      }

      if (tpl.persona === 'wallet_pet' && tpl.origin !== 'plan') {
        expect(lower.includes('ví bé')).toBe(true);
      }
    }
  });

  it('keeps enough variety per trigger/persona and avoids near-duplicate spam', () => {
    const counter = new Map<string, number>();
    for (const tpl of NOTIFICATION_TEMPLATES) {
      const key = `${tpl.trigger}:${tpl.persona}`;
      counter.set(key, (counter.get(key) || 0) + 1);
    }

    for (const count of counter.values()) {
      expect(count).toBeGreaterThanOrEqual(5);
    }

    const sample = NOTIFICATION_TEMPLATES.slice(0, 220);
    for (let i = 0; i < sample.length; i += 1) {
      for (let j = i + 1; j < sample.length; j += 1) {
        const sameBucket = sample[i].trigger === sample[j].trigger && sample[i].persona === sample[j].persona;
        if (!sameBucket) {continue;}
        const score = similarity(sample[i].body, sample[j].body);
        expect(score).toBeLessThan(0.95);
      }
    }
  });
});
