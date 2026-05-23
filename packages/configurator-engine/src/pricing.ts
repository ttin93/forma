import type { PricingRule, PricingBreakdownItem } from '@forma/types';
import { evalCondition } from './condition';
import { evalFormula } from './formula';

export interface PricingResult {
  breakdown: PricingBreakdownItem[];
  subtotal: number; // cents (subtotal_net before vat)
  vat: number;      // cents
  total: number;    // cents
  currency: string;
}

export function evalPricing(
  rules: PricingRule[],
  state: Record<string, unknown>,
  currency: string,
): PricingResult {
  const breakdown: PricingBreakdownItem[] = [];

  // Step 1: base rules → subtotal_pre (EUR)
  let subtotal_pre = 0;
  for (const rule of rules) {
    if (rule.kind !== 'base') continue;
    const amount = evalFormula(rule.formula, state);
    subtotal_pre += amount;
    if (rule.visibleInBreakdown !== false) {
      breakdown.push({ ruleId: rule.id, label: rule.label, amount, kind: 'base' });
    }
  }

  // Step 2: add rules (EUR)
  let additions = 0;
  for (const rule of rules) {
    if (rule.kind !== 'add') continue;
    if (!evalCondition(rule.when, state)) continue;
    const amount = evalFormula(rule.formula, state);
    additions += amount;
    breakdown.push({ ruleId: rule.id, label: rule.label, amount, kind: 'add' });
  }

  // Step 3: multiply rules
  let subtotal_post = subtotal_pre + additions;
  for (const rule of rules) {
    if (rule.kind !== 'multiply') continue;
    if (!evalCondition(rule.when, state)) continue;
    const before = subtotal_post;
    subtotal_post = subtotal_post * rule.factor;
    const increase = subtotal_post - before;
    breakdown.push({ ruleId: rule.id, label: rule.label, amount: increase, kind: 'multiply' });
  }

  // Step 4: discount rules (EUR)
  let subtotal_net = subtotal_post;
  for (const rule of rules) {
    if (rule.kind !== 'discount') continue;
    if (!evalCondition(rule.when, state)) continue;
    const amount = evalFormula(rule.formula, state);
    subtotal_net -= amount;
    breakdown.push({ ruleId: rule.id, label: rule.label, amount: -amount, kind: 'discount' });
  }

  // Step 5: vat
  let vat_eur = 0;
  for (const rule of rules) {
    if (rule.kind !== 'vat') continue;
    vat_eur = subtotal_net * rule.rate;
    breakdown.push({ ruleId: rule.id, label: rule.label, amount: vat_eur, kind: 'vat' });
  }

  // Step 6: convert to cents, round
  const subtotal_cents = Math.round(subtotal_net * 100);
  const vat_cents = Math.round(vat_eur * 100);
  const total_cents = Math.round((subtotal_net + vat_eur) * 100);

  // Convert breakdown amounts to cents
  const breakdownCents = breakdown.map(item => ({
    ...item,
    amount: Math.round(item.amount * 100),
  }));

  return {
    breakdown: breakdownCents,
    subtotal: subtotal_cents,
    vat: vat_cents,
    total: total_cents,
    currency,
  };
}
