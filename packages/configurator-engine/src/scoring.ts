import type { ScoringRule } from '@forma/types';
import { evalCondition } from './condition';

export interface ScoringResult {
  total: number;
  hot: boolean;
  reasons: Array<{ ruleId: string; points: number; reason: string }>;
}

export function evalScoring(
  rules: ScoringRule[],
  state: Record<string, unknown>,
): ScoringResult {
  const reasons: ScoringResult['reasons'] = [];
  let total = 0;

  for (const rule of rules) {
    if (!evalCondition(rule.when, state)) continue;
    total += rule.points;
    reasons.push({ ruleId: rule.id, points: rule.points, reason: rule.reason });
  }

  return { total, hot: total >= 70, reasons };
}
