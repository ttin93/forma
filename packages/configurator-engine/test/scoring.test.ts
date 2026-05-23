import { describe, it, expect } from 'vitest';
import { evalScoring } from '../src/scoring';
import type { ScoringRule } from '@forma/types';

const rules: ScoringRule[] = [
  { id: 'large-area',    when: { gte: ['$width', 5] },      points: 30, reason: 'Large pergola' },
  { id: 'led-addon',     when: { eq: ['$led', true] },       points: 15, reason: 'Added LED' },
  { id: 'heaters-addon', when: { gt: ['$heaters', 0] },      points: 20, reason: 'Added heaters' },
  { id: 'premium-color', when: { in: ['$color', ['walnut']] }, points: 10, reason: 'Premium colour' },
  { id: 'phone',         when: { neq: ['$phone', ''] },      points: 25, reason: 'Provided phone' },
];

describe('evalScoring', () => {
  it('no rules trigger → score 0, hot false', () => {
    const result = evalScoring(rules, { width: 3, led: false, heaters: 0, color: 'anthracite', phone: '' });
    expect(result.total).toBe(0);
    expect(result.hot).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  it('led only → 15 points', () => {
    const result = evalScoring(rules, { width: 3, led: true, heaters: 0, color: 'anthracite', phone: '' });
    expect(result.total).toBe(15);
    expect(result.hot).toBe(false);
  });

  it('led + heaters → 35 points', () => {
    const result = evalScoring(rules, { width: 3, led: true, heaters: 1, color: 'anthracite', phone: '' });
    expect(result.total).toBe(35);
  });

  it('reaches hot threshold (≥70)', () => {
    // large(30) + led(15) + heaters(20) + phone(25) = 90
    const result = evalScoring(rules, { width: 5.5, led: true, heaters: 2, color: 'anthracite', phone: '+38641123456' });
    expect(result.total).toBe(90);
    expect(result.hot).toBe(true);
  });

  it('score of 75 is hot — large + heaters + phone', () => {
    // large(30) + heaters(20) + phone(25) = 75 → hot
    const result = evalScoring(rules, { width: 6, led: false, heaters: 1, color: 'white', phone: '+123' });
    expect(result.total).toBe(75);
    expect(result.hot).toBe(true);
  });

  it('all rules trigger → 100 points', () => {
    const result = evalScoring(rules, { width: 5, led: true, heaters: 3, color: 'walnut', phone: '+1' });
    expect(result.total).toBe(100);
    expect(result.hot).toBe(true);
  });

  it('reasons list contains triggered rules', () => {
    const result = evalScoring(rules, { width: 5, led: true, heaters: 0, color: 'anthracite', phone: '' });
    expect(result.reasons.map(r => r.ruleId)).toEqual(['large-area', 'led-addon']);
  });

  it('reasons list is empty when nothing triggers', () => {
    const result = evalScoring(rules, { width: 3, led: false, heaters: 0, color: 'white', phone: '' });
    expect(result.reasons).toHaveLength(0);
  });
});
