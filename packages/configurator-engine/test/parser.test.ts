import { describe, it, expect } from 'vitest';
import { parseFormula, serialiseFormula } from '../src/parser';
import { evalFormula } from '../src/formula';

const s = { width: 4.2, depth: 3.5, x: 10, y: 3 };

describe('parseFormula', () => {
  it('parses number literal', () => {
    expect(parseFormula('320')).toBe(320);
  });

  it('parses float literal', () => {
    expect(parseFormula('3.14')).toBeCloseTo(3.14);
  });

  it('parses ref', () => {
    expect(parseFormula('$width')).toEqual({ ref: '$width' });
  });

  it('parses addition', () => {
    const f = parseFormula('$x + 5');
    expect(evalFormula(f, s)).toBe(15);
  });

  it('parses subtraction', () => {
    const f = parseFormula('$x - $y');
    expect(evalFormula(f, s)).toBe(7);
  });

  it('parses multiplication', () => {
    const f = parseFormula('$x * $y');
    expect(evalFormula(f, s)).toBe(30);
  });

  it('parses division', () => {
    const f = parseFormula('$x / $y');
    expect(evalFormula(f, s)).toBeCloseTo(3.333);
  });

  it('respects precedence: * before +', () => {
    const f = parseFormula('2 + $y * 4');
    expect(evalFormula(f, s)).toBe(14); // 2 + (3*4)
  });

  it('parentheses override precedence', () => {
    const f = parseFormula('(2 + $y) * 4');
    expect(evalFormula(f, s)).toBe(20); // (2+3)*4
  });

  it('parses unary minus on literal', () => {
    const f = parseFormula('-10');
    expect(f).toBe(-10);
  });

  it('parses $width * $depth * 320', () => {
    const f = parseFormula('$width * $depth * 320');
    expect(evalFormula(f, s)).toBeCloseTo(4704);
  });

  it('parses area() function', () => {
    const f = parseFormula('area($width, $depth)');
    expect(evalFormula(f, s)).toBeCloseTo(14.7);
  });

  it('throws on unknown function', () => {
    expect(() => parseFormula('unknown($x)')).toThrow();
  });

  it('throws on unterminated paren', () => {
    expect(() => parseFormula('($x + 1')).toThrow();
  });

  it('throws on unexpected character', () => {
    expect(() => parseFormula('$x @ $y')).toThrow();
  });
});

describe('serialiseFormula', () => {
  it('number → string', () => expect(serialiseFormula(320)).toBe('320'));
  it('ref → $name', () => expect(serialiseFormula({ ref: '$width' })).toBe('$width'));
  it('area → area(w, d)', () => {
    expect(serialiseFormula({ area: { width: '$width', depth: '$depth' } })).toBe('area($width, $depth)');
  });
  it('times → product', () => {
    const s = serialiseFormula({ times: [{ ref: '$width' }, 320] });
    expect(s).toContain('320');
    expect(s).toContain('$width');
  });
});
