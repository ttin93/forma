import { describe, it, expect } from 'vitest';
import { evalFormula } from '../src/formula';
import type { Ref } from '@forma/types';

const r = (s: string) => s as Ref;

const s = { width: 4.2, depth: 3.5, color: 'walnut', heaters: 2 };

describe('evalFormula', () => {
  it('number literal', () => expect(evalFormula(320, s)).toBe(320));
  it('zero literal', () => expect(evalFormula(0, s)).toBe(0));
  it('negative literal', () => expect(evalFormula(-50, s)).toBe(-50));

  it('ref — number field', () => expect(evalFormula({ ref: '$width' }, s)).toBe(4.2));
  it('ref — missing field defaults to 0', () => expect(evalFormula({ ref: '$missing' }, s)).toBe(0));

  it('times — two numbers', () => expect(evalFormula({ times: [2, 3] }, s)).toBe(6));
  it('times — ref * literal', () => expect(evalFormula({ times: [{ ref: '$width' }, 10] }, s)).toBeCloseTo(42));
  it('times — three factors', () => expect(evalFormula({ times: [2, 3, 4] }, s)).toBe(24));
  it('times — empty defaults to 1', () => expect(evalFormula({ times: [] }, s)).toBe(1));

  it('plus — two numbers', () => expect(evalFormula({ plus: [10, 20] }, s)).toBe(30));
  it('plus — multiple', () => expect(evalFormula({ plus: [1, 2, 3, 4] }, s)).toBe(10));
  it('plus — empty defaults to 0', () => expect(evalFormula({ plus: [] }, s)).toBe(0));

  it('minus', () => expect(evalFormula({ minus: [100, { ref: '$width' }] }, s)).toBeCloseTo(95.8));

  it('div — normal', () => expect(evalFormula({ div: [100, 4] }, s)).toBe(25));
  it('div — by zero returns 0', () => expect(evalFormula({ div: [100, 0] }, s)).toBe(0));

  it('area — width * depth', () => {
    expect(evalFormula({ area: { width: r('$width'), depth: r('$depth') } }, s)).toBeCloseTo(14.7);
  });

  it('times with area', () => {
    const f = { times: [{ area: { width: r('$width'), depth: r('$depth') } }, 320] };
    expect(evalFormula(f, s)).toBeCloseTo(4704);
  });

  it('table — matching case', () => {
    const f = {
      table: {
        lookup: '$color' as `$${string}`,
        cases: [
          ['walnut', 280],
          ['anthracite', 0],
        ] as Array<[string | number | boolean, number]>,
        default: 0,
      },
    };
    expect(evalFormula(f, s)).toBe(280);
  });

  it('table — default case', () => {
    const f = {
      table: {
        lookup: '$color' as `$${string}`,
        cases: [['stone', 100]] as Array<[string | number | boolean, number]>,
        default: 999,
      },
    };
    expect(evalFormula(f, s)).toBe(999);
  });

  it('table — no match, no default → 0', () => {
    const f = {
      table: {
        lookup: '$color' as `$${string}`,
        cases: [['stone', 100]] as Array<[string | number | boolean, number]>,
      },
    };
    expect(evalFormula(f, s)).toBe(0);
  });

  it('perOption — known option', () => {
    const f = { perOption: { ref: '$color' as `$${string}`, prices: { walnut: 280, white: 0 } } };
    expect(evalFormula(f, s)).toBe(280);
  });

  it('perOption — unknown option → 0', () => {
    const f = { perOption: { ref: '$color' as `$${string}`, prices: { stone: 50 } } };
    expect(evalFormula(f, s)).toBe(0);
  });

  it('heaters * 210', () => {
    expect(evalFormula({ times: [{ ref: '$heaters' }, 210] }, s)).toBe(420);
  });
});
