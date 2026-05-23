import { describe, it, expect } from 'vitest';
import { evaluate } from '../src/evaluate';
import type { ConfiguratorSchema } from '@forma/types';
import pergolaClassic from '../fixtures/pergola-classic.json';

const schema = pergolaClassic as unknown as ConfiguratorSchema;

describe('evaluate — pergola classic', () => {
  describe('reference state: width=4.2, depth=3.5, color=anthracite, led=true', () => {
    const result = evaluate(schema, {
      width: 4.2,
      depth: 3.5,
      color: 'anthracite',
      led: true,
      heaters: 0,
      promo: '',
    });

    it('total is 590968 cents (€5,909.68)', () => {
      expect(result.pricing.total).toBe(590968);
    });

    it('subtotal is 484400 cents (€4,844)', () => {
      expect(result.pricing.subtotal).toBe(484400);
    });

    it('vat is 106568 cents (€1,065.68)', () => {
      expect(result.pricing.vat).toBe(106568);
    });

    it('currency is EUR', () => {
      expect(result.pricing.currency).toBe('EUR');
    });

    it('score is 15 (led only, phone empty)', () => {
      // led(15); phone='' so neq rule does not fire; width<5 no large; heaters=0
      expect(result.score.total).toBe(15);
      expect(result.score.hot).toBe(false);
    });

    it('no errors with required fields populated', () => {
      const r2 = evaluate(schema, {
        width: 4.2, depth: 3.5, color: 'anthracite', led: true,
        heaters: 0, promo: '', name: 'Test User', email: 'test@test.com',
      });
      expect(r2.errors).toEqual({});
    });

    it('all 4 steps are visible', () => {
      expect(result.visibleSteps).toHaveLength(4);
    });
  });

  describe('default state (no state provided)', () => {
    const result = evaluate(schema, {});

    it('uses field defaults', () => {
      // width default=4, depth default=3, base=4*3*320=3840
      expect(result.pricing.subtotal).toBe(384000);
    });

    it('score is 0 with defaults', () => {
      expect(result.score.total).toBe(0);
      expect(result.score.hot).toBe(false);
    });
  });

  describe('hot lead: large + heaters + phone', () => {
    const result = evaluate(schema, {
      width: 5.5,
      depth: 4.0,
      color: 'walnut',
      led: true,
      heaters: 2,
      phone: '+38641000000',
      promo: '',
    });

    it('is hot', () => expect(result.score.hot).toBe(true));
    it('score ≥ 70', () => expect(result.score.total).toBeGreaterThanOrEqual(70));
  });

  describe('promo discount applies', () => {
    const result = evaluate(schema, {
      width: 4.2,
      depth: 3.5,
      color: 'anthracite',
      led: true,
      heaters: 0,
      promo: 'FIRSTWK1',
    });

    it('promo discount line present', () => {
      const line = result.pricing.breakdown.find(b => b.ruleId === 'promo-firstwk');
      expect(line).toBeDefined();
      expect(line!.amount).toBe(-44400);
    });

    it('subtotal reduced by 444 EUR', () => {
      // subtotal_net = 4844 - 444 = 4400, in cents = 440000
      expect(result.pricing.subtotal).toBe(440000);
    });
  });

  describe('conditional visibility — step visibleIf', () => {
    const schemaWithConditionalStep: ConfiguratorSchema = {
      ...schema,
      steps: [
        ...schema.steps,
        {
          id: 'premium-only',
          label: 'Premium Options',
          visibleIf: { gte: ['$width', 6] },
          fields: [{ id: 'roof_type', type: 'select', label: 'Roof type', options: [] }],
        },
      ],
    };

    it('step hidden when width < 6', () => {
      const r = evaluate(schemaWithConditionalStep, { width: 4.2, depth: 3.5 });
      expect(r.visibleSteps.find(s => s.id === 'premium-only')).toBeUndefined();
    });

    it('step visible when width ≥ 6', () => {
      const r = evaluate(schemaWithConditionalStep, { width: 6.0, depth: 3.5 });
      expect(r.visibleSteps.find(s => s.id === 'premium-only')).toBeDefined();
    });
  });

  describe('field-level conditional visibility', () => {
    const schemaWithConditionalField: ConfiguratorSchema = {
      ...schema,
      steps: [
        {
          id: 'test-step',
          label: 'Test',
          fields: [
            {
              id: 'show_me',
              type: 'checkbox',
              label: 'Show me',
              default: false,
            },
            {
              id: 'hidden_field',
              type: 'text',
              label: 'Revealed',
              visibleIf: { eq: ['$show_me', true] },
            },
          ],
        },
      ],
    };

    it('field hidden when condition false', () => {
      const r = evaluate(schemaWithConditionalField, { show_me: false });
      expect(r.visibleFields['test-step']?.find(f => f.id === 'hidden_field')).toBeUndefined();
    });

    it('field visible when condition true', () => {
      const r = evaluate(schemaWithConditionalField, { show_me: true });
      expect(r.visibleFields['test-step']?.find(f => f.id === 'hidden_field')).toBeDefined();
    });
  });

  describe('snapshot — reference state', () => {
    it('pricing breakdown matches snapshot', () => {
      const result = evaluate(schema, {
        width: 4.2, depth: 3.5, color: 'anthracite', led: true, heaters: 0, promo: '',
      });
      expect(result.pricing).toMatchSnapshot();
    });

    it('scoring matches snapshot', () => {
      const result = evaluate(schema, {
        width: 5.5, depth: 4.0, color: 'walnut', led: true, heaters: 2, phone: '+1',
      });
      expect(result.score).toMatchSnapshot();
    });
  });
});
