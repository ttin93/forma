import { describe, it, expect } from 'vitest';
import { evalCondition } from '../src/condition';

const s = { width: 4.2, depth: 3.5, color: 'anthracite', led: true, heaters: 2, promo: '' };

describe('evalCondition', () => {
  it('eq — match', () => expect(evalCondition({ eq: ['$color', 'anthracite'] }, s)).toBe(true));
  it('eq — no match', () => expect(evalCondition({ eq: ['$color', 'walnut'] }, s)).toBe(false));
  it('neq — match', () => expect(evalCondition({ neq: ['$color', 'walnut'] }, s)).toBe(true));
  it('neq — no match', () => expect(evalCondition({ neq: ['$color', 'anthracite'] }, s)).toBe(false));

  it('gt — match', () => expect(evalCondition({ gt: ['$heaters', 0] }, s)).toBe(true));
  it('gt — no match', () => expect(evalCondition({ gt: ['$heaters', 5] }, s)).toBe(false));
  it('gte — equal', () => expect(evalCondition({ gte: ['$heaters', 2] }, s)).toBe(true));
  it('gte — above', () => expect(evalCondition({ gte: ['$heaters', 1] }, s)).toBe(true));
  it('gte — below', () => expect(evalCondition({ gte: ['$heaters', 3] }, s)).toBe(false));

  it('lt — match', () => expect(evalCondition({ lt: ['$width', 5] }, s)).toBe(true));
  it('lt — no match', () => expect(evalCondition({ lt: ['$width', 4] }, s)).toBe(false));
  it('lte — equal', () => expect(evalCondition({ lte: ['$width', 4.2] }, s)).toBe(true));

  it('in — match', () => expect(evalCondition({ in: ['$color', ['anthracite', 'white']] }, s)).toBe(true));
  it('in — no match', () => expect(evalCondition({ in: ['$color', ['walnut', 'stone']] }, s)).toBe(false));

  it('matches — match', () => {
    const st = { ...s, promo: 'FIRSTWK42' };
    expect(evalCondition({ matches: ['$promo', '^FIRSTWK[0-9]+$'] }, st)).toBe(true);
  });
  it('matches — no match', () => {
    expect(evalCondition({ matches: ['$promo', '^FIRSTWK[0-9]+$'] }, s)).toBe(false);
  });
  it('matches — non-string ref', () => {
    expect(evalCondition({ matches: ['$heaters', '\\d+'] }, s)).toBe(false);
  });

  it('not — inverts true', () => expect(evalCondition({ not: { eq: ['$color', 'anthracite'] } }, s)).toBe(false));
  it('not — inverts false', () => expect(evalCondition({ not: { eq: ['$color', 'walnut'] } }, s)).toBe(true));

  it('all — all true', () => {
    expect(evalCondition({ all: [{ eq: ['$led', true] }, { gt: ['$heaters', 0] }] }, s)).toBe(true);
  });
  it('all — one false', () => {
    expect(evalCondition({ all: [{ eq: ['$led', true] }, { gt: ['$heaters', 5] }] }, s)).toBe(false);
  });
  it('all — empty always true', () => {
    expect(evalCondition({ all: [] }, s)).toBe(true);
  });

  it('any — one true', () => {
    expect(evalCondition({ any: [{ eq: ['$color', 'walnut'] }, { eq: ['$led', true] }] }, s)).toBe(true);
  });
  it('any — all false', () => {
    expect(evalCondition({ any: [{ eq: ['$color', 'walnut'] }, { gt: ['$heaters', 5] }] }, s)).toBe(false);
  });
  it('any — empty always false', () => {
    expect(evalCondition({ any: [] }, s)).toBe(false);
  });

  it('eq — boolean true', () => expect(evalCondition({ eq: ['$led', true] }, s)).toBe(true));
  it('eq — boolean false', () => expect(evalCondition({ eq: ['$led', false] }, s)).toBe(false));

  it('missing field — eq false', () => {
    expect(evalCondition({ eq: ['$missing', 'x'] }, s)).toBe(false);
  });
  it('missing field — gt false (NaN)', () => {
    expect(evalCondition({ gt: ['$missing', 0] }, s)).toBe(false);
  });
});
