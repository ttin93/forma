import { describe, it, expect } from 'vitest';
import { evalPricing } from '../src/pricing';
import type { PricingRule } from '@forma/types';

const rules: PricingRule[] = [
  {
    id: 'base-area',
    kind: 'base',
    label: 'Base · €320/m²',
    formula: { times: [{ area: { width: '$width', depth: '$depth' } }, 320] },
  },
  {
    id: 'color-walnut',
    kind: 'add',
    label: 'Colour surcharge (walnut)',
    when: { eq: ['$color', 'walnut'] },
    formula: { perOption: { ref: '$color', prices: { walnut: 280 } } },
  },
  {
    id: 'reinforced-post',
    kind: 'add',
    label: 'Reinforced post (W ≥ 5m)',
    when: { gte: ['$width', 5] },
    formula: 280,
  },
  {
    id: 'led',
    kind: 'add',
    label: 'LED strip lighting',
    when: { eq: ['$led', true] },
    formula: 140,
  },
  {
    id: 'heater',
    kind: 'add',
    label: 'Infrared heater',
    when: { gt: ['$heaters', 0] },
    formula: { times: [{ ref: '$heaters' }, 210] },
  },
  {
    id: 'promo-firstwk',
    kind: 'discount',
    label: 'First-week buyer discount',
    when: { matches: ['$promo', '^FIRSTWK[0-9]+$'] },
    formula: 444,
  },
  {
    id: 'vat',
    kind: 'vat',
    label: 'VAT (22%)',
    rate: 0.22,
  },
];

describe('evalPricing — reference state', () => {
  // state: width=4.2, depth=3.5, color='anthracite', led=true
  // base = 4.2 * 3.5 * 320 = 4,704 EUR
  // led add = 140 EUR
  // subtotal_net = 4,844 EUR = 484,400 cents
  // VAT 22% = 1,065.68 EUR = 106,568 cents
  // total = 5,909.68 EUR = 590,968 cents

  const result = evalPricing(
    rules,
    { width: 4.2, depth: 3.5, color: 'anthracite', led: true, heaters: 0, promo: '' },
    'EUR',
  );

  it('subtotal is 484400 cents', () => expect(result.subtotal).toBe(484400));
  it('vat is 106568 cents', () => expect(result.vat).toBe(106568));
  it('total is 590968 cents', () => expect(result.total).toBe(590968));
  it('currency is EUR', () => expect(result.currency).toBe('EUR'));

  it('breakdown includes base-area', () => {
    const line = result.breakdown.find(b => b.ruleId === 'base-area');
    expect(line).toBeDefined();
    expect(line?.amount).toBe(470400); // 4704 * 100
    expect(line?.kind).toBe('base');
  });

  it('breakdown includes led', () => {
    const line = result.breakdown.find(b => b.ruleId === 'led');
    expect(line).toBeDefined();
    expect(line?.amount).toBe(14000); // 140 * 100
    expect(line?.kind).toBe('add');
  });

  it('breakdown does NOT include color-walnut (anthracite)', () => {
    expect(result.breakdown.find(b => b.ruleId === 'color-walnut')).toBeUndefined();
  });

  it('breakdown does NOT include reinforced-post (width < 5)', () => {
    expect(result.breakdown.find(b => b.ruleId === 'reinforced-post')).toBeUndefined();
  });

  it('breakdown includes vat', () => {
    const line = result.breakdown.find(b => b.ruleId === 'vat');
    expect(line).toBeDefined();
    expect(line?.kind).toBe('vat');
  });

  it('breakdown length — base + led + vat = 3 items', () => {
    expect(result.breakdown).toHaveLength(3);
  });
});

describe('evalPricing — walnut colour surcharge', () => {
  // base = 4704, add walnut = 280, vat on 4984 = 1096.48 → total = 6080.48 = 608048 cents
  const result = evalPricing(
    rules,
    { width: 4.2, depth: 3.5, color: 'walnut', led: false, heaters: 0, promo: '' },
    'EUR',
  );

  it('subtotal is 498400 cents', () => expect(result.subtotal).toBe(498400));
  it('total includes walnut surcharge', () => expect(result.total).toBe(Math.round(4984 * 1.22 * 100)));
});

describe('evalPricing — heaters', () => {
  // base = 4704, heaters=2 → +420, subtotal_net = 5124, VAT = 1127.28, total = 6251.28
  const result = evalPricing(
    rules,
    { width: 4.2, depth: 3.5, color: 'anthracite', led: false, heaters: 2, promo: '' },
    'EUR',
  );

  it('heater line amount is 42000 cents (2 * 210 * 100)', () => {
    const line = result.breakdown.find(b => b.ruleId === 'heater');
    expect(line?.amount).toBe(42000);
  });

  it('subtotal is 512400 cents (4704 + 420 = 5124 EUR)', () => {
    expect(result.subtotal).toBe(512400);
  });
});

describe('evalPricing — promo discount', () => {
  // base=4704, led=140, discount=444, subtotal_net=4400, VAT=968, total=5368
  const result = evalPricing(
    rules,
    { width: 4.2, depth: 3.5, color: 'anthracite', led: true, heaters: 0, promo: 'FIRSTWK99' },
    'EUR',
  );

  it('discount line is negative 44400 cents', () => {
    const line = result.breakdown.find(b => b.ruleId === 'promo-firstwk');
    expect(line?.amount).toBe(-44400);
    expect(line?.kind).toBe('discount');
  });

  it('subtotal_net is (4704 + 140 - 444) * 100 = 440000', () => {
    expect(result.subtotal).toBe(440000);
  });
});

describe('evalPricing — large pergola with reinforced post', () => {
  // width=5.5, depth=4.0, base=5.5*4*320=7040, reinforced=280, total before VAT=7320
  const result = evalPricing(
    rules,
    { width: 5.5, depth: 4.0, color: 'anthracite', led: false, heaters: 0, promo: '' },
    'EUR',
  );

  it('reinforced-post triggered', () => {
    expect(result.breakdown.find(b => b.ruleId === 'reinforced-post')).toBeDefined();
  });

  it('subtotal is 732000 cents', () => expect(result.subtotal).toBe(732000));
});

describe('evalPricing — multiply rule', () => {
  const multiplyRules: PricingRule[] = [
    { id: 'base', kind: 'base', label: 'Base', formula: 1000 },
    { id: 'rush', kind: 'multiply', label: '20% rush fee', when: { eq: ['$rush', true] }, factor: 1.2 },
    { id: 'vat', kind: 'vat', label: 'VAT', rate: 0.1 },
  ];

  it('multiply factor applies', () => {
    const result = evalPricing(multiplyRules, { rush: true }, 'EUR');
    expect(result.subtotal).toBe(120000); // 1000 * 1.2 = 1200 EUR = 120000 cents
  });

  it('multiply does not apply when condition false', () => {
    const result = evalPricing(multiplyRules, { rush: false }, 'EUR');
    expect(result.subtotal).toBe(100000); // 1000 EUR = 100000 cents
  });
});

describe('evalPricing — no vat rule', () => {
  const noVatRules: PricingRule[] = [
    { id: 'base', kind: 'base', label: 'Base', formula: 500 },
  ];

  it('vat is 0 when no vat rule', () => {
    const result = evalPricing(noVatRules, {}, 'EUR');
    expect(result.vat).toBe(0);
    expect(result.subtotal).toBe(50000);
    expect(result.total).toBe(50000);
  });
});
