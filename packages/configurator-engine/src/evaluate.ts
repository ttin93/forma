import type { ConfiguratorSchema, Step, Field, EvaluateResult } from '@forma/types';
import { evalCondition } from './condition';
import { evalPricing } from './pricing';
import { evalScoring } from './scoring';

function typeDefault(field: Field): unknown {
  switch (field.type) {
    case 'number-slider': return field.default;
    case 'number-input': return field.default ?? 0;
    case 'quantity':     return field.default ?? 0;
    case 'checkbox':     return field.default ?? false;
    case 'multi-select': return field.default ?? [];
    case 'select':       return field.default ?? '';
    case 'radio':        return field.default ?? '';
    case 'swatch':       return field.default ?? '';
    case 'image-pick':   return field.default ?? '';
    case 'text':         return field.default ?? '';
    default:             return '';
  }
}

function resolveFieldDefaults(
  schema: ConfiguratorSchema,
  state: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const step of schema.steps) {
    for (const field of step.fields) {
      merged[field.id] = field.id in state ? state[field.id] : typeDefault(field);
    }
  }
  // Include any extra state keys the caller provided
  for (const [k, v] of Object.entries(state)) {
    if (!(k in merged)) merged[k] = v;
  }
  return merged;
}

function evalVisibility(
  schema: ConfiguratorSchema,
  state: Record<string, unknown>,
): { visibleSteps: Step[]; visibleFields: Record<string, Field[]> } {
  const visibleSteps: Step[] = [];
  const visibleFields: Record<string, Field[]> = {};

  for (const step of schema.steps) {
    if (step.visibleIf && !evalCondition(step.visibleIf, state)) continue;
    visibleSteps.push(step);

    const fields: Field[] = [];
    for (const field of step.fields) {
      if (field.visibleIf && !evalCondition(field.visibleIf, state)) continue;
      fields.push(field);
    }
    visibleFields[step.id] = fields;
  }

  return { visibleSteps, visibleFields };
}

function evalValidation(
  visibleFields: Record<string, Field[]>,
  state: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const fields of Object.values(visibleFields)) {
    for (const field of fields) {
      const val = state[field.id];

      if (field.required && (val === undefined || val === null || val === '')) {
        errors[field.id] = 'This field is required';
        continue;
      }

      if (field.validateWith && val !== undefined) {
        if (!evalCondition(field.validateWith, state)) {
          errors[field.id] = 'Invalid value';
        }
      }
    }
  }

  return errors;
}

export function evaluate(
  schema: ConfiguratorSchema,
  state: Record<string, unknown>,
): EvaluateResult {
  const resolvedState = resolveFieldDefaults(schema, state);
  const { visibleSteps, visibleFields } = evalVisibility(schema, resolvedState);
  const errors = evalValidation(visibleFields, resolvedState);
  const pricing = evalPricing(schema.pricing, resolvedState, schema.currency);
  const score = evalScoring(schema.scoring, resolvedState);

  return { visibleSteps, visibleFields, errors, pricing, score };
}
