import type { Formula, Ref } from '@forma/types';

function resolveRef(ref: Ref, state: Record<string, unknown>): number {
  const key = ref.slice(1);
  const val = state[key];
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'string') {
    const n = Number(val);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

export function evalFormula(formula: Formula, state: Record<string, unknown>): number {
  if (typeof formula === 'number') {
    return formula;
  }

  if ('ref' in formula) {
    return resolveRef(formula.ref, state);
  }

  if ('times' in formula) {
    return formula.times.reduce<number>((acc, f) => acc * evalFormula(f, state), 1);
  }

  if ('plus' in formula) {
    return formula.plus.reduce<number>((acc, f) => acc + evalFormula(f, state), 0);
  }

  if ('minus' in formula) {
    const [a, b] = formula.minus;
    return evalFormula(a, state) - evalFormula(b, state);
  }

  if ('div' in formula) {
    const [a, b] = formula.div;
    const divisor = evalFormula(b, state);
    if (divisor === 0) return 0;
    return evalFormula(a, state) / divisor;
  }

  if ('table' in formula) {
    const { lookup, cases, default: defaultFormula } = formula.table;
    const key = lookup.slice(1);
    const val = state[key];
    for (const [caseVal, caseFormula] of cases) {
      if (val === caseVal) return evalFormula(caseFormula, state);
    }
    return defaultFormula !== undefined ? evalFormula(defaultFormula, state) : 0;
  }

  if ('area' in formula) {
    const { width, depth } = formula.area;
    return resolveRef(width, state) * resolveRef(depth, state);
  }

  if ('perOption' in formula) {
    const { ref, prices } = formula.perOption;
    const key = ref.slice(1);
    const val = state[key];
    if (typeof val === 'string' && val in prices) {
      return prices[val];
    }
    return 0;
  }

  return 0;
}
