/**
 * Tiny recursive-descent parser for formula text → Formula AST.
 *
 * Grammar:
 *   EXPR    := SUM
 *   SUM     := PRODUCT (('+'|'-') PRODUCT)*
 *   PRODUCT := UNARY (('*'|'/') UNARY)*
 *   UNARY   := '-'? PRIMARY
 *   PRIMARY := NUMBER | REF | '(' EXPR ')' | FUNC
 *   REF     := '$' IDENT
 *   FUNC    := IDENT '(' (EXPR (',' EXPR)*)? ')'
 */

import type { Formula } from '@forma/types';

type Token =
  | { type: 'num'; value: number }
  | { type: 'ref'; name: string }
  | { type: 'ident'; name: string }
  | { type: 'op'; ch: '+' | '-' | '*' | '/' }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'comma' }
  | { type: 'eof' };

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '$') {
      i++;
      let name = '';
      while (i < src.length && /[\w_]/.test(src[i])) name += src[i++];
      tokens.push({ type: 'ref', name });
      continue;
    }
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(src[i + 1] ?? ''))) {
      let num = '';
      while (i < src.length && /[\d.]/.test(src[i])) num += src[i++];
      tokens.push({ type: 'num', value: parseFloat(num) });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let name = '';
      while (i < src.length && /[\w_]/.test(src[i])) name += src[i++];
      tokens.push({ type: 'ident', name });
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ type: 'op', ch: ch as '+' | '-' | '*' | '/' });
      i++;
      continue;
    }
    if (ch === '(') { tokens.push({ type: 'lparen' }); i++; continue; }
    if (ch === ')') { tokens.push({ type: 'rparen' }); i++; continue; }
    if (ch === ',') { tokens.push({ type: 'comma' }); i++; continue; }
    throw new Error(`Unexpected character '${ch}' at position ${i}`);
  }
  tokens.push({ type: 'eof' });
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token { return this.tokens[this.pos]; }
  private consume(): Token { return this.tokens[this.pos++]; }

  private expect(type: Token['type']): Token {
    const tok = this.peek();
    if (tok.type !== type) throw new Error(`Expected ${type}, got ${tok.type}`);
    return this.consume();
  }

  parseExpr(): Formula { return this.parseSum(); }

  private parseSum(): Formula {
    let left = this.parseProduct();
    while (this.peek().type === 'op') {
      const op = this.peek() as { type: 'op'; ch: '+' | '-' };
      if (op.ch !== '+' && op.ch !== '-') break;
      this.consume();
      const right = this.parseProduct();
      if (op.ch === '+') {
        left = typeof left === 'number' && typeof right === 'number'
          ? left + right
          : { plus: [left, right] };
      } else {
        left = { minus: [left, right] };
      }
    }
    return left;
  }

  private parseProduct(): Formula {
    let left = this.parseUnary();
    while (this.peek().type === 'op') {
      const op = this.peek() as { type: 'op'; ch: '*' | '/' };
      if (op.ch !== '*' && op.ch !== '/') break;
      this.consume();
      const right = this.parseUnary();
      if (op.ch === '*') {
        left = typeof left === 'number' && typeof right === 'number'
          ? left * right
          : { times: [left, right] };
      } else {
        left = { div: [left, right] };
      }
    }
    return left;
  }

  private parseUnary(): Formula {
    if (this.peek().type === 'op' && (this.peek() as { ch: string }).ch === '-') {
      this.consume();
      const inner = this.parsePrimary();
      return typeof inner === 'number' ? -inner : { times: [-1, inner] };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Formula {
    const tok = this.peek();
    if (tok.type === 'num') {
      this.consume();
      return tok.value;
    }
    if (tok.type === 'ref') {
      this.consume();
      return { ref: `$${tok.name}` as `$${string}` };
    }
    if (tok.type === 'lparen') {
      this.consume();
      const inner = this.parseExpr();
      this.expect('rparen');
      return inner;
    }
    if (tok.type === 'ident') {
      this.consume();
      const name = tok.name;
      this.expect('lparen');
      const args: Formula[] = [];
      if (this.peek().type !== 'rparen') {
        args.push(this.parseExpr());
        while (this.peek().type === 'comma') {
          this.consume();
          args.push(this.parseExpr());
        }
      }
      this.expect('rparen');
      return buildBuiltinCall(name, args);
    }
    throw new Error(`Unexpected token: ${tok.type}`);
  }
}

function buildBuiltinCall(name: string, args: Formula[]): Formula {
  switch (name.toLowerCase()) {
    case 'area': {
      if (args.length !== 2) throw new Error('area() requires 2 arguments');
      const [w, d] = args;
      if (typeof w === 'object' && 'ref' in w && typeof d === 'object' && 'ref' in d) {
        return { area: { width: w.ref, depth: d.ref } };
      }
      // Fall back to times if not plain refs
      return { times: [w, d] };
    }
    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

export function parseFormula(src: string): Formula {
  const tokens = tokenize(src);
  const parser = new Parser(tokens);
  const result = parser.parseExpr();
  if (parser['peek']().type !== 'eof') {
    throw new Error('Unexpected tokens after expression');
  }
  return result;
}

export function serialiseFormula(formula: Formula): string {
  if (typeof formula === 'number') return String(formula);
  if ('ref' in formula) return formula.ref;
  if ('times' in formula) return formula.times.map(f => `(${serialiseFormula(f)})`).join(' * ');
  if ('plus' in formula) return formula.plus.map(serialiseFormula).join(' + ');
  if ('minus' in formula) return `${serialiseFormula(formula.minus[0])} - ${serialiseFormula(formula.minus[1])}`;
  if ('div' in formula) return `${serialiseFormula(formula.div[0])} / ${serialiseFormula(formula.div[1])}`;
  if ('area' in formula) return `area(${formula.area.width}, ${formula.area.depth})`;
  if ('table' in formula) return `table(${formula.table.lookup}, ...)`;
  if ('perOption' in formula) return `perOption(${formula.perOption.ref}, ...)`;
  return '?';
}
