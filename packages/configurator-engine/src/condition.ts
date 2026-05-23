import type { Condition, Ref, Value } from '@forma/types';

function resolveRef(ref: Ref, state: Record<string, unknown>): unknown {
  const key = ref.slice(1); // strip leading '$'
  return state[key];
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return NaN;
}

export function evalCondition(cond: Condition, state: Record<string, unknown>): boolean {
  if ('all' in cond) {
    return cond.all.every(c => evalCondition(c, state));
  }
  if ('any' in cond) {
    return cond.any.some(c => evalCondition(c, state));
  }
  if ('not' in cond) {
    return !evalCondition(cond.not, state);
  }
  if ('eq' in cond) {
    const [ref, val] = cond.eq;
    return resolveRef(ref, state) === val;
  }
  if ('neq' in cond) {
    const [ref, val] = cond.neq;
    return resolveRef(ref, state) !== val;
  }
  if ('gt' in cond) {
    const [ref, val] = cond.gt;
    return toNumber(resolveRef(ref, state)) > val;
  }
  if ('gte' in cond) {
    const [ref, val] = cond.gte;
    return toNumber(resolveRef(ref, state)) >= val;
  }
  if ('lt' in cond) {
    const [ref, val] = cond.lt;
    return toNumber(resolveRef(ref, state)) < val;
  }
  if ('lte' in cond) {
    const [ref, val] = cond.lte;
    return toNumber(resolveRef(ref, state)) <= val;
  }
  if ('in' in cond) {
    const [ref, vals] = cond.in;
    const actual = resolveRef(ref, state) as Value;
    return (vals as Value[]).includes(actual);
  }
  if ('matches' in cond) {
    const [ref, pattern] = cond.matches;
    const actual = resolveRef(ref, state);
    if (typeof actual !== 'string') return false;
    return new RegExp(pattern).test(actual);
  }
  return false;
}
